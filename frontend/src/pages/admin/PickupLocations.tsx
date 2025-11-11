import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuthStore } from '../../store';
import api from '../../services/api';
import { PickupLocation } from '../../types';
import '../../components/components.css';

const DEFAULT_CENTER: [number, number] = [71.4306, 51.1289];
const TWOGIS_API_KEY = import.meta.env.VITE_2GIS_API_KEY || '';

declare global {
  interface Window {
    mapgl: any;
  }
}

type PickupFormState = {
  id?: number;
  title: string;
  address: string;
  working_hours: string;
  phone: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  display_order: number;
};

const buildEmptyForm = (order = 0): PickupFormState => ({
  title: '',
  address: '',
  working_hours: '',
  phone: '',
  latitude: DEFAULT_CENTER[1],
  longitude: DEFAULT_CENTER[0],
  is_active: true,
  display_order: order,
});

interface PickupLocationModalProps {
  data: PickupFormState;
  onClose: () => void;
  onSubmit: (data: PickupFormState) => Promise<void>;
  isSubmitting: boolean;
}

const PickupLocationModal: React.FC<PickupLocationModalProps> = ({ data, onClose, onSubmit, isSubmitting }) => {
  const [form, setForm] = useState<PickupFormState>(data);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    setForm(data);
  }, [data]);

  useEffect(() => {
    if (!TWOGIS_API_KEY) {
      setMapError('Отсутствует API ключ 2ГИС. Добавьте VITE_2GIS_API_KEY в окружение.');
      return;
    }

    const initMap = () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      try {
        const map = new window.mapgl.Map(mapContainerRef.current, {
          key: TWOGIS_API_KEY,
          center: [form.longitude, form.latitude],
          zoom: 14,
        });

        mapInstanceRef.current = map;
        setMapError(null);

        const syncFromCenter = () => {
          const center = map.getCenter();
          if (Array.isArray(center) && center.length === 2) {
            setForm((prev) => ({
              ...prev,
              longitude: Number(center[0].toFixed(6)),
              latitude: Number(center[1].toFixed(6)),
            }));
          }
        };

        map.on('moveend', syncFromCenter);
        map.on('click', (event: any) => {
          const coords: [number, number] | undefined = Array.isArray(event.lngLat)
            ? event.lngLat
            : Array.isArray(event.detail?.lngLat)
            ? event.detail.lngLat
            : undefined;

          if (coords) {
            map.setCenter(coords);
          }
        });
      } catch (err) {
        console.error('Ошибка инициализации карты самовывоза', err);
        setMapError('Не удалось инициализировать карту 2ГИС');
      }
    };

    if (window.mapgl) {
      initMap();
      return () => {
        markersRef.current.forEach((marker) => {
          try {
            marker.destroy();
          } catch (err) {
            console.error('Ошибка очистки маркера самовывоза', err);
          }
        });
        markersRef.current = [];
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }
      };
    }

    const script = document.createElement('script');
    script.src = 'https://mapgl.2gis.com/api/js/v1';
    script.async = true;
    script.onload = initMap;
    script.onerror = () => setMapError('Не удалось загрузить карту 2ГИС');
    document.head.appendChild(script);

    return () => {
      script.onload = null;
      markersRef.current.forEach((marker) => {
        try {
          marker.destroy();
        } catch (err) {
          console.error('Ошибка очистки маркера самовывоза', err);
        }
      });
      markersRef.current = [];
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([form.longitude, form.latitude]);
    }
  }, [form.latitude, form.longitude]);

  const handleChange = (field: keyof PickupFormState, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      setForm((prev) => {
        const nextState = {
          ...prev,
          [field]: numeric,
        } as PickupFormState;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter([nextState.longitude, nextState.latitude]);
        }
        return nextState;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim() || !form.address.trim() || !form.working_hours.trim()) {
      alert('Заполните название, адрес и время работы');
      return;
    }

    await onSubmit({ ...form, title: form.title.trim(), address: form.address.trim(), working_hours: form.working_hours.trim(), phone: form.phone.trim() });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large pickup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{form.id ? 'Редактировать точку самовывоза' : 'Новая точка самовывоза'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body pickup-modal-body">
            <div className="pickup-modal-form">
              <div className="form-field">
                <label>Название *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Астана, улица..."
                  required
                />
              </div>

              <div className="form-field">
                <label>Адрес *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Полный адрес"
                  required
                />
              </div>

              <div className="form-field">
                <label>Время работы *</label>
                <input
                  type="text"
                  value={form.working_hours}
                  onChange={(e) => handleChange('working_hours', e.target.value)}
                  placeholder="10:00 — 22:20"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Телефон</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+7 (...)"
                  />
                </div>
                <div className="form-field">
                  <label>Порядок отображения</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => handleChange('display_order', Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Широта</label>
                  <input
                    type="number"
                    value={form.latitude}
                    step={0.000001}
                    onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Долгота</label>
                  <input
                    type="number"
                    value={form.longitude}
                    step={0.000001}
                    onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                  />
                </div>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                />
                <span>Активная точка</span>
              </label>
            </div>

            <div className="pickup-modal-map-section">
              <div className="delivery-map real-map" ref={mapContainerRef}>
                <div className="delivery-map-pointer-overlay" aria-hidden="true">
                  <div className="delivery-map-pointer-pin" />
                  <div className="delivery-map-pointer-shadow" />
                </div>
                <div className="pickup-map-badge">{form.title || 'Укажите точку на карте'}</div>
                {mapError && (
                  <div className="delivery-map-placeholder">
                    <div className="delivery-map-marker">⚠️</div>
                    <div className="delivery-map-location">{mapError}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Сохраняем…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const sortLocations = (list: PickupLocation[]) =>
  [...list].sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return a.id - b.id;
  });

const PickupLocationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<PickupFormState>(buildEmptyForm());
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    loadLocations();
  }, []);

  useEffect(() => {
    if (!TWOGIS_API_KEY) {
      setMapError('Отсутствует API ключ 2ГИС. Добавьте VITE_2GIS_API_KEY.');
      return;
    }

    const initMap = () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      try {
        const map = new window.mapgl.Map(mapContainerRef.current, {
          key: TWOGIS_API_KEY,
          center: [DEFAULT_CENTER[0], DEFAULT_CENTER[1]],
          zoom: 12,
        });
        mapInstanceRef.current = map;
        setMapError(null);
      } catch (err) {
        console.error('Ошибка инициализации карты точек самовывоза', err);
        setMapError('Не удалось инициализировать карту 2ГИС');
      }
    };

    if (window.mapgl) {
      initMap();
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }
      };
    }

    const script = document.createElement('script');
    script.src = 'https://mapgl.2gis.com/api/js/v1';
    script.async = true;
    script.onload = initMap;
    script.onerror = () => setMapError('Не удалось загрузить карту 2ГИС');
    document.head.appendChild(script);

    return () => {
      script.onload = null;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const selected = locations.find((loc) => loc.id === selectedId) || locations[0];
    if (selected && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([selected.longitude, selected.latitude]);
      mapInstanceRef.current.setZoom(13);
    }
  }, [locations, selectedId]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.mapgl) {
      return;
    }

    markersRef.current.forEach((marker) => {
      try {
        marker.destroy();
      } catch (err) {
        console.error('Ошибка удаления маркера самовывоза', err);
      }
    });
    markersRef.current = [];

    locations.forEach((location) => {
      try {
        const marker = new window.mapgl.Marker(mapInstanceRef.current, {
          coordinates: [location.longitude, location.latitude],
        });
        markersRef.current.push(marker);
      } catch (err) {
        console.error('Ошибка создания маркера точки самовывоза', err);
      }
    });

    return () => {
      markersRef.current.forEach((marker) => {
        try {
          marker.destroy();
        } catch (err) {
          console.error('Ошибка очистки маркера самовывоза', err);
        }
      });
      markersRef.current = [];
    };
  }, [locations]);

  const selectedLocation = useMemo(() => {
    return locations.find((loc) => loc.id === selectedId) || null;
  }, [locations, selectedId]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await api.getPickupLocations();
      const sorted = sortLocations(data);
      setLocations(sorted);
      setSelectedId(sorted.length > 0 ? sorted[0].id : null);
    } catch (err) {
      console.error('Не удалось загрузить точки самовывоза', err);
      setError('Не удалось загрузить точки самовывоза');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    const nextOrder = locations.length > 0 ? Math.max(...locations.map((l) => l.display_order)) + 1 : 0;
    setModalData(buildEmptyForm(nextOrder));
    setModalOpen(true);
  };

  const handleEdit = (location: PickupLocation) => {
    setModalData({
      id: location.id,
      title: location.title,
      address: location.address,
      working_hours: location.working_hours,
      phone: location.phone || '',
      latitude: location.latitude,
      longitude: location.longitude,
      is_active: location.is_active,
      display_order: location.display_order,
    });
    setModalOpen(true);
  };

  const handleDelete = async (location: PickupLocation) => {
    if (!confirm(`Удалить точку \"${location.title}\"?`)) {
      return;
    }
    try {
      await api.deletePickupLocation(location.id);
      setLocations((prev) => prev.filter((item) => item.id !== location.id));
      if (selectedId === location.id) {
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Не удалось удалить точку самовывоза', err);
      alert('Не удалось удалить точку самовывоза');
    }
  };

  const handleToggleActive = async (location: PickupLocation) => {
    try {
      const updated = await api.updatePickupLocation(location.id, { is_active: !location.is_active });
      setLocations((prev) => sortLocations(prev.map((item) => (item.id === updated.id ? updated : item))));
    } catch (err) {
      console.error('Не удалось обновить точку самовывоза', err);
      alert('Не удалось обновить точку самовывоза');
    }
  };

  const handleModalSubmit = async (payload: PickupFormState) => {
    setSaving(true);
    try {
      const requestData = {
        title: payload.title,
        address: payload.address,
        working_hours: payload.working_hours,
        phone: payload.phone || null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        is_active: payload.is_active,
        display_order: payload.display_order,
      };

      if (payload.id) {
        const updated = await api.updatePickupLocation(payload.id, requestData);
        setLocations((prev) => sortLocations(prev.map((item) => (item.id === updated.id ? updated : item))));
        setSelectedId(updated.id);
      } else {
        const created = await api.createPickupLocation(requestData);
        setLocations((prev) => sortLocations([...prev, created]));
        setSelectedId(created.id);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Не удалось сохранить точку самовывоза', err);
      alert('Не удалось сохранить точку самовывоза');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content admin-content--wide">
        <div className="admin-page">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">Точки самовывоза</h1>
              <p className="admin-page-subtitle">Управляйте адресами самовывоза, отображаемыми в приложении</p>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>
              + Добавить точку
            </button>
          </div>

          {error && <div className="admin-banner error">{error}</div>}

          {loading ? (
            <div className="delivery-map-placeholder" style={{ minHeight: '200px' }}>
              <div className="delivery-map-marker">⏳</div>
              <div className="delivery-map-location">Загрузка точек самовывоза…</div>
            </div>
          ) : (
            <div className="pickup-layout">
              <div className="pickup-sidebar">
                <div className="pickup-sidebar-header">
                  <h2>Локации</h2>
                  <button className="btn btn-secondary btn-sm" onClick={handleAdd}>
                    Новая точка
                  </button>
                </div>

                {locations.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📍</div>
                    <p>Нет точек самовывоза</p>
                    <button className="btn btn-secondary" onClick={handleAdd}>
                      Добавить первую
                    </button>
                  </div>
                ) : (
                  <div className="pickup-list">
                    {locations.map((location) => {
                      const isSelected = selectedLocation?.id === location.id;
                      return (
                        <div
                          key={location.id}
                          className={`pickup-card${isSelected ? ' active' : ''}${!location.is_active ? ' inactive' : ''}`}
                        >
                          <div className="pickup-card-header">
                            <input
                              type="radio"
                              className="pickup-card-radio"
                              checked={isSelected}
                              onChange={() => setSelectedId(location.id)}
                            />
                            <div className="pickup-card-body">
                              <div className="pickup-card-title">{location.title}</div>
                              <div className="pickup-card-hours">{location.working_hours}</div>
                              <div className="pickup-card-address">{location.address}</div>
                              {location.phone && (
                                <div className="pickup-card-phone">{location.phone}</div>
                              )}
                            </div>
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={location.is_active}
                                onChange={() => handleToggleActive(location)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </div>
                          <div className="pickup-card-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(location)}>
                              Изменить
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(location)}>
                              Удалить
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pickup-map-wrapper">
                <div className="pickup-map" ref={mapContainerRef}>
                  <div className="delivery-map-pointer-overlay" aria-hidden="true">
                    <div className="delivery-map-pointer-pin" />
                    <div className="delivery-map-pointer-shadow" />
                  </div>
                  <div className="pickup-map-badge">
                    {selectedLocation ? selectedLocation.title : 'Выберите точку из списка'}
                  </div>
                  {mapError && (
                    <div className="delivery-map-placeholder">
                      <div className="delivery-map-marker">⚠️</div>
                      <div className="delivery-map-location">{mapError}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <PickupLocationModal
          data={modalData}
          onClose={() => setModalOpen(false)}
          onSubmit={handleModalSubmit}
          isSubmitting={saving}
        />
      )}
    </div>
  );
};

export default PickupLocationsPage;
