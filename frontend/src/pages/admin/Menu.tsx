import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../services/api';
import { Category, Product, OptionGroup, Option, ProductStatus } from '../../types';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminProductModal from '../../components/admin/AdminProductModal';

type CategoryFormState = {
  name_rus: string;
  name_kaz: string;
  name_eng: string;
  order: number;
  is_active: boolean;
};

type ProductFormState = {
  name_rus: string;
  name_kaz: string;
  name_eng: string;
  description_rus: string;
  description_kaz: string;
  description_eng: string;
  base_price: number;
  image_url: string;
  status: ProductStatus;
  option_group_ids: number[];
  category_id: number | null;
};

type OptionGroupFormState = {
  name_rus: string;
  name_kaz: string;
  name_eng: string;
  is_required: boolean;
  is_multiple: boolean;
};

type OptionFormState = {
  name_rus: string;
  name_kaz: string;
  name_eng: string;
  price: number;
  is_available: boolean;
};

type SectionKey = 'categories' | 'products' | 'options';
type ProductFilterKey = 'all' | number;

const defaultCategoryForm: CategoryFormState = {
  name_rus: '',
  name_kaz: '',
  name_eng: '',
  order: 0,
  is_active: true,
};

const defaultProductForm: ProductFormState = {
  name_rus: '',
  name_kaz: '',
  name_eng: '',
  description_rus: '',
  description_kaz: '',
  description_eng: '',
  base_price: 0,
  image_url: '',
  status: 'active',
  option_group_ids: [],
  category_id: null,
};

const defaultGroupForm: OptionGroupFormState = {
  name_rus: '',
  name_kaz: '',
  name_eng: '',
  is_required: false,
  is_multiple: false,
};

