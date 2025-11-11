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

interface ZoneEditorMapProps {
  zone: DeliveryZone;
  onCoordinatesChange: (coordinates: number[][]) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  apiKey: string;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const ZoneEditorMap: React.FC<ZoneEditorMapProps> = ({
  zone,
  onCoordinatesChange,
  center = [51.1694, 71.4491],
  zoom = 12,
  height = '400px',
  apiKey,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (window.ymaps) {
      initMap();
      return;
    }

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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, [apiKey]);

  const initMap = () => {
    if (!mapRef.current || !window.ymaps) return;

    try {
      const map = new window.ymaps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        controls: ['zoomControl', 'fullscreenControl', 'geolocationControl'],
      });

      mapInstanceRef.current = map;
      setIsLoading(false);

      // Если есть существующие координаты, отображаем их
      if (zone.coordinates && zone.coordinates.length > 0) {
        displayExistingZone();
      }
    } catch (err) {
      console.error('Ошибка инициализации карты:', err);
      setError('Ошибка инициализации карты');
      setIsLoading(false);
    }
  };

  const displayExistingZone = () => {
    if (!mapInstanceRef.current || !zone.coordinates) return;

    const map = mapInstanceRef.current;

    const polygon = new window.ymaps.Polygon(
      [zone.coordinates],
      {},
      {
        fillColor: zone.color,
        fillOpacity: 0.3,
        strokeColor: zone.color,
        strokeOpacity: 0.8,
        strokeWidth: 2,
        editorDrawingCursor: 'crosshair',
        editorMaxPoints: 50,
      }
    );

    polygonRef.current = polygon;
    map.geoObjects.add(polygon);

    // Включаем редактор полигона
    polygon.editor.startEditing();

    // Слушаем изменения геометрии
    polygon.geometry.events.add('change', () => {
      const coords = polygon.geometry.getCoordinates()[0];
      onCoordinatesChange(coords);
    });

    // Масштабируем карту к полигону
    map.setBounds(polygon.geometry.getBounds(), {
      checkZoomRange: true,
      zoomMargin: 50,
    });
  };

  const startDrawing = () => {
    if (!mapInstanceRef.current || !window.ymaps) return;

    const map = mapInstanceRef.current;

    // Удаляем существующий полигон, если есть
    if (polygonRef.current) {
      map.geoObjects.remove(polygonRef.current);
      polygonRef.current = null;
    }

    setIsDrawing(true);

    // Создаем новый полигон в режиме рисования
    const polygon = new window.ymaps.Polygon(
      [[]],
      {},
      {
        fillColor: zone.color,
        fillOpacity: 0.3,
        strokeColor: zone.color,
        strokeOpacity: 0.8,
        strokeWidth: 2,
        editorDrawingCursor: 'crosshair',
        editorMaxPoints: 50,
      }
    );

    polygonRef.current = polygon;
    map.geoObjects.add(polygon);

    // Включаем режим рисования
    polygon.editor.startDrawing();

    // Слушаем завершение рисования
    polygon.editor.events.add('drawingstop', () => {
      const coords = polygon.geometry.getCoordinates()[0];
      if (coords && coords.length >= 3) {
        onCoordinatesChange(coords);
        // Переключаемся в режим редактирования
        polygon.editor.stopDrawing();
        polygon.editor.startEditing();
      }
      setIsDrawing(false);
    });

    // Слушаем изменения во время редактирования
    polygon.geometry.events.add('change', () => {
      const coords = polygon.geometry.getCoordinates()[0];
      if (coords && coords.length >= 3) {
        onCoordinatesChange(coords);
      }
    });
  };

  const clearZone = () => {
    if (!mapInstanceRef.current || !polygonRef.current) return;

    mapInstanceRef.current.geoObjects.remove(polygonRef.current);
    polygonRef.current = null;
    onCoordinatesChange([]);
    setIsDrawing(false);
  };

  if (error) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          color: '#e74c3c',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={startDrawing}
          disabled={isDrawing}
        >
          {zone.coordinates && zone.coordinates.length > 0 ? 'Перерисовать зону' : 'Нарисовать зону'}
        </button>
        {polygonRef.current && (
          <button type="button" className="btn btn-danger btn-sm" onClick={clearZone}>
            Очистить
          </button>
        )}
        <span style={{ fontSize: '14px', color: '#666' }}>
          {isDrawing
            ? 'Кликайте на карте, чтобы создать точки. Двойной клик - завершить.'
            : zone.coordinates && zone.coordinates.length > 0
            ? 'Перетаскивайте точки для редактирования'
            : 'Нажмите "Нарисовать зону" для начала'}
        </span>
      </div>

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
            border: '2px solid var(--border-color)',
          }}
        />
      </div>
    </div>
  );
};

export default ZoneEditorMap;
