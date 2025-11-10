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
              <div className="delivery-map-placeholder">
                <div className="delivery-map-marker">📍</div>
                <p className="delivery-map-location">{address.address}</p>
                <div className="delivery-map-zones">
                  <div className="delivery-zone delivery-zone--blue"></div>
                  <div className="delivery-zone delivery-zone--green"></div>
                  <div className="delivery-zone delivery-zone--purple"></div>
                </div>
              </div>
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
