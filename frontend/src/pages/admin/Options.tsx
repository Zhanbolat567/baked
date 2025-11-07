import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../services/api';
import { OptionGroup, Option } from '../../types';
import AdminSidebar from '../../components/admin/AdminSidebar';

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

const Options: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const isAdminUser = isAdmin();

  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [groupForm, setGroupForm] = useState<OptionGroupFormState>(defaultGroupForm);
  const [optionForms, setOptionForms] = useState<Record<number, OptionFormState>>({});
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
        const optionGroupData = await api.getOptionGroups();
        setOptionGroups(optionGroupData);
      } catch (err: any) {
        console.error('Failed to load option groups', err);
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

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content admin-content--wide">
        <div className="admin-page-header">
          <h1>Управление опциями</h1>
        </div>

        {loading && <div className="admin-banner info">Загрузка...</div>}
        {error && <div className="admin-banner error">{error}</div>}
        {success && <div className="admin-banner success">{success}</div>}

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
                <label>
                  Название (eng)
                  <input
                    type="text"
                    required
                    value={groupForm.name_eng}
                    onChange={(e) => setGroupForm({ ...groupForm, name_eng: e.target.value })}
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
                <button type="submit" className="btn btn-primary">
                  Создать группу
                </button>
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
                      <div className="admin-option-group-header">
                        <div>
                          <strong>{group.name_rus}</strong>
                          <div className="admin-list-meta">
                            {group.is_required ? 'Обязательная' : 'Необязательная'} ·{' '}
                            {group.is_multiple ? 'Множественный выбор' : 'Один вариант'}
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
                            <button className="link danger" onClick={() => handleDeleteOption(option.id)}>
                              Удалить
                            </button>
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
                            onChange={(e) =>
                              setOptionForms((prev) => ({
                                ...prev,
                                [group.id]: { ...formState, name_rus: e.target.value },
                              }))
                            }
                          />
                        </label>
                        <label>
                          Название (каз)
                          <input
                            type="text"
                            required
                            value={formState.name_kaz}
                            onChange={(e) =>
                              setOptionForms((prev) => ({
                                ...prev,
                                [group.id]: { ...formState, name_kaz: e.target.value },
                              }))
                            }
                          />
                        </label>
                        <label>
                          Название (eng)
                          <input
                            type="text"
                            required
                            value={formState.name_eng}
                            onChange={(e) =>
                              setOptionForms((prev) => ({
                                ...prev,
                                [group.id]: { ...formState, name_eng: e.target.value },
                              }))
                            }
                          />
                        </label>
                        <label>
                          Цена
                          <input
                            type="number"
                            min={0}
                            required
                            value={formState.price}
                            onChange={(e) =>
                              setOptionForms((prev) => ({
                                ...prev,
                                [group.id]: { ...formState, price: Number(e.target.value) },
                              }))
                            }
                          />
                        </label>
                        <label className="admin-checkbox">
                          <input
                            type="checkbox"
                            checked={formState.is_available}
                            onChange={(e) =>
                              setOptionForms((prev) => ({
                                ...prev,
                                [group.id]: { ...formState, is_available: e.target.checked },
                              }))
                            }
                          />
                          <span>Опция доступна</span>
                        </label>
                        <button type="submit" className="btn btn-secondary">
                          Добавить опцию
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Options;
