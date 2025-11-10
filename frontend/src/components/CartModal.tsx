import React, { useState } from 'react';
import { useAppStore, useCartStore, useAuthStore } from '../store';
import PaymentModal from './PaymentModal';
import OrderModal from './OrderModal';
import DeliveryModal, { DeliveryAddress } from './DeliveryModal';
import api from '../services/api';
import './components.css';

interface CartModalProps {
  onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ onClose }) => {
  const language = useAppStore((state) => state.language);
  const cart = useCartStore();
  const { user } = useAuthStore();
  const [showPayment, setShowPayment] = useState(false);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupAddress, setPickupAddress] = useState('Астана, Казахстан, улица Ханов Керея ...');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState<DeliveryAddress | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderComment, setOrderComment] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const getLocalizedName = (item: any) => {
    switch (language) {
      case 'rus': return item.name_rus;
      case 'kaz': return item.name_kaz;
      default: return item.name_rus;
    }
  };

  const getText = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      cart: { rus: 'Корзина', kaz: 'Себет' },
      empty: { rus: 'Корзина пуста', kaz: 'Себет бос' },
      addItems: { rus: 'Добавьте товары из меню', kaz: 'Мәзірден тауарлар қосыңыз' },
      total: { rus: 'Итого', kaz: 'Барлығы' },
      bonuses: { rus: 'Будет начислено бонусов', kaz: 'Бонустар жиналады' },
      order: { rus: 'Заказать', kaz: 'Тапсырыс беру' },
    };
    return translations[key]?.[language] || translations[key]?.['rus'] || key;
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    setShowPayment(true);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderLoading(true);
    try {
      const orderData: any = {
        type: orderType,
        items: cart.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          options: item.selected_options.map(opt => ({
            group: opt.option_group_name,
            name: opt.option_name,
            price: opt.option_price,
          })),
        })),
        comment: orderComment,
        total: cart.getTotalAmount(),
      };
      if (orderType === 'pickup') {
        orderData.address = pickupAddress;
        orderData.client_name = clientName;
        orderData.client_phone = clientPhone;
      } else {
        orderData.address = deliveryAddress;
        orderData.client_name = clientName;
        orderData.client_phone = clientPhone;
      }
      await api.createOrder(orderData);
      cart.clearCart();
      setOrderSuccess(true);
      setShowOrderModal(false);
    } catch (err) {
      alert('Ошибка при оформлении заказа');
    } finally {
      setOrderLoading(false);
    }
  };

  const bonusPoints = Math.floor(cart.getTotalAmount() * 0.01);

  if (showPayment) {
    return <PaymentModal onClose={onClose} />;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{getText('cart')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {cart.items.length > 0 && (
            <div className="cart-order-type-switch">
              <button
                className={`cart-order-type-btn${orderType === 'delivery' ? ' active' : ''}`}
                onClick={() => setOrderType('delivery')}
                type="button"
              >
                Доставка
              </button>
              <button
                className={`cart-order-type-btn${orderType === 'pickup' ? ' active' : ''}`}
                onClick={() => setOrderType('pickup')}
                type="button"
              >
                Самовывоз
              </button>
            </div>
          )}

          {/* Самовывоз */}
          {cart.items.length > 0 && orderType === 'pickup' && (
            <>
              <div className="cart-address-block">
                <span className="cart-address-label">{pickupAddress}</span>
              </div>
              <div className="cart-client-form">
                <label>
                  Ваше имя
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Введите имя"
                  />
                </label>
                <label>
                  Ваш номер телефона
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="+7"
                  />
                </label>
              </div>
            </>
          )}

          {/* Доставка */}
          {cart.items.length > 0 && orderType === 'delivery' && (
            <>
              <div className="cart-address-block">
                {deliveryData ? (
                  <div className="delivery-info-preview">
                    <div className="delivery-preview-label">Адрес доставки:</div>
                    <div className="delivery-preview-address">{deliveryData.address}</div>
                    {(deliveryData.apartment || deliveryData.entrance || deliveryData.floor) && (
                      <div className="delivery-preview-details">
                        {deliveryData.apartment && `кв. ${deliveryData.apartment}`}
                        {deliveryData.entrance && `, подъезд ${deliveryData.entrance}`}
                        {deliveryData.floor && `, этаж ${deliveryData.floor}`}
                      </div>
                    )}
                    <div className="delivery-preview-contact">
                      <strong>{deliveryData.name}</strong> — {deliveryData.phone}
                    </div>
                  </div>
                ) : (
                  <span className="cart-address-label">Укажите адрес доставки</span>
                )}
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowDeliveryModal(true)}
                >
                  {deliveryData ? 'Изменить адрес' : 'Готово'}
                </button>
              </div>
            </>
          )}

          {cart.items.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h3>{getText('empty')}</h3>
              <p>{getText('addItems')}</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="cart-items">
                {cart.items.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="cart-item-info">
                      {item.product.image_url && (
                        <img 
                          src={item.product.image_url} 
                          alt={getLocalizedName(item.product)} 
                          className="cart-item-image"
                        />
                      )}
                      <div className="cart-item-details">
                        <div className="cart-item-name">
                          {getLocalizedName(item.product)}
                        </div>
                        {item.selected_options.length > 0 && (
                          <div className="cart-item-options">
                            {item.selected_options.map((opt, idx) => (
                              <span key={idx} className="cart-option-tag">
                                {opt.option_name}
                                {opt.option_price > 0 && ` +${opt.option_price}₸`}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="cart-item-price">
                          {item.total_price} ₸
                        </div>
                      </div>
                    </div>

                    <div className="cart-item-actions">
                      <div className="cart-quantity-controls">
                        <button
                          className="cart-quantity-btn"
                          onClick={() => cart.updateQuantity(index, Math.max(1, item.quantity - 1))}
                        >
                          −
                        </button>
                        <span className="cart-quantity-value">{item.quantity}</span>
                        <button
                          className="cart-quantity-btn"
                          onClick={() => cart.updateQuantity(index, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="cart-remove-btn"
                        onClick={() => cart.removeItem(index)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span>{getText('total')}:</span>
                  <span className="cart-summary-value">{cart.getTotalAmount()} ₸</span>
                </div>
                {user && bonusPoints > 0 && (
                  <div className="cart-summary-row bonus-info">
                    <span>{getText('bonuses')}:</span>
                    <span className="cart-summary-value">+{bonusPoints} ⭐</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {cart.items.length > 0 && !showOrderModal && (
          <div className="modal-footer">
            <button
              className="btn btn-primary btn-full"
              onClick={() => setShowOrderModal(true)}
            >
              Оформить заказ
            </button>
          </div>
        )}
        {showOrderModal && (
          <OrderModal
            orderType={orderType}
            pickupAddress={pickupAddress}
            deliveryAddress={deliveryAddress}
            cart={cart}
            onClose={() => setShowOrderModal(false)}
            onSubmit={handleOrderSubmit}
          />
        )}

        {showDeliveryModal && (
          <DeliveryModal
            initialAddress={deliveryData?.address || ''}
            onSave={(data) => {
              setDeliveryData(data);
              setDeliveryAddress(data.address);
              setClientName(data.name);
              setClientPhone(data.phone);
              if (data.comment) {
                setOrderComment(data.comment);
              }
              setShowDeliveryModal(false);
            }}
            onClose={() => setShowDeliveryModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CartModal;