const defaultOptionForm: OptionFormState = {
  name_rus: '',
  name_kaz: '',
  name_eng: '',
  price: 0,
  is_available: true,
};

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();

  const isAdminUser = isAdmin();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(defaultCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(defaultProductForm);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productFilterCategoryId, setProductFilterCategoryId] = useState<number | 'all'>('all');
  const [groupForm, setGroupForm] = useState<OptionGroupFormState>(defaultGroupForm);
  const [optionForms, setOptionForms] = useState<Record<number, OptionFormState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('categories');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    if (!isAdminUser) {
    navigate('/');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [categoryData, optionGroupData, productData] = await Promise.all([
          api.getCategories(),
          api.getOptionGroups(),
          api.getProducts(),
        ]);

        setCategories(categoryData);
        setOptionGroups(optionGroupData);
        setProducts(productData);
        setProductFilterCategoryId('all');

        if (categoryData.length > 0) {
          const initialCategoryId = categoryData[0].id;
          setSelectedCategoryId(initialCategoryId);
          setProductForm((prev) => ({ ...prev, category_id: prev.category_id ?? initialCategoryId }));
        }
      } catch (err: any) {
        console.error('Failed to load admin menu data', err);
        setError(err.response?.data?.detail || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdminUser, navigate]);

  useEffect(() => {
    if (!editingProductId && selectedCategoryId !== null) {
      setProductForm((prev) => ({ ...prev, category_id: selectedCategoryId }));
    }
  }, [selectedCategoryId, editingProductId]);

  useEffect(() => {
    const fetchProducts = async () => {
      const filterId = productFilterCategoryId === 'all' ? undefined : productFilterCategoryId;
      await loadProducts(filterId as number | undefined);
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFilterCategoryId]);

  useEffect(() => {
    if (!editingProductId && productFilterCategoryId !== 'all') {
      setProductForm((prev) => ({ ...prev, category_id: productFilterCategoryId }));
    }
  }, [productFilterCategoryId, editingProductId]);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const getDefaultProductCategoryId = () => {
    if (productFilterCategoryId !== 'all') {
      return productFilterCategoryId;
    }
    if (selectedCategoryId !== null) {
      return selectedCategoryId;
    }
    return categories[0]?.id ?? null;
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
        setProductForm((prev) => ({ ...prev, category_id: created.id }));
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
      setProductFilterCategoryId('all');
      if (nextCategory === null) {
        setProducts([]);
      } else {
        await loadProducts();
        setProductForm((prev) => ({ ...prev, category_id: nextCategory }));
      }
    } catch (err: any) {
      console.error('Failed to delete category', err);
      setError(err.response?.data?.detail || 'Не удалось удалить категорию');
    }
  };

  const handleProductSubmit = async (data: ProductFormState) => {
    if (!data.category_id) {
      setError('Выберите категорию для товара');
      return;
    }

    resetMessages();

    const payload = {
      ...data,
      category_id: data.category_id,
      base_price: Number(data.base_price),
      option_group_ids: data.option_group_ids,
    } as any;

    try {
      if (editingProductId) {
        await api.updateProduct(editingProductId, payload);
        setSuccess('Товар обновлен');
      } else {
        await api.createProduct(payload);
        setSuccess('Товар создан');
      }

      const filterId = productFilterCategoryId === 'all' ? undefined : productFilterCategoryId;
      await loadProducts(filterId as number | undefined);
      setIsProductModalOpen(false);
      setEditingProductId(null);
      setProductForm({ ...defaultProductForm, category_id: getDefaultProductCategoryId() });
    } catch (err: any) {
      console.error('Failed to submit product', err);
      setError(err.response?.data?.detail || 'Не удалось сохранить товар');
      throw err;
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      name_rus: product.name_rus,
      name_kaz: product.name_kaz,
      name_eng: product.name_eng,
      description_rus: product.description_rus || '',
      description_kaz: product.description_kaz || '',
      description_eng: product.description_eng || '',
      base_price: product.base_price,
      image_url: product.image_url || '',
      status: product.status,
      option_group_ids: product.option_groups.map((group) => group.id),
      category_id: product.category_id,
    });
    setIsProductModalOpen(true);
    resetMessages();
  };

  const handleAddProduct = () => {
    setEditingProductId(null);
    setProductForm({ ...defaultProductForm, category_id: getDefaultProductCategoryId() });
    setIsProductModalOpen(true);
    resetMessages();
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

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    try {
      await api.createOptionGroup(groupForm);
      const optionGroupData = await api.getOptionGroups();
      setOptionGroups(optionGroupData);
      setGroupForm(defaultGroupForm);
      setSuccess('Группа опций создана');
    } catch (err: any) {
      console.error('Failed to create option group', err);
      setError(err.response?.data?.detail || 'Не удалось создать группу опций');
    }
  };

  const handleOptionSubmit = (groupId: number) => async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const formState = optionForms[groupId] || defaultOptionForm;

    try {
      await api.createOption({
        group_id: groupId,
        name_rus: formState.name_rus,
        name_kaz: formState.name_kaz,
        name_eng: formState.name_eng,
        price: Number(formState.price),
        is_available: formState.is_available,
      });

      const optionGroupData = await api.getOptionGroups();
      setOptionGroups(optionGroupData);
      setOptionForms((prev) => ({
        ...prev,
        [groupId]: defaultOptionForm,
      }));
      setSuccess('Опция создана');
    } catch (err: any) {
      console.error('Failed to create option', err);
      setError(err.response?.data?.detail || 'Не удалось создать опцию');
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!window.confirm('Удалить опцию?')) {
      return;
    }

    resetMessages();

    try {
      await api.deleteOption(optionId);
      const optionGroupData = await api.getOptionGroups();
      setOptionGroups(optionGroupData);
      setSuccess('Опция удалена');
    } catch (err: any) {
      console.error('Failed to delete option', err);
      setError(err.response?.data?.detail || 'Не удалось удалить опцию');
    }
  };

  const sectionTabs: { key: SectionKey; label: string }[] = [
    { key: 'categories', label: 'Категории' },
    { key: 'products', label: 'Товары' },
    { key: 'options', label: 'Опции' },
  ];

  const productFilterChips: { key: ProductFilterKey; label: string }[] = [
    { key: 'all', label: 'Все' },
    ...categories.map((category) => ({ key: category.id, label: category.name_rus })),
  ];

  const renderCategoriesSection = () => (
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
  );

  const renderProductsSection = () => (
    <section className="admin-card admin-card--wide">
      <div className="admin-card-header">
        <div>
          <h2>Товары</h2>
          <p className="admin-subtitle">Добавляйте позиции, редактируйте цены и управляйте опциями</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAddProduct}
        >
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
  );

  const renderOptionsSection = () => (
    <section className="admin-card admin-card--wide">
      <div className="admin-card-header">
        <div>
          <h2>Опции</h2>
          <p className="admin-subtitle">Создавайте группы и добавляйте индивидуальные опции</p>
        </div>
      </div>

      <div className="admin-grid">
        <div>
          <h3>Новая группа опций</h3>
          <form className="admin-form" onSubmit={handleGroupSubmit}>
            <label>
              Название (рус)
              <input
                type="text"
                required
                value={groupForm.name_rus}
                onChange={(e) => setGroupForm({ ...groupForm, name_rus: e.target.value })}
              />
            </label>
            <label>
              Название (каз)
              <input
                type="text"
                required
                value={groupForm.name_kaz}
                onChange={(e) => setGroupForm({ ...groupForm, name_kaz: e.target.value })}
              />
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={groupForm.is_required}
                onChange={(e) => setGroupForm({ ...groupForm, is_required: e.target.checked })}
              />
              <span>Выбор обязателен</span>
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={groupForm.is_multiple}
                onChange={(e) => setGroupForm({ ...groupForm, is_multiple: e.target.checked })}
              />
              <span>Можно выбрать несколько опций</span>
            </label>
            <button type="submit" className="btn btn-primary">Создать группу</button>
          </form>
        </div>

        <div>
          <h3>Существующие группы</h3>
          {optionGroups.length === 0 && <div className="admin-empty">Группы опций отсутствуют</div>}
          <div className="admin-option-groups">
            {optionGroups.map((group) => {
              const formState = optionForms[group.id] || defaultOptionForm;
              return (
                <div key={group.id} className="admin-option-group">
                  <div className="admin-option-group_header">
                    <div>
                      <strong>{group.name_rus}</strong>
                      <div className="admin-list-meta">
                        {group.is_required ? 'Обязательная' : 'Необязательная'} · {group.is_multiple ? 'Множественный выбор' : 'Один вариант'}
                      </div>
                    </div>
                  </div>
                  <div className="admin-options-list">
                    {group.options.map((option: Option) => (
                      <div key={option.id} className="admin-list-item">
                        <div>
                          <strong>{option.name_rus}</strong>
                          <div className="admin-list-meta">
                            {option.price} ₸ · {option.is_available ? 'Доступна' : 'Недоступна'}
                          </div>
                        </div>
                        <button className="link danger" onClick={() => handleDeleteOption(option.id)}>Удалить</button>
                      </div>
                    ))}
                    {group.options.length === 0 && <div className="admin-empty">Опции отсутствуют</div>}
                  </div>
                  <form className="admin-form inline" onSubmit={handleOptionSubmit(group.id)}>
                    <label>
                      Название (рус)
                      <input
                        type="text"
                        required
                        value={formState.name_rus}
                        onChange={(e) => setOptionForms((prev) => ({
                          ...prev,
                          [group.id]: { ...formState, name_rus: e.target.value },
                        }))}
                      />
                    </label>
                    <label>
                      Название (каз)
                      <input
                        type="text"
                        required
                        value={formState.name_kaz}
                        onChange={(e) => setOptionForms((prev) => ({
                          ...prev,
                          [group.id]: { ...formState, name_kaz: e.target.value },
                        }))}
                      />
                    </label>
                    <label>
                      Цена
                      <input
                        type="number"
                        min={0}
                        required
                        value={formState.price}
                        onChange={(e) => setOptionForms((prev) => ({
                          ...prev,
                          [group.id]: { ...formState, price: Number(e.target.value) },
                        }))}
                      />
                    </label>
                    <label className="admin-checkbox">
                      <input
                        type="checkbox"
                        checked={formState.is_available}
                        onChange={(e) => setOptionForms((prev) => ({
                          ...prev,
                          [group.id]: { ...formState, is_available: e.target.checked },
                        }))}
                      />
                      <span>Опция доступна</span>
                    </label>
                    <button type="submit" className="btn btn-secondary">Добавить опцию</button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content admin-content--wide">
        <div className="admin-page-header">
          <h1>Управление меню</h1>
        </div>

        {loading && <div className="admin-banner info">Загрузка...</div>}
        {error && <div className="admin-banner error">{error}</div>}
        {success && <div className="admin-banner success">{success}</div>}

        <div className="admin-sections">
          {activeSection === 'categories' && renderCategoriesSection()}
          {activeSection === 'products' && renderProductsSection()}
          {activeSection === 'options' && renderOptionsSection()}
        </div>
      </div>
      
      {/* Product Modal */}
      <AdminProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProductId(null);
        }}
        onSubmit={handleProductSubmit}
        categories={categories}
        optionGroups={optionGroups}
        initialData={productForm}
        editingProductId={editingProductId}
      />
    </div>
  );
};

export default Menu;
