import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import './components.css';

interface DeliveryModalProps {
  initialAddress?: string;
  onSave: (address: DeliveryAddress) => void;
  onClose: () => void;
}

export interface DeliveryAddress {
  address: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
}

interface DeliveryZone {
  id: number;
  name: string;
  color: string;
  coordinates: number[][];
  delivery_fee: number;
  min_order: number;
  estimated_time: string;
  is_active: boolean;
}

const TWOGIS_API_KEY = import.meta.env.VITE_2GIS_API_KEY || '';
const DEFAULT_CENTER: [number, number] = [71.4491, 51.1694];

declare global {
  interface Window {
    mapgl: any;
  }
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({
  initialAddress = '',
  onSave,
  onClose,
}: DeliveryModalProps) => {
  const [address, setAddress] = useState(initialAddress);
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [activeTab, setActiveTab] = useState<'delivery' | 'pickup'>('delivery');
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [mapError, setMapError] = useState<string | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isMapHovered, setIsMapHovered] = useState(false);
    const [pointerAddress, setPointerAddress] = useState('');
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const reverseGeocodeAbortRef = useRef<AbortController | null>(null);
  const lastGeocodedAddressRef = useRef<string>('');
  const lastReverseGeocodedKeyRef = useRef<string>('');

    useEffect(() => {
      let ignore = false;
      const loadZones = async () => {
        try {
          const data = await api.getDeliveryZones();
          if (!ignore) {
            setZones(Array.isArray(data) ? data.filter((zone: DeliveryZone) => zone.is_active) : []);
          }
        } catch (err) {
          console.error('Не удалось загрузить зоны доставки', err);
        }
      };

      loadZones();
      return () => {
        ignore = true;
      };
    }, []);

    useEffect(() => {
      const initMap = () => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        if (!TWOGIS_API_KEY) {
          setMapError('Отсутствует API ключ 2ГИС. Добавьте VITE_2GIS_API_KEY в окружение.');
          return;
        }

        try {
          const map = new window.mapgl.Map(mapContainerRef.current, {
            key: TWOGIS_API_KEY,
            center: DEFAULT_CENTER,
            zoom: 12,
          });

          mapInstanceRef.current = map;
          setMapLoaded(true);
          setMapError(null);
          setSelectedCoords([DEFAULT_CENTER[1], DEFAULT_CENTER[0]]);

          map.on('moveend', () => {
            const center = map.getCenter();
            if (Array.isArray(center) && center.length === 2) {
              setSelectedCoords([center[1], center[0]]);
            }
          });

          map.on('click', (event: any) => {
            const coords: [number, number] | undefined = Array.isArray(event.lngLat)
              ? event.lngLat
              : Array.isArray(event.detail?.lngLat)
              ? event.detail.lngLat
              : undefined;

            if (coords && coords.length === 2) {
              map.setCenter(coords);
              setSelectedCoords([coords[1], coords[0]]);
            }
          });
        } catch (err) {
          console.error('Ошибка инициализации карты доставки:', err);
          setMapError('Не удалось инициализировать карту доставки');
        }
      };

      if (window.mapgl) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://mapgl.2gis.com/api/js/v1';
      script.async = true;
      script.onload = initMap;
      script.onerror = () => {
        console.error('Ошибка загрузки скрипта 2ГИС');
        setMapError('Не удалось загрузить карту 2ГИС');
      };
      document.head.appendChild(script);

      return () => {
        script.onload = null;
      };
    }, []);

    useEffect(() => {
      if (!mapInstanceRef.current || !mapLoaded) return;

      polygonsRef.current.forEach((shape: { destroy: () => void }) => {
        try {
          shape.destroy();
        } catch (err) {
          console.error('Ошибка при очистке полигона доставки:', err);
        }
      });
      polygonsRef.current = [];

      zones.forEach((zone: DeliveryZone) => {
        if (!zone.coordinates || zone.coordinates.length === 0) return;

        try {
          const coords = zone.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          const polygon = new window.mapgl.Polygon(mapInstanceRef.current, {
            coordinates: [coords],
            fillColor: zone.color,
            fillOpacity: 0.25,
            strokeColor: zone.color,
            strokeWidth: 2,
          });
          polygonsRef.current.push(polygon);
        } catch (err) {
          console.error(`Ошибка отрисовки зоны ${zone.name}:`, err);
        }
      });
    }, [zones, mapLoaded]);

    useEffect(() => {
      return () => {
  geocodeAbortRef.current?.abort();
  reverseGeocodeAbortRef.current?.abort();

        polygonsRef.current.forEach((shape: { destroy: () => void }) => {
          try {
            shape.destroy();
          } catch (err) {
            console.error('Ошибка при удалении полигона доставки:', err);
          }
        });
        polygonsRef.current = [];

        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.destroy();
          } catch (err) {
            console.error('Ошибка при удалении карты доставки:', err);
          }
          mapInstanceRef.current = null;
        }
      };
    }, []);

    const geocodeAddress = useCallback(
      async (query: string): Promise<boolean> => {
        if (!TWOGIS_API_KEY || query.length < 3 || !mapInstanceRef.current) {
          return false;
        }

        geocodeAbortRef.current?.abort();
        const controller = new AbortController();
        geocodeAbortRef.current = controller;
        setIsGeocoding(true);

        try {
          const url = new URL('https://catalog.api.2gis.com/3.0/items');
          url.searchParams.set('q', query);
          url.searchParams.set('page_size', '1');
          url.searchParams.set('fields', 'items.point');
          url.searchParams.set('sort', 'relevance');
          url.searchParams.set('key', TWOGIS_API_KEY);

          const response = await fetch(url.toString(), { signal: controller.signal });
          if (!response.ok) {
            throw new Error(`Код ответа ${response.status}`);
          }

          const data = await response.json();
          const point = data?.result?.items?.[0]?.point;
          if (point?.lon && point?.lat) {
            const target: [number, number] = [Number(point.lon), Number(point.lat)];
            mapInstanceRef.current.setCenter(target);
            setSelectedCoords([target[1], target[0]]);
            return true;
          }
        } catch (err) {
          if (!(err instanceof DOMException && err.name === 'AbortError')) {
            console.error('Ошибка геокодирования адреса 2ГИС', err);
          }
        } finally {
          if (geocodeAbortRef.current === controller) {
            geocodeAbortRef.current = null;
          }
          setIsGeocoding(false);
        }

        return false;
      },
      []
    );

    useEffect(() => {
      if (!mapInstanceRef.current || !mapLoaded) return;
      const trimmed = address.trim();
      if (!trimmed || trimmed === lastGeocodedAddressRef.current) {
        return;
      }

      const handle = window.setTimeout(async () => {
        const success = await geocodeAddress(trimmed);
        if (success) {
          lastGeocodedAddressRef.current = trimmed;
        }
      }, 800);

      return () => {
        window.clearTimeout(handle);
      };
    }, [address, geocodeAddress, mapLoaded]);

    useEffect(() => {
      if (!TWOGIS_API_KEY || !selectedCoords) {
        return;
      }

      const coordsKey = `${selectedCoords[0].toFixed(5)},${selectedCoords[1].toFixed(5)}`;
      if (coordsKey === lastReverseGeocodedKeyRef.current) {
        return;
      }

      const handle = window.setTimeout(async () => {
        reverseGeocodeAbortRef.current?.abort();
        const controller = new AbortController();
        reverseGeocodeAbortRef.current = controller;
        setIsReverseGeocoding(true);

        try {
          const url = new URL('https://catalog.api.2gis.com/3.0/items/geocode');
          url.searchParams.set('lat', selectedCoords[0].toString());
          url.searchParams.set('lon', selectedCoords[1].toString());
          url.searchParams.set('page_size', '1');
          url.searchParams.set('fields', 'items.address_name,items.full_address_name');
          url.searchParams.set('key', TWOGIS_API_KEY);

          const response = await fetch(url.toString(), { signal: controller.signal });
          if (!response.ok) {
            throw new Error(`Код ответа ${response.status}`);
          }

          const data = await response.json();
          const item = data?.result?.items?.[0];
          const resolvedAddress = (item?.full_address_name || item?.address_name || '').trim();
          lastReverseGeocodedKeyRef.current = coordsKey;

          if (resolvedAddress) {
            setPointerAddress(resolvedAddress);

            if (resolvedAddress !== address.trim()) {
              lastGeocodedAddressRef.current = resolvedAddress;
              setAddress(resolvedAddress);
            }
          } else {
            setPointerAddress('');
          }
        } catch (err) {
          if (!(err instanceof DOMException && err.name === 'AbortError')) {
            console.error('Ошибка обратного геокодирования 2ГИС', err);
          }
        } finally {
          if (reverseGeocodeAbortRef.current === controller) {
            reverseGeocodeAbortRef.current = null;
          }
          setIsReverseGeocoding(false);
        }
      }, 600);

      return () => {
        window.clearTimeout(handle);
      };
  }, [selectedCoords, address]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (activeTab === 'delivery') {
        if (!address.trim()) {
          alert('Пожалуйста, введите адрес доставки');
          return;
        }

        onSave({
          address: address.trim(),
          apartment: apartment.trim(),
          entrance: entrance.trim(),
          floor: floor.trim(),
        });
      } else {
        // Pickup mode
        onSave({
          address: 'Астана, ул. Култегин, 19',
          apartment: '',
          entrance: '',
          floor: '',
        });
      }
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal delivery-modal delivery-modal-new"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <div className="modal-header delivery-modal-header">
            <h2 className="modal-title">На какой адрес доставить?</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit} className="delivery-form-new">
              {/* Tabs */}
              <div className="delivery-tabs">
                <button
                  type="button"
                  className={`delivery-tab ${activeTab === 'delivery' ? 'active' : ''}`}
                  onClick={() => setActiveTab('delivery')}
                >
                  Доставка
                </button>
                <button
                  type="button"
                  className={`delivery-tab ${activeTab === 'pickup' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pickup')}
                >
                  Самовывоз
                </button>
              </div>

              {activeTab === 'delivery' && (
                <>
                  {/* Address Field */}
                  <div className="delivery-field-group">
                    <label className="delivery-field-label">Адрес доставки</label>
                    <input
                      type="text"
                      className="delivery-input-new"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Астана, ул. Култегин, 19"
                      required
                    />
                  </div>

                  {/* Apartment, Entrance, Floor Grid */}
                  <div className="delivery-details-grid-new">
                    <div className="delivery-field-group">
                      <label className="delivery-field-label">Квартира</label>
                      <input
                        type="text"
                        className="delivery-input-new"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        placeholder="130"
                      />
                    </div>
                    <div className="delivery-field-group">
                      <label className="delivery-field-label">Подъезд</label>
                      <input
                        type="text"
                        className="delivery-input-new"
                        value={entrance}
                        onChange={(e) => setEntrance(e.target.value)}
                        placeholder="2"
                      />
                    </div>
                    <div className="delivery-field-group">
                      <label className="delivery-field-label">Этаж</label>
                      <input
                        type="text"
                        className="delivery-input-new"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        placeholder="7"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="delivery-submit-btn-new">
                    Готово
                  </button>
                </>
              )}

              {activeTab === 'pickup' && (
                <div className="delivery-pickup-content">
                  <div className="delivery-field-group">
                    <label className="delivery-field-label">Адрес самовывоза</label>
                    <input
                      type="text"
                      className="delivery-input-new"
                      value="Астана, ул. Култегин, 19"
                      readOnly
                    />
                  </div>
                  <button type="submit" className="delivery-submit-btn-new">
                    Готово
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  };

  export default DeliveryModal;
