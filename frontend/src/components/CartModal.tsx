import React, { useState } from 'react';
import { useAppStore, useCartStore, useAuthStore } from '../store';
import PaymentModal from './PaymentModal';
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
  const [showMap, setShowMap] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderComment, setOrderComment] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const getLocalizedName = (item: any) => {
    switch (language) {
      case 'rus': return item.name_rus;
      case 'kaz': return item.name_kaz;
      case 'eng': return item.name_eng;
      default: return item.name_rus;
    }
  };

  const getText = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      cart: { rus: 'Корзина', kaz: 'Себет', eng: 'Cart' },
      empty: { rus: 'Корзина пуста', kaz: 'Себет бос', eng: 'Cart is empty' },
      addItems: { rus: 'Добавьте товары из меню', kaz: 'Мәзірден тауарлар қосыңыз', eng: 'Add items from menu' },
      total: { rus: 'Итого', kaz: 'Барлығы', eng: 'Total' },
      bonuses: { rus: 'Будет начислено бонусов', kaz: 'Бонустар жиналады', eng: 'Bonuses to earn' },
      order: { rus: 'Заказать', kaz: 'Тапсырыс беру', eng: 'Order' },
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
      setShowOrderForm(false);
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
              {!showMap ? (
                <div className="cart-address-block">
                  <span className="cart-address-label">{deliveryAddress || 'Адрес доставки не выбран'}</span>
                  <button className="btn btn-secondary" onClick={() => setShowMap(true)}>
                    Выбрать адрес на карте
                  </button>
                </div>
              ) : (
                <div className="cart-map-block">
                  <div className="cart-map-placeholder">
                    {/* Здесь будет карта. Для примера — просто блок. */}
                    <div style={{height: 200, background: '#e3e3e3', borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18}}>
                      Карта доставки (заглушка)
                    </div>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Введите адрес доставки"
                      style={{width: '100%', marginBottom: 8}}
                    />
                    <button className="btn btn-primary" onClick={() => setShowMap(false)}>
                      Готово
                    </button>
                  </div>
                </div>
              )}
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

        {cart.items.length > 0 && !showOrderForm && (
          <div className="modal-footer">
            <button
              className="btn btn-primary btn-full"
              onClick={() => setShowOrderForm(true)}
            >
              Продолжить оформление
            </button>
          </div>
        )}

        {cart.items.length > 0 && showOrderForm && !orderSuccess && (
          <form className="cart-order-form" onSubmit={handleOrderSubmit}>
            {orderType === 'pickup' ? (
              <>
                <div className="cart-order-form-title">Самовывоз</div>
                <div className="cart-order-form-row">
                  <span>Адрес:</span> <span>{pickupAddress}</span>
                </div>
                <div className="cart-order-form-row">
                  <span>Имя:</span> <span>{clientName}</span>
                </div>
                <div className="cart-order-form-row">
                  <span>Телефон:</span> <span>{clientPhone}</span>
                </div>
                <div className="cart-order-form-row">
                  <label>Комментарий к заказу
                    <input type="text" value={orderComment} onChange={e => setOrderComment(e.target.value)} placeholder="Комментарий" />
                  </label>
                </div>
                <div className="cart-order-form-row">
                  <span>Товары в заказе: {cart.items.length} шт.</span>
                  <span>{cart.getTotalAmount()} ₸</span>
                </div>
                <div className="cart-order-form-row">
                  <span>Итого:</span>
                  <span>{cart.getTotalAmount()} ₸</span>
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={orderLoading}>
                  {orderLoading ? 'Оформляем...' : 'Заказать'}
                </button>
              </>
            ) : (
              <>
                <div className="cart-order-form-title">Доставка</div>
                <div className="cart-order-form-row">
                  <span>Адрес доставки:</span> <span>{deliveryAddress}</span>
                </div>
                <div className="cart-order-form-row">
                  <label>Ваше имя
                    <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Имя" />
                  </label>
                </div>
                <div className="cart-order-form-row">
                  <label>Ваш номер телефона
                    <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+7" />
                  </label>
                </div>
                <div className="cart-order-form-row">
                  <label>Комментарий к заказу
                    <input type="text" value={orderComment} onChange={e => setOrderComment(e.target.value)} placeholder="Комментарий" />
                  </label>
                </div>
                <div className="cart-order-form-row">
                  <span>Товары в заказе: {cart.items.length} шт.</span>
                  <span>{cart.getTotalAmount()} ₸</span>
                </div>
                <div className="cart-order-form-row">
                  <span>Итого:</span>
                  <span>{cart.getTotalAmount()} ₸</span>
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={orderLoading}>
                  {orderLoading ? 'Оформляем...' : 'Заказать'}
                </button>
              </>
            )}
          </form>
        )}
        {orderSuccess && (
          <div className="cart-order-success">
            <h3>Заказ успешно оформлен!</h3>
            <p>Спасибо за ваш заказ. Мы скоро свяжемся с вами.</p>
            <button className="btn btn-secondary btn-full" onClick={onClose}>Закрыть</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
