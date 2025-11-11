import React, { useState } from 'react';
import '../components.css';

interface DeliveryAddress {
  address: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  latitude?: number;
  longitude?: number;
}

interface DeliveryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAddress?: DeliveryAddress;
  readOnly?: boolean;
}

const MAP_IFRAME_SRC =
  'https://makemap.2gis.ru/widget?data=eJyFkNFqgzAUht_l7DaUGBNjhF2UwcrGYGU3hRUvnEnbsNRITGFOfPdFnTJWxrzzOyeH7_87sE4qp-RG2bPyTqsGsn0Hvq0VZHCvCn9xChDUztbK-XHegVRN6XTtta3CVhg33tl3dWeNdQHcUPnGCVv4Tkt_gozM_891UWrfQhYhOGhjlncJk0ksYKLLFl4xBJ8PlVQf4UmP4DjJtoPKt-nWmvYYbBCUNkTSVeHHKPs9j1YUp5jGiEWrKOY4TXI00DjhhE-UUowXSlKRTLuEswlSTBmhIyQci4X-OpvnQU5LyITgPfq3Ra-9Geb4MX45is0aP61vw9JVueVcDyZpdCDwoww8f3-1oit_1cmQkjMmxKQuMCOzeIRT2ucIzkW9tY2eHDowhYdsykkoZyQmIokwRWCG-XBPhMg0JUSIFCdB0NpzuEbD2RDGGrM7KWVeR-rdRfVfUpC62g';

const DeliveryMapModal: React.FC<DeliveryMapModalProps> = ({
  isOpen,
  onClose,
  initialAddress,
  readOnly = true,
}) => {
  const [address, setAddress] = useState<DeliveryAddress>(
    initialAddress || {
      address: 'Астана',
      apartment: '',
      entrance: '',
      floor: '',
    }
  );

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="delivery-map-modal">
        <div className="delivery-map-modal__header">
          <h2>Адрес доставки</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="delivery-map-modal__body">
          {/* Tabs */}
          <div className="delivery-tabs">
            <button className="delivery-tab active">Доставка</button>
            <button className="delivery-tab">Самовывоз</button>
            <button className="delivery-tab">В зале</button>
          </div>

          {/* Address Section */}
          <div className="delivery-section">
            <h3 className="delivery-section__title">На какой адрес доставить?</h3>
            
            <div className="delivery-address-input">
              <label>Адрес доставки</label>
              <input
                type="text"
                value={address.address}
                onChange={(e) => setAddress({ ...address, address: e.target.value })}
                placeholder="Астана, улица..."
                readOnly={readOnly}
                className="delivery-input delivery-input--large"
              />
            </div>

            {/* Map Container */}
            <div className="delivery-map-container">
              <iframe
                src={MAP_IFRAME_SRC}
                title="Карта доставки 2ГИС"
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '16px' }}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-modals allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation"
              />
            </div>

            {/* Address Details Grid */}
            <div className="delivery-details-grid">
              <div className="delivery-field">
                <label>Квартира</label>
                <input
                  type="text"
                  value={address.apartment}
                  onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
                  placeholder="123"
                  readOnly={readOnly}
                  className="delivery-input"
                />
              </div>
              <div className="delivery-field">
                <label>Подъезд</label>
                <input
                  type="text"
                  value={address.entrance}
                  onChange={(e) => setAddress({ ...address, entrance: e.target.value })}
                  placeholder="2"
                  readOnly={readOnly}
                  className="delivery-input"
                />
              </div>
              <div className="delivery-field">
                <label>Этаж</label>
                <input
                  type="text"
                  value={address.floor}
                  onChange={(e) => setAddress({ ...address, floor: e.target.value })}
                  placeholder="5"
                  readOnly={readOnly}
                  className="delivery-input"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          {!readOnly && (
            <div className="delivery-map-modal__footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button className="btn btn-primary delivery-btn-ready">
                Готово
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryMapModal;
