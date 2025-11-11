import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Product, CartItemOption } from '../types';
import { useAppStore, useCartStore, useAuthStore } from '../store';
import api from '../services/api';
import ProductModal from '../components/ProductModal';
import CartModal from '../components/CartModal';
import AuthModal from '../components/AuthModal';
import { API_URL } from '../config/constants';

const resolveAvatarUrl = (url?: string | null): string | null => {
  if (!url) {
    return null;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${API_URL}${url}`;
  }
  return `${API_URL}/${url}`;
};

const getInitials = (firstName?: string | null, lastName?: string | null): string => {
  const first = firstName?.trim()?.[0];
  const last = lastName?.trim()?.[0];
  const combined = `${first ?? ''}${last ?? ''}`.trim();
  return combined ? combined.toUpperCase() : 'A';
};

const HomePage: React.FC = () => {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const navigate = useNavigate();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const cart = useCartStore();
  const { user, logout } = useAuthStore();

  const languageDropdownRef = useRef<HTMLDivElement | null>(null);

  const userAvatarUrl = user ? resolveAvatarUrl(user.avatar_url) : null;
  const userInitials = user ? getInitials(user.first_name, user.last_name) : 'A';

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadMenu = async () => {
    try {
      const data = await api.getMenu();
      setMenu(data);
      if (data.categories.length > 0) {
        setActiveCategoryId(data.categories[0].id);
      }
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeCategory = activeCategoryId
    ? menu?.categories.find((category) => category.id === activeCategoryId)
    : menu?.categories[0];

  const getLocalizedName = (item: any) => {
    switch (language) {
      case 'rus': return item.name_rus;
      case 'kaz': return item.name_kaz;
      default: return item.name_rus;
    }
  };

  const languageOptions: Array<{ value: 'rus' | 'kaz'; label: string }> = [
    { value: 'rus', label: 'Русский' },
    { value: 'kaz', label: 'Қазақ' },
  ];

  const currentLanguageLabel = languageOptions.find((option) => option.value === language)?.label ?? 'Русский';

  const handleLanguageSelect = (value: 'rus' | 'kaz') => {
    setLanguage(value);
    setIsLanguageMenuOpen(false);
  };

  if (loading) {
    return <div className="container" style={{padding: '100px 0', textAlign: 'center'}}>
      <h2>Загрузка меню...</h2>
    </div>;
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="container header-content">
          <div className="logo">Social</div>
          <div className="header-actions">
            <div className="language-dropdown" ref={languageDropdownRef}>
              <button
                type="button"
                className={`language-dropdown-toggle ${isLanguageMenuOpen ? 'open' : ''}`}
                onClick={() => setIsLanguageMenuOpen((prev: boolean) => !prev)}
              >
                <span>{currentLanguageLabel}</span>
                <svg className="language-dropdown-icon" viewBox="0 0 12 8" aria-hidden="true">
                  <path d="M1 2l5 4 5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isLanguageMenuOpen && (
                <div className="language-dropdown-menu">
                  {languageOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`language-dropdown-item ${language === option.value ? 'active' : ''}`}
                      onClick={() => handleLanguageSelect(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {user ? (
              <div className="header-user">
                <button
                  type="button"
                  className="header-avatar header-avatar-button"
                  title={`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()}
                  onClick={() => navigate('/settings')}
                >
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt={`${user.first_name ?? 'Пользователь'} аватар`} />
                  ) : (
                    <span className="header-avatar-initial">{userInitials}</span>
                  )}
                </button>
                <div className="header-user-buttons">
                <button className="login-btn" onClick={logout}>Выйти</button>
                </div>
              </div>
            ) : (
              <button className="login-btn" onClick={() => setShowAuth(true)}>
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Banners */}
      <div className="container">
        <div className="banners">
          <div className="banner-container">
            <div className="banner">СКИДКА -30% НА ВСЮ ВЫПЕЧКУ ПОСЛЕ 17:00</div>
            <div className="banner">НОВОЕ МЕНЮ</div>
          </div>
        </div>

        {/* Categories */}
        {menu?.categories.length ? (
          <div className="categories">
            <div className="categories-scroll">
              {menu.categories.map((category) => (
                <div
                  key={category.id}
                  className={`category-tab ${activeCategory?.id === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategoryId(category.id)}
                >
                  {getLocalizedName(category)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-empty" style={{ marginTop: '30px' }}>
            Категории не найдены
          </div>
        )}

        {/* Products */}
        <div className="products-section">
          {activeCategory ? (
            <div>
              <h2 className="category-title">{getLocalizedName(activeCategory)}</h2>
              <div className="products-grid">
                {activeCategory.products.map((product) => (
                  <div
                    key={product.id}
                    className={`product-card ${product.status === 'out_of_stock' ? 'out-of-stock' : ''}`}
                    onClick={() => product.status === 'active' && setSelectedProduct(product)}
                  >
                    {product.image_url && (
                      <img src={product.image_url} alt={getLocalizedName(product)} className="product-image" />
                    )}
                    <div className="product-name">{getLocalizedName(product)}</div>
                    <div className="product-price">{product.base_price} ₸</div>
                    {product.status === 'out_of_stock' && (
                      <div className="out-of-stock-label">Товара нет в наличии</div>
                    )}
                  </div>
                ))}
                {activeCategory.products.length === 0 && (
                  <div className="admin-empty" style={{ gridColumn: '1 / -1' }}>
                    В этой категории пока нет товаров
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-empty">Нет категорий для отображения</div>
          )}
        </div>
      </div>

      {/* Cart Bar */}
      {cart.items.length > 0 && (
        <div className="cart-bar" onClick={() => setShowCart(true)}>
          <div className="cart-info">
            <div className="cart-total">{cart.getTotalAmount()} ₸</div>
            <div className="cart-items-count">{cart.getTotalItems()} товаров</div>
          </div>
          <div>📦</div>
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
      
      {showCart && (
        <CartModal onClose={() => setShowCart(false)} />
      )}
      
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default HomePage;
