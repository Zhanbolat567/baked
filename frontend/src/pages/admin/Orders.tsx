import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store';
import AdminSidebar from '../../components/admin/AdminSidebar';
import DeliveryMapModal from '../../components/admin/DeliveryMapModal';
import api from '../../services/api';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'active';
  
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [closedOrders, setClosedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [tab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      if (tab === 'active') {
        const data = await api.getActiveOrders();
        setActiveOrders(data);
      } else {
        const data = await api.getClosedOrders();
        setClosedOrders(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = useMemo(
    () => [
      { key: 'active', label: 'Активные' },
      { key: 'closed', label: 'Закрытые' },
    ],
    []
  );

  if (!isAdmin()) {
    navigate('/');
    return null;
  }

  const handleViewAddress = (address: any) => {
    setSelectedAddress(address);
    setIsMapModalOpen(true);
  };

  const displayOrders = tab === 'active' ? activeOrders : closedOrders;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-page-header">
          <h1>Управление Заказами</h1>
        </div>

        <div className="admin-tabs">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              className={`admin-tab ${tab === key ? 'active' : ''}`}
              onClick={() => navigate(`/admin/orders?tab=${key}`)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="orders-grid" style={{ marginTop: '20px' }}>
          {displayOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card__header">
                <div className="order-card__title">
                  <h3>Заказ #{order.id}</h3>
                  <span className={`order-status order-status--${order.status}`}>
                    {order.status === 'paid' ? 'Оплачен' : order.status === 'pending' ? 'В ожидании' : 'Завершен'}
                  </span>
                </div>
                <div className="order-card__time">
                  {new Date(order.created_at).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="order-card__body">
                <div className="order-info-row">
                  <span className="order-info-label">Клиент:</span>
                  <span className="order-info-value">{order.customer_name}</span>
                </div>
                <div className="order-info-row">
                  <span className="order-info-label">Телефон:</span>
                  <span className="order-info-value">{order.phone}</span>
                </div>
                <div className="order-info-row">
                  <span className="order-info-label">Тип:</span>
                  <span className="order-info-value">
                    {order.delivery_type === 'delivery' ? '🚗 Доставка' : '🏃 Самовывоз'}
                  </span>
                </div>
                
                {order.delivery_type === 'delivery' && order.address && (
                  <div className="order-info-row">
                    <span className="order-info-label">Адрес:</span>
                    <button
                      className="order-address-btn"
                      onClick={() => handleViewAddress(order.address)}
                    >
                      📍 {order.address.address}
                    </button>
                  </div>
                )}

                <div className="order-items">
                  <h4>Товары:</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <span>{item.product_name} x{item.quantity}</span>
                      <span>{item.price} ₸</span>
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  <strong>Итого:</strong>
                  <strong>{order.total_amount} ₸</strong>
                </div>
              </div>

              <div className="order-card__footer">
                <button className="btn btn-light">Детали</button>
                {order.status === 'paid' && (
                  <button className="btn btn-primary">Завершить</button>
                )}
              </div>
            </div>
          ))}

          {displayOrders.length === 0 && (
            <div className="admin-empty">
              {tab === 'active' ? 'Нет активных заказов' : 'Нет закрытых заказов'}
            </div>
          )}
        </div>
      </div>

      <DeliveryMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialAddress={selectedAddress}
        readOnly={true}
      />
    </div>
  );
};

export default Orders;
