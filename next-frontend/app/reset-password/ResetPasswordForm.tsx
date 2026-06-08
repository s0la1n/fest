'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import './reset-password.css';

function sanitizeToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 128);
}

function sanitizeEmail(value: string): string {
  return value.replace(/[^\w.@+-]/g, '').slice(0, 254);
}

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = sanitizeToken(searchParams.get('token') ?? '');
  const email = sanitizeEmail(searchParams.get('email') ?? '');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = Boolean(token && email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/reset-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const msg = data?.message || (data?.errors?.token ? data.errors.token[0] : 'Ошибка сброса пароля');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader text="СОХРАНЕНИЕ..." />;
  }

  if (!isValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card reset-password-card--error">
            <div className="reset-password-error-icon">⚠️</div>
            <h1 className="reset-password-title">НЕВЕРНАЯ ССЫЛКА</h1>
            <p className="reset-password-text">
              ССЫЛКА ДЛЯ СБРОСА ПАРОЛЯ НЕПОЛНАЯ ИЛИ УСТАРЕЛА.<br />
              ЗАПРОСИТЕ НОВУЮ НА СТРАНИЦЕ ВОССТАНОВЛЕНИЯ ПАРОЛЯ.
            </p>
            <Link href="/forgot-password" className="reset-password-link">
              ВОССТАНОВИТЬ ПАРОЛЬ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card reset-password-card--success">
            <div className="reset-password-success-icon">✓</div>
            <h1 className="reset-password-title">ПАРОЛЬ ИЗМЕНЁН</h1>
            <p className="reset-password-text">
              ВОЙДИТЕ В АККАУНТ С НОВЫМ ПАРОЛЕМ.
            </p>
            <Link href="/signin" className="reset-password-success-btn">
              ВОЙТИ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <h1 className="reset-password-title">НОВЫЙ ПАРОЛЬ</h1>
            <p className="reset-password-subtitle">
              ВВЕДИТЕ НОВЫЙ ПАРОЛЬ ДЛЯ {email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="reset-password-field">
              <label className="reset-password-label">НОВЫЙ ПАРОЛЬ *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                minLength={6}
                placeholder="НЕ МЕНЕЕ 6 СИМВОЛОВ"
                className="reset-password-input"
              />
            </div>

            <div className="reset-password-field">
              <label className="reset-password-label">ПОВТОРИТЕ ПАРОЛЬ *</label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => { setPasswordConfirmation(e.target.value); setError(''); }}
                required
                minLength={6}
                placeholder="ПОВТОРИТЕ НОВЫЙ ПАРОЛЬ"
                className="reset-password-input"
              />
            </div>

            {error && (
              <div className="reset-password-error">
                <span className="reset-password-error-icon">⚠️</span>
                <p className="reset-password-error-text">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="reset-password-submit-btn"
            >
              {loading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ПАРОЛЬ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}