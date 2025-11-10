import React, { useState, useEffect } from 'react';
import { Menu, Product, CartItemOption } from '../types';
import { useAppStore, useCartStore, useAuthStore } from '../store';
import api from '../services/api';
import ProductModal from '../components/ProductModal';
import CartModal from '../components/CartModal';
import AuthModal from '../components/AuthModal';

const HomePage: React.FC = () => {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const language = useAppStore((state) => state.language);
  const cart = useCartStore();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadMenu();
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
            <select 
              className="language-selector"
              value={language}
              onChange={(e) => useAppStore.getState().setLanguage(e.target.value as any)}
            >
              <option value="rus">Русский</option>
              <option value="kaz">Қазақ</option>
            </select>
            {user ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span>{user.first_name} ({user.bonus_points} ⭐)</span>
                <button className="login-btn" onClick={logout}>Выйти</button>
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
