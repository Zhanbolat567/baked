import React, { useState, useEffect } from 'react';
import { Category, OptionGroup, ProductStatus } from '../../types';

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

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormState) => Promise<void>;
  categories: Category[];
  optionGroups: OptionGroup[];
  initialData?: ProductFormState | null;
  editingProductId?: number | null;
}

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

const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  optionGroups,
  initialData,
  editingProductId,
}) => {
  const [formData, setFormData] = useState<ProductFormState>(initialData || defaultProductForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setImagePreview(initialData.image_url || null);
    } else {
      setFormData(defaultProductForm);
      setImagePreview(null);
    }
  }, [initialData, isOpen]);

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
      alert('Выберите категорию для товара');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit product', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-product-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProductId ? 'Редактировать товар' : 'Добавить товар'}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="admin-product-modal-grid">
              {/* Image Upload Section */}
              <div className="admin-product-image-section">
                {imagePreview ? (
                  <div className="admin-product-image-preview">
                    <img src={imagePreview} alt="Превью товара" />
                    <button type="button" className="remove-image-btn" onClick={clearImage}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="admin-product-image-placeholder">
                    <span>Нет изображения</span>
                  </div>
                )}
                <label className="btn btn-secondary upload-btn">
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                  Выбрать изображение
                </label>
              </div>

              {/* Form Fields Section */}
              <div className="admin-product-fields">
                <label className="form-label">
                  Название (рус)
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.name_rus}
                    onChange={(e) => setFormData({ ...formData, name_rus: e.target.value })}
                  />
                </label>

                <label className="form-label">
                  Название (каз)
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.name_kaz}
                    onChange={(e) => setFormData({ ...formData, name_kaz: e.target.value })}
                  />
                </label>

                <label className="form-label">
                  Название (eng)
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.name_eng}
                    onChange={(e) => setFormData({ ...formData, name_eng: e.target.value })}
                  />
                </label>

                <div className="form-row">
                  <label className="form-label">
                    Цена (₸)
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      required
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                    />
                  </label>

                  <label className="form-label">
                    Категория
                    <select
                      className="form-input"
                      value={formData.category_id ?? ''}
                      onChange={(e) =>
                        setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : null })
                      }
                      required
                    >
                      <option value="" disabled>
                        Выберите категорию
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name_rus}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="form-label">
                  Описание (необязательно)
                  <textarea
                    className="form-input"
                    rows={3}
                    value={formData.description_rus}
                    onChange={(e) => setFormData({ ...formData, description_rus: e.target.value })}
                    placeholder="Краткое описание для клиентов"
                  />
                </label>

                <label className="form-label">
                  Статус
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                  >
                    <option value="active">Активен</option>
                    <option value="out_of_stock">Нет в наличии</option>
                    <option value="inactive">Скрыт</option>
                  </select>
                </label>

                {/* Option Groups Section */}
                <div className="option-groups-section">
                  <span className="section-label">Группы опций</span>
                  <div className="option-groups-grid">
                    {optionGroups.map((group) => {
                      const checked = formData.option_group_ids.includes(group.id);
                      return (
                        <label key={group.id} className={`option-group-checkbox ${checked ? 'active' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOptionGroup(group.id)}
                          />
                          <span>{group.name_rus}</span>
                        </label>
                      );
                    })}
                    {optionGroups.length === 0 && (
                      <div className="empty-state">Группы опций не созданы</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : editingProductId ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProductModal;
