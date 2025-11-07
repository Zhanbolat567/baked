import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Меню',
    path: '/admin/menu',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M3 21h18" />
      </svg>
    ),
    children: [
      { label: 'Категории', path: '/admin/categories', icon: null },
      { label: 'Товары', path: '/admin/products', icon: null },
      { label: 'Опции', path: '/admin/options', icon: null },
    ],
  },
  {
    label: 'Заказы',
    path: '/admin/orders',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M3 12h18" />
        <path d="M3 18h18" />
        <path d="M7 6v12" />
      </svg>
    ),
    children: [
      { label: 'Активные', path: '/admin/orders?tab=active', icon: null },
      { label: 'Закрытые', path: '/admin/orders?tab=closed', icon: null },
    ],
  },
  {
    label: 'Настройки',
    path: '/admin/settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

interface AdminSidebarProps {
  collapsed?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleNavigate = (path: string) => {
    if (path === '/admin/settings') {
      // Settings page not yet implemented
      return;
    }
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  return (
    <aside className="admin-sidebar new">
      <div className="admin-sidebar__header" style={{padding: '16px 20px', fontSize: '18px', fontWeight: 600, color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)'}}>
        {/* Логотип убран */}
      </div>
      <nav className="admin-sidebar__nav">
        {navItems.map((item) => (
          <div key={item.path} className="admin-sidebar__group">
            <button
              className={`admin-sidebar__link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavigate(item.path)}
            >
              <span className="admin-sidebar__icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
            {item.children && isActive(item.path) && (
              <div className="admin-sidebar__sublinks">
                {item.children.map((child) => (
                  <button
                    key={child.path}
                    className={`admin-sidebar__sublink ${isActive(child.path) ? 'active' : ''}`}
                    onClick={() => handleNavigate(child.path)}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="admin-sidebar__footer">
        <button className="admin-sidebar__logout" onClick={logout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Выйти
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

