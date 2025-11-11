import React, { useEffect, useRef, useState } from 'react';

interface DeliveryZone {
  id: number;
  name: string;
  color: string;
  coordinates?: number[][];
  deliveryFee: number;
  minOrder: number;
  estimatedTime: string;
  active: boolean;
}

interface YandexMapProps {
  zones: DeliveryZone[];
  center?: [number, number];
  zoom?: number;
  onZoneClick?: (zone: DeliveryZone) => void;
  height?: string;
  apiKey: string;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const YandexMap: React.FC<YandexMapProps> = ({
  zones,
  center = [51.1694, 71.4491], // Астана координаты по умолчанию
  zoom = 11,
  onZoneClick,
  height = '500px',
  apiKey,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем, загружен ли уже скрипт Яндекс.Карт
    if (window.ymaps) {
      initMap();
      return;
    }

    // Загружаем скрипт Яндекс.Карт
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(initMap);
    };
    script.onerror = () => {
      setError('Не удалось загрузить Яндекс.Карты');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Очистка при размонтировании
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, [apiKey]);

  useEffect(() => {
    // Обновляем зоны при изменении
    if (mapInstanceRef.current && window.ymaps) {
      updateZones();
    }
  }, [zones]);

  const initMap = () => {
    if (!mapRef.current || !window.ymaps) return;

    try {
      // Создаем карту
      const map = new window.ymaps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        controls: ['zoomControl', 'fullscreenControl', 'geolocationControl'],
      });

      mapInstanceRef.current = map;
      setIsLoading(false);

      // Добавляем зоны на карту
      updateZones();
    } catch (err) {
      console.error('Ошибка инициализации карты:', err);
      setError('Ошибка инициализации карты');
      setIsLoading(false);
    }
  };

  const updateZones = () => {
    if (!mapInstanceRef.current || !window.ymaps) return;

    const map = mapInstanceRef.current;

    // Удаляем все существующие объекты
    map.geoObjects.removeAll();

    // Добавляем активные зоны
    zones.forEach((zone) => {
      if (!zone.active || !zone.coordinates || zone.coordinates.length === 0) return;

      try {
        // Создаем полигон для зоны
        const polygon = new window.ymaps.Polygon(
          [zone.coordinates],
          {
            hintContent: zone.name,
            balloonContent: `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">${zone.name}</h3>
                <p style="margin: 4px 0;"><strong>Стоимость доставки:</strong> ${zone.deliveryFee} ₸</p>
                <p style="margin: 4px 0;"><strong>Минимальный заказ:</strong> ${zone.minOrder} ₸</p>
                <p style="margin: 4px 0;"><strong>Время доставки:</strong> ${zone.estimatedTime}</p>
              </div>
            `,
          },
          {
            fillColor: zone.color,
            fillOpacity: 0.3,
            strokeColor: zone.color,
            strokeOpacity: 0.8,
            strokeWidth: 2,
          }
        );

        // Добавляем обработчик клика
        if (onZoneClick) {
          polygon.events.add('click', () => {
            onZoneClick(zone);
          });
        }

        map.geoObjects.add(polygon);

        // Добавляем метку с названием зоны в центре
        if (zone.coordinates.length > 0) {
          const bounds = polygon.geometry.getBounds();
          const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
          const centerLon = (bounds[0][1] + bounds[1][1]) / 2;

          const placemark = new window.ymaps.Placemark(
            [centerLat, centerLon],
            {
              iconContent: zone.name,
            },
            {
              preset: 'islands#circleDotIcon',
              iconColor: zone.color,
            }
          );

          map.geoObjects.add(placemark);
        }
      } catch (err) {
        console.error(`Ошибка добавления зоны ${zone.name}:`, err);
      }
    });

    // Автоматически масштабируем карту, чтобы показать все зоны
    if (zones.length > 0 && zones.some(z => z.active && z.coordinates)) {
      try {
        map.setBounds(map.geoObjects.getBounds(), {
          checkZoomRange: true,
          zoomMargin: 50,
        });
      } catch (err) {
        console.error('Ошибка масштабирования:', err);
      }
    }
  };

  if (error) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        color: '#e74c3c',
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px', fontSize: '24px' }}>🗺️</div>
            <div>Загрузка карты...</div>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

export default YandexMap;
