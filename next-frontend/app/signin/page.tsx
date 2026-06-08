'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import './signin.css';

// Тип для информации о блокировке
interface LockInfo {
  is_locked: boolean;
  locked_until?: string;
  remaining_seconds?: number;
  can_reset?: boolean;
}

// Тип для ответа от API при блокировке
interface LockResponse {
  is_locked: boolean;
  locked_until?: string;
  remaining_seconds?: number;
  can_reset?: boolean;
  message?: string;
}

// Тип для ошибки с response
interface ErrorWithResponse {
  response?: {
    data?: {
      locked?: boolean;
      message?: string;
      locked_until?: string;
      remaining_seconds?: number;
      can_reset?: boolean;
    };
  };
  message?: string;
}

export default function Login() {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Таймер обратного отсчета при блокировке
  useEffect(() => {
    if (lockInfo?.is_locked && lockInfo.remaining_seconds) {
      setCountdown(lockInfo.remaining_seconds);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            checkLockStatus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lockInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setLockInfo(null);
  };

  const checkLockStatus = async () => {
    if (!formData.login) return;
    
    try {
      const response = await apiClient.post<LockResponse>('/check-lock-status', {
        login: formData.login
      });
      setLockInfo(response);
    } catch (err) {
      console.error('Error checking lock status:', err);
    }
  };

  // Проверяем статус блокировки при вводе логина
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (formData.login) {
        checkLockStatus();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [formData.login]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(formData.login, formData.password);
    } catch (err: unknown) {
      // Проверяем на блокировку
      const error = err as ErrorWithResponse;
      
      if (error?.response?.data?.locked) {
        const lockData = {
          is_locked: true,
          locked_until: error.response.data.locked_until,
          remaining_seconds: error.response.data.remaining_seconds,
          can_reset: error.response.data.can_reset
        };
        setLockInfo(lockData);
        setError(error.response.data.message || 'Вход заблокирован');
      } else {
        const message = error instanceof Error ? error.message : 'Ошибка входа';
        const hint = message.includes('Неверный логин') || message.includes('credentials')
          ? ' В поле «Логин» можно ввести email. Если вы купили билет — используйте логин и пароль из письма или со страницы после оплаты.'
          : '';
        setError(message + hint);
        
        // Обновляем статус блокировки после ошибки
        checkLockStatus();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">ВХОД В АККАУНТ</h1>
            <p className="auth-subtitle">ВВЕДИТЕ ЛОГИН И ПАРОЛЬ</p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                ЛОГИН ИЛИ EMAIL <span className="required">*</span>
              </label>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleChange}
                required
                disabled={lockInfo?.is_locked}
                placeholder="ВАШ ЛОГИН ИЛИ EMAIL"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <div className="form-links">
                <label className="form-label">
                  ПАРОЛЬ <span className="required">*</span>
                </label>
                <Link href="/forgot-password" className="forgot-link">
                  ЗАБЫЛИ ПАРОЛЬ?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={lockInfo?.is_locked}
                placeholder="ВАШ ПАРОЛЬ"
                className="form-input"
              />
            </div>
            
            {error && (
              <div className="error-box">
                <div className="error-text">{error}</div>
                {lockInfo?.is_locked && countdown > 0 && (
                  <div className="warning-text">
                    ВХОД РАЗБЛОКИРУЕТСЯ ЧЕРЕЗ: {formatTime(countdown)}
                  </div>
                )}
                {lockInfo?.can_reset && (
                  <div>
                    <Link href="/forgot-password" className="info-link">
                      ОТПРАВИТЬ ССЫЛКУ ДЛЯ СБРОСА ПАРОЛЯ
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading || lockInfo?.is_locked}
              className="auth-btn"
            >
              {loading ? 'ВХОД...' : lockInfo?.is_locked ? 'ВХОД ЗАБЛОКИРОВАН' : 'ВОЙТИ'}
            </button>
          </form>
          
          {lockInfo?.is_locked && (
            <div className="lock-box">
              <p className="lock-title">⚠️ ДОСТУП ВРЕМЕННО ЗАБЛОКИРОВАН</p>
              <p className="lock-text">
                Для безопасности вашего аккаунта вход временно заблокирован после нескольких неудачных попыток.
              </p>
              <p className="lock-text">ВЫ МОЖЕТЕ:</p>
              <ul className="lock-list">
                <li>ПОДОЖДАТЬ {countdown > 0 ? formatTime(countdown) : 'НЕСКОЛЬКО МИНУТ'}</li>
                <li>
                  <Link href="/forgot-password" className="forgot-link">
                    ВОССТАНОВИТЬ ПАРОЛЬ
                  </Link>
                </li>
              </ul>
            </div>
          )}
          
          <div className="auth-footer">
            <Link href="/" className="auth-footer-link">
              ВЕРНУТЬСЯ НА ГЛАВНУЮ
            </Link>
          </div>

          {/* Дополнительный текст с ссылкой на покупку билета */}
          <div className="auth-additional">
            <p className="auth-additional-text">
              НЕТ АККАУНТА?
              <Link href="/buy-ticket" className="auth-additional-link">
                КУПИТЬ БИЛЕТ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}