import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store';
import AdminSidebar from '../../components/admin/AdminSidebar';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'active';

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

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Управление Заказами</h1>
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

        <div className="admin-card" style={{ marginTop: '20px' }}>
          {tab === 'active' ? (
            <p>Список активных заказов появится здесь.</p>
          ) : (
            <p>Список закрытых заказов появится здесь.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
