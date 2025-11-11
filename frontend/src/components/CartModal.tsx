import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore, useCartStore, useAuthStore } from '../store';
import PaymentModal from './PaymentModal';
import OrderModal from './OrderModal';
import DeliveryModal, { DeliveryAddress } from './DeliveryModal';
import './components.css';
import { PickupLocation } from '../types';
import api from '../services/api';

interface CartModalProps {
  onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = (props: CartModalProps) => {
  const { onClose } = props;
  const language = useAppStore((state: any) => state.language);
  const cart = useCartStore();
  const { user } = useAuthStore();
  const [showPayment, setShowPayment] = useState(false);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [selectedPickupId, setSelectedPickupId] = useState<number | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState<DeliveryAddress | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderComment, setOrderComment] = useState('');
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

  interface OrderFormData {
    clientName: string;
    clientPhone: string;
    orderComment: string;
  }

  const selectedPickup = useMemo(() => {
    if (!selectedPickupId) {
      return null;
    }
  return pickupLocations.find((location: PickupLocation) => location.id === selectedPickupId) || null;
  }, [selectedPickupId, pickupLocations]);

  const pickupAddressSummary = useMemo(() => {
    if (!selectedPickup) {
      return '';
    }
    return `${selectedPickup.title} (${selectedPickup.address})`;
  }, [selectedPickup]);

  useEffect(() => {
    let ignore = false;

    const loadPickupLocations = async () => {
      try {
        setPickupLoading(true);
        setPickupError(null);
        const data = await api.getPickupLocations();
        if (!ignore && Array.isArray(data)) {
          const activeSorted = data
            .filter((location: PickupLocation) => location.is_active)
            .sort((a: PickupLocation, b: PickupLocation) => {
              if (a.display_order !== b.display_order) {
                return a.display_order - b.display_order;
              }
              return a.id - b.id;
            });
          setPickupLocations(activeSorted);
          setSelectedPickupId((prev: number | null) => {
            if (prev && activeSorted.some((location: PickupLocation) => location.id === prev)) {
              return prev;
            }
            return activeSorted.length > 0 ? activeSorted[0].id : null;
          });
        }
      } catch (err) {
        console.error('Не удалось загрузить точки самовывоза', err);
        if (!ignore) {
          setPickupError('Не удалось загрузить точки самовывоза');
        }
      } finally {
        if (!ignore) {
          setPickupLoading(false);
        }
      }
    };

    loadPickupLocations();

    return () => {
      ignore = true;
    };
  }, []);

