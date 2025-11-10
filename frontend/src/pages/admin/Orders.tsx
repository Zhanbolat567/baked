import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store';
import AdminSidebar from '../../components/admin/AdminSidebar';
import DeliveryMapModal from '../../components/admin/DeliveryMapModal';

// Mock data for demonstration
const mockOrders = [
  {
    id: 1,
    customer_name: 'Иван Иванов',
    phone: '+7 (701) 234-56-78',
    total_amount: 4500,
    status: 'paid',
    delivery_type: 'delivery',
    address: {
      address: 'Астана, ул. Кабанбай батыра, 43',
      apartment: '25',
      entrance: '2',
      floor: '5',
    },
    items: [
      { product_name: 'Латте', quantity: 2, price: 1500 },
      { product_name: 'Капучино', quantity: 1, price: 1500 },
    ],
    created_at: '2024-11-08T10:30:00',
  },
  {
    id: 2,
    customer_name: 'Мария Петрова',
    phone: '+7 (702) 345-67-89',
    total_amount: 2800,
    status: 'pending',
    delivery_type: 'pickup',
    address: null,
    items: [
      { product_name: 'Американо', quantity: 1, price: 1200 },
      { product_name: 'Круассан', quantity: 2, price: 800 },
    ],
    created_at: '2024-11-08T11:15:00',
  },
];

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'active';
  
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

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

  const activeOrders = mockOrders.filter((order) => order.status === 'pending' || order.status === 'paid');
  const closedOrders = mockOrders.filter((order) => order.status === 'completed' || order.status === 'cancelled');
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
