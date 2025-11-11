import { FC, useEffect } from 'react';

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

interface TwoGisEditorMapProps {
  zone: DeliveryZone;
  onCoordinatesChange: (coordinates: number[][]) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  apiKey: string;
}

const MAP_IFRAME_SRC =
  'https://makemap.2gis.ru/widget?data=eJyFkNFqgzAUht_l7DaUGBNjhF2UwcrGYGU3hRUvnEnbsNRITGFOfPdFnTJWxrzzOyeH7_87sE4qp-RG2bPyTqsGsn0Hvq0VZHCvCn9xChDUztbK-XHegVRN6XTtta3CVhg33tl3dWeNdQHcUPnGCVv4Tkt_gozM_891UWrfQhYhOGhjlncJk0ksYKLLFl4xBJ8PlVQf4UmP4DjJtoPKt-nWmvYYbBCUNkTSVeHHKPs9j1YUp5jGiEWrKOY4TXI00DjhhE-UUowXSlKRTLuEswlSTBmhIyQci4X-OpvnQU5LyITgPfq3Ra-9Geb4MX45is0aP61vw9JVueVcDyZpdCDwoww8f3-1oit_1cmQkjMmxKQuMCOzeIRT2ucIzkW9tY2eHDowhYdsykkoZyQmIokwRWCG-XBPhMg0JUSIFCdB0NpzuEbD2RDGGrM7KWVeR-rdRfVfUpC62g';

const TwoGisEditorMap: FC<TwoGisEditorMapProps> = ({
  zone,
  onCoordinatesChange,
  height = '400px',
}) => {
  useEffect(() => {
    if (zone.coordinates && zone.coordinates.length > 0) {
      onCoordinatesChange(zone.coordinates);
    }
  }, [zone.coordinates, onCoordinatesChange]);

  return (
    <div>
      <div
        style={{
          position: 'relative',
          height,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid var(--border-color)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        <iframe
          src={MAP_IFRAME_SRC}
          title="Редактор карты 2ГИС"
          style={{ width: '100%', height: '100%', border: 'none' }}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-modals allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation"
        />
      </div>
      <div
        style={{
          marginTop: '12px',
          padding: '12px 16px',
          background: 'var(--background-light)',
          borderRadius: '10px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
        }}
      >
        Управление зонами доставки через встроенный виджет 2ГИС. Редактирование координат в приложении недоступно;
        при необходимости обновите зону в конструкторе карты и сохраните изменения вручную.
      </div>
    </div>
  );
};

export default TwoGisEditorMap;
