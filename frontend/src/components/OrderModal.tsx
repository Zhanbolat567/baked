import React, { useState } from 'react';
import './components.css';

interface OrderModalProps {
  orderType: 'delivery' | 'pickup';
  pickupAddress: string;
  deliveryAddress: string;
  cart: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ orderType, pickupAddress, deliveryAddress, cart, onClose, onSubmit }) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [orderComment, setOrderComment] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderLoading(true);
    onSubmit({
      clientName,
      clientPhone,
      orderComment,
    });
    setOrderLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal order-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{orderType === 'pickup' ? 'Самовывоз' : 'Доставка'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="order-form" onSubmit={handleSubmit}>
          {orderType === 'pickup' ? (
            <>
              <div className="order-row"><span>Адрес:</span> <span>{pickupAddress}</span></div>
            </>
          ) : (
            <>
              <div className="order-row"><span>Адрес доставки:</span> <span>{deliveryAddress}</span></div>
            </>
          )}
          <div className="order-row">
            <label>Имя
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="Введите имя" />
            </label>
          </div>
          <div className="order-row">
            <label>Телефон
              <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} required placeholder="+7" />
            </label>
          </div>
          <div className="order-row">
            <label>Комментарий к заказу
              <input type="text" value={orderComment} onChange={e => setOrderComment(e.target.value)} placeholder="Комментарий" />
            </label>
          </div>
          <div className="order-row">
            <span>Товары в заказе: {cart.items.length} шт.</span>
            <span>{cart.getTotalAmount()} ₸</span>
          </div>
          <div className="order-row">
            <span>Итого:</span>
            <span>{cart.getTotalAmount()} ₸</span>
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={orderLoading}>
            {orderLoading ? 'Оформляем...' : 'Заказать'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
