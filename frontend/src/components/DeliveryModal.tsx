import React, { useState } from 'react';
import './components.css';

interface DeliveryModalProps {
  initialAddress?: string;
  onSave: (address: DeliveryAddress) => void;
  onClose: () => void;
}

export interface DeliveryAddress {
  address: string;
  apartment: string;
  entrance: string;
  floor: string;
  name: string;
  phone: string;
  comment?: string;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({ initialAddress = '', onSave, onClose }) => {
  const [address, setAddress] = useState(initialAddress);
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      alert('Пожалуйста, введите адрес доставки');
      return;
    }
    if (!name.trim()) {
      alert('Пожалуйста, введите ваше имя');
      return;
    }
    if (!phone.trim()) {
      alert('Пожалуйста, введите номер телефона');
      return;
    }

    onSave({
      address: address.trim(),
      apartment: apartment.trim(),
      entrance: entrance.trim(),
      floor: floor.trim(),
      name: name.trim(),
      phone: phone.trim(),
      comment: comment.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal delivery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">На какой адрес доставить?</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Map Section */}
          <div className="delivery-map-container">
            <div className="delivery-map">
              <div className="map-zones">
                <div className="map-zone zone-1"></div>
                <div className="map-zone zone-2"></div>
                <div className="map-zone zone-3"></div>
              </div>
              <div className="map-marker">
                <div className="marker-pin"></div>
                <div className="marker-shadow"></div>
              </div>
              <div className="map-controls">
                <button className="map-control-btn" type="button">+</button>
                <button className="map-control-btn" type="button">−</button>
                <button className="map-control-btn map-locate-btn" type="button">⌖</button>
              </div>
            </div>
          </div>

          {/* Address Form */}
          <form onSubmit={handleSubmit} className="delivery-form">
            <div className="form-section">
              <h3 className="form-section-title">Адрес доставки</h3>
              
              <div className="form-field">
                <label>Адрес *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Астана, улица..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Квартира</label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="12"
                  />
                </div>
                <div className="form-field">
                  <label>Подъезд</label>
                  <input
                    type="text"
                    value={entrance}
                    onChange={(e) => setEntrance(e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div className="form-field">
                  <label>Этаж</label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Контактные данные</h3>
              
              <div className="form-field">
                <label>Ваше имя *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван"
                  required
                />
              </div>

              <div className="form-field">
                <label>Номер телефона *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  required
                />
              </div>

              <div className="form-field">
                <label>Комментарий к заказу</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Дополнительная информация для доставки..."
                  rows={3}
                />
              </div>
            </div>

            <div className="delivery-form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary">
                Готово
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeliveryModal;