  const handleOrderSubmit = async ({ clientName, clientPhone, orderComment }: OrderFormData) => {
    if (orderLoading) return;

    const trimmedName = clientName.trim();
    const trimmedPhone = clientPhone.trim();
    const trimmedComment = orderComment.trim();

    if (!trimmedName || !trimmedPhone) {
      alert('Укажите имя и телефон');
      return;
    }

    if (orderType === 'delivery' && !deliveryData) {
      alert('Пожалуйста, выберите адрес доставки');
      return;
    }

    if (orderType === 'pickup' && !selectedPickup) {
      alert('Пожалуйста, выберите точку самовывоза');
      return;
    }

    setClientName(trimmedName);
    setClientPhone(trimmedPhone);
    setOrderComment(trimmedComment);

    setOrderLoading(true);

    try {
      const itemsLines = cart.items.map((item: any, index: number) => {
        const baseName = item.product.name_rus || item.product.name_kaz || `Товар ${index + 1}`;
        const optionsText = item.selected_options.length
          ? ` (опции: ${item.selected_options.map((opt: any) => opt.option_name).join(', ')})`
          : '';
        return `${index + 1}. ${baseName} × ${item.quantity} = ${item.total_price} ₸${optionsText}`;
      });

      const lines: string[] = [
        `Новый заказ (${orderType === 'delivery' ? 'Доставка' : 'Самовывоз'})`,
        '',
        'Товары:',
        ...itemsLines,
        `Итого: ${cart.getTotalAmount()} ₸`,
        '',
        `Имя: ${trimmedName}`,
        `Телефон: ${trimmedPhone}`,
      ];

      if (orderType === 'delivery' && deliveryData) {
        lines.push(`Адрес доставки: ${deliveryData.address}`);
        const extraParts: string[] = [];
        if (deliveryData.apartment) extraParts.push(`кв. ${deliveryData.apartment}`);
        if (deliveryData.entrance) extraParts.push(`подъезд ${deliveryData.entrance}`);
        if (deliveryData.floor) extraParts.push(`этаж ${deliveryData.floor}`);
        if (extraParts.length) {
          lines.push(`Детали: ${extraParts.join(', ')}`);
        }
      } else if (orderType === 'pickup' && selectedPickup) {
        lines.push(`Адрес самовывоза: ${selectedPickup.title}`);
        lines.push(`Полный адрес: ${selectedPickup.address}`);
        if (selectedPickup.working_hours) {
          lines.push(`Время работы: ${selectedPickup.working_hours}`);
        }
        if (selectedPickup.phone) {
          lines.push(`Телефон точки: ${selectedPickup.phone}`);
        }
      }

      if (trimmedComment) {
        lines.push(`Комментарий: ${trimmedComment}`);
      }

      if (deliveryData?.comment && orderType === 'delivery' && deliveryData.comment !== trimmedComment) {
        lines.push(`Комментарий (из адреса): ${deliveryData.comment}`);
      }

      const whatsappNumber = '77078126798';
      const message = encodeURIComponent(lines.filter(Boolean).join('\n'));
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

      const popup = window.open(whatsappUrl, '_blank');
      if (!popup) {
        window.location.href = whatsappUrl;
      }

      cart.clearCart();
      setShowOrderModal(false);
      onClose();
    } catch (err) {
      console.error('Ошибка формирования заказа для WhatsApp:', err);
      alert('Не удалось подготовить сообщение для WhatsApp');
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
  <div className="modal cart-modal" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
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
            <div className="cart-client-form">
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Адрес самовывоза</h3>
              
              <div className="delivery-field-group">
                <label className="delivery-field-label">Адрес *</label>
                <input
                  type="text"
                  className="delivery-input-new"
                  value={deliveryData?.address || ''}
                  onChange={(e) => setDeliveryData(prev => ({ 
                    ...prev, 
                    address: e.target.value,
                    name: prev?.name || '',
                    phone: prev?.phone || '',
                    apartment: prev?.apartment || '',
                    entrance: prev?.entrance || '',
                    floor: prev?.floor || '',
                    comment: prev?.comment || ''
                  }))}
                  placeholder="Введите адрес самовывоза"
                  required
                />
              </div>

              <div className="delivery-details-grid-new">
                <div className="delivery-field-group">
                  <label className="delivery-field-label">Квартира</label>
                  <input
                    type="text"
                    className="delivery-input-new"
                    value={deliveryData?.apartment || ''}
                    onChange={(e) => setDeliveryData(prev => ({ 
                      ...prev, 
                      apartment: e.target.value,
                      address: prev?.address || '',
                      name: prev?.name || '',
                      phone: prev?.phone || '',
                      entrance: prev?.entrance || '',
                      floor: prev?.floor || '',
                      comment: prev?.comment || ''
                    }))}
                    placeholder="№"
                  />
                </div>

                <div className="delivery-field-group">
                  <label className="delivery-field-label">Подъезд</label>
                  <input
                    type="text"
                    className="delivery-input-new"
                    value={deliveryData?.entrance || ''}
                    onChange={(e) => setDeliveryData(prev => ({ 
                      ...prev, 
                      entrance: e.target.value,
                      address: prev?.address || '',
                      name: prev?.name || '',
                      phone: prev?.phone || '',
                      apartment: prev?.apartment || '',
                      floor: prev?.floor || '',
                      comment: prev?.comment || ''
                    }))}
                    placeholder="№"
                  />
                </div>

                <div className="delivery-field-group">
                  <label className="delivery-field-label">Этаж</label>
                  <input
                    type="text"
                    className="delivery-input-new"
                    value={deliveryData?.floor || ''}
                    onChange={(e) => setDeliveryData(prev => ({ 
                      ...prev, 
                      floor: e.target.value,
                      address: prev?.address || '',
                      name: prev?.name || '',
                      phone: prev?.phone || '',
                      apartment: prev?.apartment || '',
                      entrance: prev?.entrance || '',
                      comment: prev?.comment || ''
                    }))}
                    placeholder="№"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Доставка */}
          {cart.items.length > 0 && orderType === 'delivery' && (
            <div className="cart-client-form">
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Адрес доставки</h3>
              
              <div className="delivery-field-group">
                <label className="delivery-field-label">Адрес *</label>
                <input
                  type="text"
                  className="delivery-input-new"
                  value={deliveryData?.address || ''}
                  onChange={(e) => setDeliveryData(prev => ({ 
                    ...prev, 
                    address: e.target.value,
                    name: prev?.name || '',
                    phone: prev?.phone || '',
                    apartment: prev?.apartment || '',
                    entrance: prev?.entrance || '',
                    floor: prev?.floor || '',
                    comment: prev?.comment || ''
                  }))}
                  placeholder="Введите адрес доставки"
                  required
                />
              </div>

              <div className="delivery-details-grid-new">
                <div className="delivery-field-group">
                  <label className="delivery-field-label">Квартира</label>
                  <input
                    type="text"
                    className="delivery-input-new"
                    value={deliveryData?.apartment || ''}
                    onChange={(e) => setDeliveryData(prev => ({ 
                      ...prev, 
                      apartment: e.target.value,
                      address: prev?.address || '',
                      name: prev?.name || '',
                      phone: prev?.phone || '',
                      entrance: prev?.entrance || '',
                      floor: prev?.floor || '',
                      comment: prev?.comment || ''
                    }))}
                    placeholder="№"
                  />
                </div>

                <div className="delivery-field-group">
                  <label className="delivery-field-label">Подъезд</label>
                  <input
                    type="text"
                    className="delivery-input-new"
                    value={deliveryData?.entrance || ''}
                    onChange={(e) => setDeliveryData(prev => ({ 
                      ...prev, 
                      entrance: e.target.value,
                      address: prev?.address || '',
                      name: prev?.name || '',
                      phone: prev?.phone || '',
                      apartment: prev?.apartment || '',
                      floor: prev?.floor || '',
                      comment: prev?.comment || ''
                    }))}
                    placeholder="№"
                  />
                </div>

                <div className="delivery-field-group">
                  <label className="delivery-field-label">Этаж</label>
                  <input
                    type="text"
                    className="delivery-input-new"
                    value={deliveryData?.floor || ''}
                    onChange={(e) => setDeliveryData(prev => ({ 
                      ...prev, 
                      floor: e.target.value,
                      address: prev?.address || '',
                      name: prev?.name || '',
                      phone: prev?.phone || '',
                      apartment: prev?.apartment || '',
                      entrance: prev?.entrance || '',
                      comment: prev?.comment || ''
                    }))}
                    placeholder="№"
                  />
                </div>
              </div>
            </div>
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
              onClick={() => {
                if (orderType === 'delivery' && !deliveryData) {
                  alert('Пожалуйста, укажите адрес доставки');
                  return;
                }
                if (orderType === 'pickup' && !selectedPickup) {
                  alert('Пожалуйста, выберите точку самовывоза');
                  return;
                }
                setShowOrderModal(true);
              }}
              disabled={orderLoading}
            >
              Оформить заказ
            </button>
          </div>
        )}
        {showOrderModal && (
          <OrderModal
            orderType={orderType}
            pickupAddress={pickupAddressSummary}
            deliveryAddress={deliveryAddress}
            pickupLocation={selectedPickup || undefined}
            cart={cart}
            onClose={() => setShowOrderModal(false)}
            onSubmit={handleOrderSubmit}
            isSubmitting={orderLoading}
            initialName={clientName || deliveryData?.name || ''}
            initialPhone={clientPhone || deliveryData?.phone || ''}
            initialComment={orderComment || deliveryData?.comment || ''}
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
