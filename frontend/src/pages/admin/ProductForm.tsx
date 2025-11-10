import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../services/api';
import { Category, OptionGroup, ProductStatus } from '../../types';

type ProductFormState = {
  name_rus: string;
  name_kaz: string;
  description_rus: string;
  description_kaz: string;
  base_price: number;
  image_url: string;
  status: ProductStatus;
  option_group_ids: number[];
  category_id: number | null;
};

const defaultProductForm: ProductFormState = {
  name_rus: '',
  name_kaz: '',
  description_rus: '',
  description_kaz: '',
  base_price: 0,
  image_url: '',
  status: 'active',
  option_group_ids: [],
  category_id: null,
};

const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuthStore();
  const isEditing = !!id;

  const [formData, setFormData] = useState<ProductFormState>(defaultProductForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/admin/products');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [categoryData, optionGroupData] = await Promise.all([
          api.getCategories(),
          api.getOptionGroups(),
        ]);

        setCategories(categoryData);
        setOptionGroups(optionGroupData);

        if (isEditing && id) {
          const products = await api.getProducts();
          const product = products.find((p) => p.id === parseInt(id));
          if (product) {
            setFormData({
              name_rus: product.name_rus,
              name_kaz: product.name_kaz,
              description_rus: product.description_rus || '',
              description_kaz: product.description_kaz || '',
              base_price: product.base_price,
              image_url: product.image_url || '',
              status: product.status,
              option_group_ids: product.option_groups.map((g) => g.id),
              category_id: product.category_id,
            });
            setImagePreview(product.image_url || null);
          }
        } else if (categoryData.length > 0) {
          setFormData((prev) => ({ ...prev, category_id: categoryData[0].id }));
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin, navigate, id, isEditing]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result;
      if (typeof result === 'string') {
        setFormData((prev) => ({ ...prev, image_url: result }));
        setImagePreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_url: '' }));
  };

  const toggleOptionGroup = (groupId: number) => {
    setFormData((prev) => {
      const exists = prev.option_group_ids.includes(groupId);
      const option_group_ids = exists
        ? prev.option_group_ids.filter((id) => id !== groupId)
        : [...prev.option_group_ids, groupId];
      return { ...prev, option_group_ids };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) {
      setError('Выберите категорию для товара');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        base_price: Number(formData.base_price),
        option_group_ids: formData.option_group_ids,
      } as any;

      if (isEditing && id) {
        await api.updateProduct(parseInt(id), payload);
      } else {
        await api.createProduct(payload);
      }

      navigate('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось сохранить товар');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="product-form-page">
        <div className="container">
          <div className="loading-spinner">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-form-page">
      <div className="container">
        <div className="product-form-header">
          <button className="back-button" onClick={() => navigate('/admin/products')}>
            ← Назад
          </button>
          <h1>{isEditing ? 'Редактировать товар' : 'Добавить товар'}</h1>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form-container">
          <div className="product-form-layout">
            {/* Left Column - Image */}
            <div className="product-form-sidebar">
              <div className="image-upload-section">
                {imagePreview ? (
                  <div className="image-preview-box">
                    <img src={imagePreview} alt="Превью товара" />
                    <button type="button" className="remove-image-button" onClick={clearImage}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="image-placeholder-box">
                    <span>Нет изображения</span>
                  </div>
                )}
                <label className="upload-image-button">
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                  Выбрать изображение
                </label>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="product-form-main">
              <div className="form-section">
                <label className="form-field">
                  <span className="field-label">Название (рус)</span>
                  <input
                    type="text"
                    required
                    value={formData.name_rus}
                    onChange={(e) => setFormData({ ...formData, name_rus: e.target.value })}
                    placeholder="Введите название товара на русском"
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Название (каз)</span>
                  <input
                    type="text"
                    required
                    value={formData.name_kaz}
                    onChange={(e) => setFormData({ ...formData, name_kaz: e.target.value })}
                    placeholder="Тауар атауын қазақ тілінде енгізіңіз"
                  />
                </label>

                <div className="form-row-2">
                  <label className="form-field">
                    <span className="field-label">Цена (₸)</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </label>

                  <label className="form-field">
                    <span className="field-label">Категория</span>
                    <select
                      required
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name_rus}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="form-field">
                  <span className="field-label">Описание (рус, необязательно)</span>
                  <textarea
                    value={formData.description_rus}
                    onChange={(e) => setFormData({ ...formData, description_rus: e.target.value })}
                    placeholder="Краткое описание для клиентов"
                    rows={3}
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Описание (каз, необязательно)</span>
                  <textarea
                    value={formData.description_kaz}
                    onChange={(e) => setFormData({ ...formData, description_kaz: e.target.value })}
                    placeholder="Клиенттерге арналған қысқаша сипаттама"
                    rows={3}
                  />
                </label>
              </div>

              <div className="form-section">
                <h3 className="section-title">Группы опций</h3>
                <div className="option-groups-list">
                  {optionGroups.map((group) => (
                    <label key={group.id} className="option-group-item">
                      <input
                        type="checkbox"
                        checked={formData.option_group_ids.includes(group.id)}
                        onChange={() => toggleOptionGroup(group.id)}
                      />
                      <span>{group.name_rus}</span>
                      <span className="option-count">
                        ({group.is_required ? 'обязательно' : 'необязательно'})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => navigate('/admin/products')}
                  disabled={isSubmitting}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
