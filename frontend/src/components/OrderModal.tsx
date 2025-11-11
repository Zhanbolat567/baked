import React, { useEffect, useState } from 'react';
import './components.css';

interface OrderModalProps {
  orderType: 'delivery' | 'pickup';
  pickupAddress: string;
  deliveryAddress: string;
  cart: any;
  onClose: () => void;
  onSubmit: (data: { clientName: string; clientPhone: string; orderComment: string; paymentMethod: string }) => Promise<void> | void;
  isSubmitting: boolean;
  initialComment?: string;
  pickupLocation?: {
    title: string;
    address: string;
    working_hours?: string;
    phone?: string | null;
  };
}

const OrderModal: React.FC<OrderModalProps> = (props: OrderModalProps) => {
  const {
    orderType,
    pickupAddress,
    deliveryAddress,
    cart,
    onClose,
    onSubmit,
    isSubmitting,
    initialComment = '',
    pickupLocation,
  } = props;
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [orderComment, setOrderComment] = useState(initialComment || '');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const formatPhone = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as +7 (7XX) XXX-XX-XX
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+${digits}`;
    if (digits.length <= 4) return `+${digits[0]} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setClientPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ 
      clientName: clientName.trim(), 
      clientPhone: clientPhone.replace(/\D/g, ''), // Send only digits
      orderComment: orderComment.trim(),
      paymentMethod 
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
  <div className="modal order-modal order-modal-new" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Доставка</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="order-form-new" onSubmit={handleSubmit}>
          {/* Address Display */}
          <div className="order-address-display">
            <div className="order-address-label">Адрес доставки</div>
            <div className="order-address-value">{deliveryAddress}</div>
          </div>

          {/* Client Name */}
          <div className="order-field-group">
            <label className="order-field-label">
              <span className="order-field-icon">👤</span>
              Ваше имя
            </label>
            <input
              type="text"
              className="order-input-new"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ваше имя"
              required
            />
          </div>

          {/* Client Phone */}
          <div className="order-field-group">
            <label className="order-field-label">
              <span className="order-field-icon">📞</span>
              Ваш номер телефона
            </label>
            <input
              type="tel"
              className="order-input-new"
              value={clientPhone}
              onChange={handlePhoneChange}
              placeholder="+7 (708) 871-12-38"
              required
            />
          </div>

          {/* Payment Method */}
          <div className="order-field-group">
            <label className="order-field-label">
              <span className="order-field-icon">💳</span>
              Способ оплаты
            </label>
            <select
              className="order-input-new order-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Наличными</option>
              <option value="card">Картой</option>
              <option value="kaspi">Kaspi</option>
            </select>
          </div>

          {/* Comment */}
          <div className="order-field-group">
            <label className="order-field-label">
              <span className="order-field-icon">💬</span>
              Комментарий к заказу
            </label>
            <textarea
              className="order-input-new order-textarea"
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              placeholder="Комментарий"
              rows={3}
            />
          </div>

          {/* Order Summary */}
          <div className="order-summary-new">
            <div className="order-summary-row">
              <span>Товары в заказе: {cart.items.length} шт.</span>
              <span>{cart.getTotalAmount()} ₸</span>
            </div>
            <div className="order-summary-row">
              <span>Доставка</span>
              <span>1000 ₸</span>
            </div>
            <div className="order-summary-row order-summary-bonus">
              <span>Бонусы к начислению</span>
              <span>+44,40 ◎</span>
            </div>
            <div className="order-summary-row order-summary-total">
              <span>Итого</span>
              <span>{cart.getTotalAmount() + 1000} ₸</span>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="order-submit-btn-new" disabled={isSubmitting}>
            {isSubmitting ? 'Оформляем...' : 'Заказать'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
