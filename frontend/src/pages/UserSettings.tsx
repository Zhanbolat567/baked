import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../services/api';
import '../components/components.css';
import './admin/Settings.css';
import { API_URL } from '../config/constants';

const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');

    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+${digits}`;
    if (digits.length <= 4) return `+${digits[0]} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const resolveAvatarUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${API_URL}${url}`;
    return `${API_URL}/${url}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhoneNumber(formatted);
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await api.getUserProfile();
        setFirstName(profile.first_name);
        setLastName(profile.last_name);
        setPhoneNumber(formatPhone(profile.phone_number));
        setAvatarUrl(profile.avatar_url || null);
        setAvatarPreview(resolveAvatarUrl(profile.avatar_url));
        if (token) {
          setAuth(profile, token);
        }
      } catch (err) {
        console.error('Не удалось загрузить профиль пользователя', err);
        setError('Не удалось загрузить профиль');
      }
    };

    loadProfile();
  }, [navigate, setAuth, token]);

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
        phone_number: phoneNumber.replace(/\D/g, ''),
      };

      const updatedUser = await api.updateUserProfile(profileData);

      if (avatarFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const avatarData = { avatar_base64: base64 };
            const avatarResult = await api.updateUserAvatar(avatarData);
            updatedUser.avatar_url = avatarResult.avatar_url;
            setAvatarUrl(avatarResult.avatar_url);
            setAvatarPreview(resolveAvatarUrl(avatarResult.avatar_url));
            setAvatarFile(null);

            if (token) {
              setAuth(updatedUser, token);
            }
            setSuccess('Профиль успешно обновлен');
          } catch (err: any) {
            console.error('Не удалось обновить аватар', err);
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
      console.error('Не удалось обновить профиль', err);
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
      await api.updateUserPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess('Пароль успешно изменен');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Не удалось изменить пароль', err);
      setError(err.response?.data?.detail || 'Не удалось изменить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-settings-page">
      <header>
        <div>
          <h1>Настройки профиля</h1>
          <p>Обновите личные данные и пароль</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Назад</button>
      </header>

      {error && <div className="user-settings-banner error">{error}</div>}
      {success && <div className="user-settings-banner success">{success}</div>}

      <div className="user-settings-grid">
        <div className="user-settings-card">
          <h3>Профиль</h3>
          <form onSubmit={handleProfileUpdate} className="user-settings-form">
            <div className="user-settings-avatar-section">
              <div className="user-settings-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" />
                ) : (
                  <div className="user-settings-avatar-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="user-settings-avatar-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Загрузить фото
                </button>
                <p className="user-settings-avatar-hint">Макс. 5 МБ (JPG, PNG)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="user-settings-row">
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
                placeholder="+7 (777) 777-77-77"
                required
              />
            </div>

            <div className="user-settings-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>

        <div className="user-settings-card">
          <h3>Изменить пароль</h3>
          <form onSubmit={handlePasswordChange} className="user-settings-form">
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

            <div className="user-settings-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Изменение...' : 'Изменить пароль'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
