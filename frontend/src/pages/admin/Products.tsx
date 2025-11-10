import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../services/api';
import { Category, Product } from '../../types';
import AdminSidebar from '../../components/admin/AdminSidebar';

type ProductFilterKey = 'all' | number;

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const isAdminUser = isAdmin();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productFilterCategoryId, setProductFilterCategoryId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminUser) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [categoryData, productData] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
        ]);

        setCategories(categoryData);
        setProducts(productData);
        setProductFilterCategoryId('all');
      } catch (err: any) {
        console.error('Failed to load data', err);
        setError(err.response?.data?.detail || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdminUser, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      const filterId = productFilterCategoryId === 'all' ? undefined : productFilterCategoryId;
      await loadProducts(filterId as number | undefined);
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFilterCategoryId]);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const filteredProducts = useMemo(() => {
    if (productFilterCategoryId === 'all') {
      return products;
    }
    return products.filter((product) => product.category_id === productFilterCategoryId);
  }, [productFilterCategoryId, products]);

  const loadProducts = async (categoryId?: number | null) => {
    try {
      const data = await api.getProducts(categoryId ?? undefined);
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to load products', err);
      setError(err.response?.data?.detail || 'Не удалось загрузить товары');
    }
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/admin/products/edit/${product.id}`);
  };

  const handleAddProduct = () => {
    navigate('/admin/products/new');
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Удалить товар?')) {
      return;
    }

    resetMessages();

    try {
      await api.deleteProduct(productId);
      setSuccess('Товар удален');
      const filterId = productFilterCategoryId === 'all' ? undefined : productFilterCategoryId;
      await loadProducts(filterId as number | undefined);
    } catch (err: any) {
      console.error('Failed to delete product', err);
      setError(err.response?.data?.detail || 'Не удалось удалить товар');
    }
  };

  const productFilterChips: { key: ProductFilterKey; label: string }[] = [
    { key: 'all', label: 'Все' },
    ...categories.map((category) => ({ key: category.id, label: category.name_rus })),
  ];

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content admin-content--wide">
        <div className="admin-page-header">
          <h1>Управление товарами</h1>
        </div>

        {loading && <div className="admin-banner info">Загрузка...</div>}
        {error && <div className="admin-banner error">{error}</div>}
        {success && <div className="admin-banner success">{success}</div>}

        <section className="admin-card admin-card--wide">
          <div className="admin-card-header">
            <div>
              <h2>Товары</h2>
              <p className="admin-subtitle">Добавляйте позиции, редактируйте цены и управляйте опциями</p>
            </div>
            <button className="btn btn-primary" onClick={handleAddProduct}>
              + Добавить товар
            </button>
          </div>

          <div className="admin-chip-group">
            {productFilterChips.map((chip) => (
              <button
                key={chip.key}
                className={`admin-chip ${productFilterCategoryId === chip.key ? 'active' : ''}`}
                onClick={() => setProductFilterCategoryId(chip.key === 'all' ? 'all' : chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="admin-product-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="admin-product-card">
                <div className="admin-product-card__image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name_rus} />
                  ) : (
                    <div className="admin-product-card__placeholder">Нет фото</div>
                  )}
                </div>
                <div className="admin-product-card__body">
                  <div className="admin-product-card__name">{product.name_rus}</div>
                  <div className="admin-product-card__price">{product.base_price} ₸</div>
                </div>
                <div className="admin-product-card__footer">
                  <button className="btn btn-light" type="button" onClick={() => handleEditProduct(product)}>
                    Редактировать
                  </button>
                  <button className="btn btn-danger-outline" type="button" onClick={() => handleDeleteProduct(product.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && <div className="admin-empty">Товары не найдены</div>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Products;
