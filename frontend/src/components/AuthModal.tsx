import React, { useState } from 'react';
import { useAppStore, useAuthStore } from '../store';
import api from '../services/api';
import './components.css';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const language = useAppStore((state) => state.language);
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const getText = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      welcome: { rus: 'Добро пожаловать!', kaz: 'Қош келдіңіз!', eng: 'Welcome!' },
      login: { rus: 'Войти', kaz: 'Кіру', eng: 'Login' },
      register: { rus: 'Создать аккаунт', kaz: 'Аккаунт жасау', eng: 'Create account' },
      phoneNumber: { rus: 'Номер телефона', kaz: 'Телефон нөмірі', eng: 'Phone number' },
      password: { rus: 'Пароль', kaz: 'Құпия сөз', eng: 'Password' },
      firstName: { rus: 'Имя', kaz: 'Аты', eng: 'First name' },
      lastName: { rus: 'Фамилия', kaz: 'Тегі', eng: 'Last name' },
      haveAccount: { rus: 'Есть аккаунт', kaz: 'Аккаунт бар', eng: 'Have account' },
      noAccount: { rus: 'Нет аккаунта?', kaz: 'Аккаунт жоқ па?', eng: 'No account?' },
      createOne: { rus: 'Создать', kaz: 'Жасау', eng: 'Create one' },
    };
    return translations[key]?.[language] || translations[key]?.['rus'] || key;
  };

  const validatePhone = (phone: string): boolean => {
    // Kazakh phone format: +7 (7XX) XXX-XX-XX
    const phoneRegex = /^\+?7\s?\(?[0-9]{3}\)?\s?[0-9]{3}-?[0-9]{2}-?[0-9]{2}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await api.login({
          phone_number: phoneNumber.replace(/\D/g, ''),
          password
        });
        
        setAuth(response.user, response.access_token);
        onClose();
      } else {
        // Register
        if (!firstName || !lastName) {
          setError('Пожалуйста, заполните все поля');
          setLoading(false);
          return;
        }

        const response = await api.register({
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber.replace(/\D/g, ''),
          password
        });
        
        setAuth(response.user, response.access_token);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Компонент для отображения одного правила пароля
  function PasswordRule({ valid, text }: { valid: boolean; text: string }) {
    return (
      <li className={valid ? 'password-rule valid' : 'password-rule'}>
        {valid ? <span style={{color: '#2ecc40'}}>✔</span> : <span style={{color: '#ff4136'}}>✖</span>} {text}
      </li>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{getText('welcome')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Toggle Login/Register */}
            <div className="auth-toggle">
              <button
                type="button"
                className={`auth-toggle-btn ${isLogin ? 'active' : ''}`}
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                }}
              >
                {getText('login')}
              </button>
              <button
                type="button"
                className={`auth-toggle-btn ${!isLogin ? 'active' : ''}`}
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
              >
                {getText('register')}
              </button>
            </div>

            {/* Registration Fields */}
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">{getText('firstName')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Temirlan"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{getText('lastName')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Kushkinbayev"
                  />
                </div>
              </>
            )}

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label">{getText('phoneNumber')} *</label>
              <input
                type="tel"
                className="form-input"
                value={phoneNumber}
                onChange={handlePhoneChange}
                required
                placeholder="+7 (708) 871-12-38"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">{getText('password')} *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            {/* Repeat Password */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Повторите пароль *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
            {/* Password Rules */}
            {!isLogin && (
              <div className="password-rules">
                <div className="password-rules-title">Требования к паролю</div>
                <ul>
                  <PasswordRule valid={password.length >= 8} text="Минимум 8 символов" />
                  <PasswordRule valid={/[A-Z]/.test(password)} text="Содержит заглавную букву" />
                  <PasswordRule valid={/[a-z]/.test(password)} text="Содержит строчную букву" />
                  <PasswordRule valid={/\d/.test(password)} text="Содержит цифру" />
                  <PasswordRule valid={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)} text="Содержит специальный символ" />
                  <PasswordRule valid={!/(0123|1234|abcd|qwerty|password)/i.test(password)} text="Не содержит простых последовательностей" />
                  <PasswordRule valid={!/(.)\1{2,}/.test(password)} text="Не содержит повторяющихся символов" />
                  <PasswordRule valid={password === repeatPassword && password.length > 0} text="Пароли должны совпадать" />
                </ul>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Загрузка...' : (isLogin ? getText('login') : getText('register'))}
            </button>

            {/* Toggle Text */}
            <div className="auth-toggle-text">
              {isLogin ? (
                <>
                  {getText('noAccount')}{' '}
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => setIsLogin(false)}
                  >
                    {getText('createOne')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => setIsLogin(true)}
                  >
                    {getText('haveAccount')}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
