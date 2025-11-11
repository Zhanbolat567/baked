import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuthStore } from '../../store';
import api from '../../services/api';
import '../../components/components.css';
import './Settings.css';
import { API_URL } from '../../config/constants';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, user, setAuth, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPhone = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as +7 (7XX) XXX-XX-XX
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+${digits}`;
    if (digits.length <= 4) return `+${digits[0]} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhoneNumber(formatted);
  };

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

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }

    if (user) {
  setFirstName(user.first_name);
  setLastName(user.last_name);
  // Format phone number on load
  const formatted = formatPhone(user.phone_number);
  setPhoneNumber(formatted);
  const resolvedAvatar = resolveAvatarUrl(user.avatar_url);
  setAvatarUrl(user.avatar_url || null);
  setAvatarPreview(resolvedAvatar);
    }
  }, [isAdmin, navigate, user]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Файл слишком большой. Максимум 5 МБ');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const profileData: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.replace(/\D/g, ''), // Send only digits
      };

      const updatedUser = await api.updateAdminProfile(profileData);

      if (avatarFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const avatarData = { avatar_base64: base64 };
            const avatarResult = await api.updateAdminAvatar(avatarData);
            updatedUser.avatar_url = avatarResult.avatar_url;
            setAvatarUrl(avatarResult.avatar_url);
            setAvatarPreview(resolveAvatarUrl(avatarResult.avatar_url));
            setAvatarFile(null);

            if (token) {
              setAuth(updatedUser, token);
            }
            setSuccess('Профиль успешно обновлен');
          } catch (err: any) {
            console.error('Failed to update avatar', err);
            setError(err.response?.data?.detail || 'Не удалось обновить аватар');
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(avatarFile);
      } else {
        if (token) {
          setAuth(updatedUser, token);
        }
        setSuccess('Профиль успешно обновлен');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setError(err.response?.data?.detail || 'Не удалось обновить профиль');
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      await api.updateAdminPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess('Пароль успешно изменен');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to change password', err);
      setError(err.response?.data?.detail || 'Не удалось изменить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-page">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">Настройки</h1>
              <p className="admin-page-subtitle">Редактирование профиля и изменение пароля</p>
            </div>
          </div>

          {error && <div className="admin-banner error">{error}</div>}
          {success && <div className="admin-banner success">{success}</div>}

          <div className="settings-container">
            {/* Profile Section */}
            <div className="settings-card">
              <h2 className="settings-card-title">Профиль</h2>
              <form onSubmit={handleProfileUpdate} className="settings-form">
                <div className="settings-avatar-section">
                  <div className="settings-avatar-preview">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="settings-avatar-img" />
                    ) : (
                      <div className="settings-avatar-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="settings-avatar-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Загрузить фото
                    </button>
                    <p className="settings-avatar-hint">Макс. 5 МБ (JPG, PNG)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Имя</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Введите имя"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Фамилия</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Введите фамилию"
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Номер телефона</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="+7 (708) 871-12-38"
                    required
                  />
                </div>

                <div className="settings-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Section */}
            <div className="settings-card">
              <h2 className="settings-card-title">Изменить пароль</h2>
              <form onSubmit={handlePasswordChange} className="settings-form">
                <div className="form-field">
                  <label>Текущий пароль</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Введите текущий пароль"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Новый пароль</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Подтвердите новый пароль</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Введите пароль ещё раз"
                    required
                  />
                </div>

                <div className="settings-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Изменение...' : 'Изменить пароль'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
