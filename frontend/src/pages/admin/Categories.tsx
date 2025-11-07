import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../services/api';
import { Category } from '../../types';
import AdminSidebar from '../../components/admin/AdminSidebar';

type CategoryFormState = {
  name_rus: string;
  name_kaz: string;
  name_eng: string;
  order: number;
  is_active: boolean;
};

const defaultCategoryForm: CategoryFormState = {
  name_rus: '',
  name_kaz: '',
  name_eng: '',
  order: 0,
  is_active: true,
};

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const isAdminUser = isAdmin();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(defaultCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
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
        const categoryData = await api.getCategories();
        setCategories(categoryData);
        if (categoryData.length > 0) {
          setSelectedCategoryId(categoryData[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load categories', err);
        setError(err.response?.data?.detail || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdminUser, navigate]);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    try {
      if (editingCategoryId) {
        await api.updateCategory(editingCategoryId, {
          ...categoryForm,
          order: Number(categoryForm.order),
        });
        setSuccess('Категория обновлена');
      } else {
        const created = await api.createCategory({
          ...categoryForm,
          order: Number(categoryForm.order),
        });
        setSuccess('Категория создана');
        setSelectedCategoryId(created.id);
      }

      const categoryData = await api.getCategories();
      setCategories(categoryData);
      setCategoryForm(defaultCategoryForm);
      setEditingCategoryId(null);
    } catch (err: any) {
      console.error('Failed to submit category', err);
      setError(err.response?.data?.detail || 'Не удалось сохранить категорию');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name_rus: category.name_rus,
      name_kaz: category.name_kaz,
      name_eng: category.name_eng,
      order: category.order,
      is_active: category.is_active,
    });
    resetMessages();
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm('Удалить категорию? Товары внутри также будут удалены.')) {
      return;
    }
    resetMessages();

    try {
      await api.deleteCategory(categoryId);
      setSuccess('Категория удалена');
      const categoryData = await api.getCategories();
      setCategories(categoryData);
      const nextCategory = categoryData.length > 0 ? categoryData[0].id : null;
      setSelectedCategoryId(nextCategory);
    } catch (err: any) {
      console.error('Failed to delete category', err);
      setError(err.response?.data?.detail || 'Не удалось удалить категорию');
    }
  };

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-page-header">
          <h1>Управление категориями</h1>
        </div>

        {loading && <div className="admin-banner info">Загрузка...</div>}
        {error && <div className="admin-banner error">{error}</div>}
        {success && <div className="admin-banner success">{success}</div>}

        <section className="admin-card">
          <div className="admin-card-header">
            <h2>Категории</h2>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCategoryForm(defaultCategoryForm);
                setEditingCategoryId(null);
                resetMessages();
              }}
            >
              + Новая категория
            </button>
          </div>

          <div className="admin-grid">
            <div>
              <div className="admin-list">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`admin-list-item ${selectedCategoryId === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <div>
                      <strong>{category.name_rus}</strong>
                      <div className="admin-list-meta">
                        Порядок: {category.order} · {category.is_active ? 'Активна' : 'Скрыта'}
                      </div>
                    </div>
                    <div className="admin-list-actions">
                      <button
                        className="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        className="link danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && <div className="admin-empty">Категории не найдены</div>}
              </div>
            </div>

            <div>
              <h3>{editingCategoryId ? 'Редактирование категории' : 'Создание категории'}</h3>
              <form className="admin-form" onSubmit={handleCategorySubmit}>
                <label>
                  Название (рус)
                  <input
                    type="text"
                    required
                    value={categoryForm.name_rus}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_rus: e.target.value })}
                  />
                </label>
                <label>
                  Название (каз)
                  <input
                    type="text"
                    required
                    value={categoryForm.name_kaz}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_kaz: e.target.value })}
                  />
                </label>
                <label>
                  Название (eng)
                  <input
                    type="text"
                    required
                    value={categoryForm.name_eng}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_eng: e.target.value })}
                  />
                </label>
                <label>
                  Порядок
                  <input
                    type="number"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: Number(e.target.value) })}
                  />
                </label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                  />
                  <span>Активна</span>
                </label>
                <button type="submit" className="btn btn-primary">
                  {editingCategoryId ? 'Сохранить изменения' : 'Создать категорию'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Categories;
