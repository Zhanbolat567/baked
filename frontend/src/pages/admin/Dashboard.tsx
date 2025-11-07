import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import { DashboardStats } from '../../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>Dashboard</h1>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Продажи за сегодня</div>
              <div className="stat-value">{stats.today_sales.toFixed(0)} ₸</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Продажи за месяц</div>
              <div className="stat-value">{stats.monthly_sales.toFixed(0)} ₸</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Заказов сегодня</div>
              <div className="stat-value">{stats.total_orders_today}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Активных заказов</div>
              <div className="stat-value">{stats.active_orders}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
