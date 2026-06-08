'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import './forgot-password.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setResetLink(null);
    setLoading(true);
    try {
      const res = await apiClient.post<{ message?: string; reset_link?: string }>('/forgot-password', { email });
      setSuccess(true);
      if (res && 'reset_link' in res && res.reset_link) setResetLink(res.reset_link);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const msg = data?.message || (data?.errors?.email ? data.errors.email[0] : 'Ошибка запроса');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader text="ОТПРАВКА..." />;
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h1 className="forgot-password-title">ВОССТАНОВЛЕНИЕ ПАРОЛЯ</h1>
            <p className="forgot-password-subtitle">
              ВВЕДИТЕ EMAIL ВАШЕГО АККАУНТА — МЫ ОТПРАВИМ ССЫЛКУ ДЛЯ СБРОСА ПАРОЛЯ
            </p>
          </div>

          {success ? (
            <div className="forgot-password-success">
              <div className="forgot-password-success-icon">✓</div>
              <p className="forgot-password-success-text">
                НА ВАШУ ПОЧТУ ОТПРАВЛЕНА ССЫЛКА ДЛЯ СБРОСА ПАРОЛЯ.<br />
                ПРОВЕРЬТЕ ПОЧТУ (И ПАПКУ «СПАМ»).
              </p>
              {resetLink && (
                <div className="forgot-password-dev-link">
                  <p className="forgot-password-dev-text">ДЛЯ РАЗРАБОТКИ:</p>
                  <a href={resetLink} className="forgot-password-link">
                    ПЕРЕЙТИ К СБРОСУ ПАРОЛЯ
                  </a>
                </div>
              )}
              <Link href="/signin" className="forgot-password-back-btn">
                ВЕРНУТЬСЯ КО ВХОДУ
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="forgot-password-form">
              <div className="forgot-password-field">
                <label className="forgot-password-label">EMAIL *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  placeholder="YOUR@EMAIL.COM"
                  className="forgot-password-input"
                />
              </div>

              {error && (
                <div className="forgot-password-error">
                  <span className="forgot-password-error-icon">⚠️</span>
                  <p className="forgot-password-error-text">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="forgot-password-submit-btn"
              >
                {loading ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ ССЫЛКУ'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}