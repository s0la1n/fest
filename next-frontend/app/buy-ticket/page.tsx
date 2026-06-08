'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import './buy-ticket.css';

type FormData = {
  name: string;
  email: string;
  phone: string;
  ticket_type: string;
  agreement: boolean;
};

export default function BuyTicket() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    ticket_type: 'standard',
    agreement: false  // По умолчанию false
  });
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };

  const isValidEmail = (email: string): boolean => {
    const trimmed = email.trim();
    if (!trimmed) return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    return emailRegex.test(trimmed) && trimmed.length <= 254;
  };

  const isValidPhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) return /^[78]\d{10}$/.test(digits);
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess(false);

    const validationErrors: Record<string, string[]> = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      validationErrors.name = ['Укажите своё имя'];
    } else if (trimmedName.length < 2) {
      validationErrors.name = ['Имя должно быть не короче 2 символов'];
    } else if (!/^[\p{L}\p{M}\s\-']+$/u.test(trimmedName)) {
      validationErrors.name = ['Имя может содержать только буквы, пробелы и дефис'];
    }

    if (!formData.email.trim()) {
      validationErrors.email = ['Укажите email'];
    } else if (!isValidEmail(formData.email)) {
      validationErrors.email = ['Введите корректный email (например: name@example.com)'];
    }

    if (!formData.phone.trim()) {
      validationErrors.phone = ['Укажите номер телефона'];
    } else if (!isValidPhone(formData.phone)) {
      validationErrors.phone = ['Введите корректный номер: +7 (XXX) XXX-XX-XX или 8 XXX XXX-XX-XX'];
    }

    // Валидация согласия
    if (!formData.agreement) {
      validationErrors.agreement = ['Необходимо принять условия пользовательского соглашения'];
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const responseData = await apiClient.post<{
        success?: boolean;
        confirmation_url?: string;
        ticket_id?: number;
        errors?: Record<string, string[]>;
        message?: string;
      }>('/buy-ticket', formData);

      if (responseData.success && responseData.confirmation_url) {
        window.location.href = responseData.confirmation_url;
        return;
      }
      if (responseData.success) {
        setSuccess(true);
        setTimeout(() => router.push('/signin'), 3000);
      } else {
        if (responseData.errors) {
          setErrors(responseData.errors);
        } else {
          setErrors({ general: [responseData.message || 'Ошибка при покупке билета'] });
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string; errors?: Record<string, string[]> };
      const errs = err?.errors && typeof err.errors === 'object' && Object.keys(err.errors).length > 0 ? err.errors : null;
      setErrors(errs ?? { general: [err?.message || 'Ошибка при покупке билета'] });
    } finally {
      setLoading(false);
    }
  };

  const ticketTypes = [
    { value: 'standard', label: 'СТАНДАРТНЫЙ', price: '1000 ₽' },
    { value: 'vip', label: 'VIP', price: '2500 ₽' },
    { value: 'premium', label: 'ПРЕМИУМ', price: '5000 ₽' },
  ];

  if (success) {
    return (
      <div className="ticket-page">
        <div className="ticket-container">
          <div className="ticket-card">
            <div className="text-center">
              <div className="success-icon">
                <svg viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="success-title">БИЛЕТ КУПЛЕН!</h2>
              <p className="success-message">
                Данные для входа (логин и пароль) отправлены на вашу почту{' '}
                <strong style={{ color: '#54FEDD' }}>{formData.email}</strong>
              </p>
              <p className="credentials-note">
                ПРОВЕРЬТЕ ПОЧТУ И ВОЙДИТЕ В СИСТЕМУ
              </p>
              <Link href="/signin" className="ticket-btn" style={{ display: 'inline-block', width: 'auto', padding: '12px 32px' }}>
                ВОЙТИ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-page">
      <div className="ticket-container">
        <div className="ticket-card">
          <div className="ticket-header">
            <h1 className="ticket-title">КУПИТЬ БИЛЕТ</h1>
            <p className="ticket-subtitle">ЗАПОЛНИТЕ ФОРМУ ДЛЯ ПОКУПКИ</p>
          </div>

          <form onSubmit={handleSubmit} className="ticket-form">
            {errors.general && (
              <div className="error-alert">
                <p className="error-text">{Array.isArray(errors.general) ? errors.general.join(', ') : errors.general}</p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                ИМЯ <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="ВАШЕ ИМЯ"
                required
                minLength={2}
                maxLength={255}
                autoComplete="name"
              />
              {errors.name && <p className="form-error">{errors.name[0]}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">
                EMAIL <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="EXAMPLE@MAIL.RU"
                required
                maxLength={255}
                autoComplete="email"
              />
              {errors.email && <p className="form-error">{errors.email[0]}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">
                ТЕЛЕФОН <span className="required">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="+7 (999) 123-45-67"
                required
                maxLength={20}
                autoComplete="tel"
              />
              {errors.phone && <p className="form-error">{errors.phone[0]}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">
                ТИП БИЛЕТА <span className="required">*</span>
              </label>
              <select
                name="ticket_type"
                value={formData.ticket_type}
                onChange={handleChange}
                className="form-select"
              >
                {ticketTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} — {type.price}
                  </option>
                ))}
              </select>
              {errors.ticket_type && <p className="form-error">{errors.ticket_type[0]}</p>}
            </div>

            <div className="form-group agreement-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreement"
                  checked={formData.agreement}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-text">
                  Я принимаю условия{' '}
                  <Link href="/agreement" className="agreement-link">
                    пользовательского соглашения
                  </Link>
                  {' '}и даю согласие на обработку персональных данных
                </span>
              </label>
              {errors.agreement && <p className="form-error">{errors.agreement[0]}</p>}
            </div>

            <button type="submit" disabled={loading} className="ticket-btn">
              {loading ? 'ОБРАБОТКА...' : 'КУПИТЬ БИЛЕТ'}
            </button>
          </form>

          <div className="ticket-footer">
            <p className="ticket-footer-text">
              УЖЕ ЕСТЬ АККАУНТ?{' '}
              <Link href="/signin" className="ticket-link">
                ВОЙТИ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}