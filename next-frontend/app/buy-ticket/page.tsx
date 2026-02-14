'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

type FormData = {
  name: string;
  email: string;
  phone: string;
  ticket_type: string;
};

export default function BuyTicket() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    ticket_type: 'standard'
  });
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };

  // Валидация email
  const isValidEmail = (email: string): boolean => {
    const trimmed = email.trim();
    if (!trimmed) return false;
    // RFC-5322-упрощённый: локальная часть + @ + домен с точкой
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    return emailRegex.test(trimmed) && trimmed.length <= 254;
  };

  // Валидация российского номера телефона (+7/8 и 10 цифр)
  const isValidRussianPhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    // 11 цифр: 7/8 + 10 цифр номера
    if (digits.length === 11) return /^[78]\d{10}$/.test(digits);
    // 10 цифр: без кода страны (9XX, 8XX, 3XX и т.д.)
    if (digits.length === 10) return /^[3589]\d{9}$/.test(digits);
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess(false);

    // Валидация на клиенте
    const validationErrors: Record<string, string[]> = {};

    if (!formData.name.trim()) {
      validationErrors.name = ['Укажите своё имя'];
    }

    if (!formData.email.trim()) {
      validationErrors.email = ['Email обязателен'];
    } else if (!isValidEmail(formData.email)) {
      validationErrors.email = ['Введите корректный email (например: name@example.com)'];
    }

    if (!formData.phone.trim()) {
      validationErrors.phone = ['Номер телефона обязателен'];
    } else if (!isValidRussianPhone(formData.phone)) {
      validationErrors.phone = ['Введите корректный номер: +7 (XXX) XXX-XX-XX или 8 XXX XXX-XX-XX'];
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
    { value: 'standard', label: 'Стандартный', price: '1000 ₽' },
    { value: 'vip', label: 'VIP', price: '2500 ₽' },
    { value: 'premium', label: 'Премиум', price: '5000 ₽' },
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-[#12121a] backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-[#00f5ff]/30" style={{ boxShadow: '0 0 40px rgba(0,245,255,0.15)' }}>
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Билет успешно куплен!</h2>
            <p className="text-slate-300 mb-4">
              Данные для входа (логин и пароль) отправлены на вашу почту <strong className="text-[#00f5ff]">{formData.email}</strong>
            </p>
            <p className="text-slate-400 text-sm mb-6">
              Проверьте почту и войдите в систему используя полученные данные.
            </p>
            <Link
              href="/signin"
              className="inline-block bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] px-6 py-3 rounded-lg font-medium transition" style={{ boxShadow: '0 0 15px rgba(0,245,255,0.4)' }}
            >
              Перейти к входу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="bg-[#12121a] backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-[#00f5ff]/30" style={{ boxShadow: '0 0 40px rgba(0,245,255,0.15)' }}>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Купить билет</h1>
          <p className="text-slate-400">Заполните форму для покупки билета на фестиваль</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="bg-[#ff006e]/10 border border-[#ff006e]/50 text-[#ff006e] px-4 py-3 rounded-lg text-sm">
              {Array.isArray(errors.general) ? errors.general.join(', ') : errors.general}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Имя <span className="text-[#ff006e]">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00f5ff] focus:border-[#00f5ff] transition"
              placeholder="Ваше имя"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-[#ff006e]">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email <span className="text-[#ff006e]">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00f5ff] focus:border-[#00f5ff] transition"
              placeholder="your@email.com"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-[#ff006e]">{Array.isArray(errors.email) ? errors.email[0] : errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
              Номер телефона <span className="text-[#ff006e]">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00f5ff] focus:border-[#00f5ff] transition"
              placeholder="+7 (999) 123-45-67"
              required
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-[#ff006e]">{Array.isArray(errors.phone) ? errors.phone[0] : errors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="ticket_type" className="block text-sm font-medium text-slate-300 mb-2">
              Тип билета <span className="text-[#ff006e]">*</span>
            </label>
            <select
              id="ticket_type"
              name="ticket_type"
              value={formData.ticket_type}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            >
              {ticketTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.price}
                </option>
              ))}
            </select>
            {errors.ticket_type && (
              <p className="mt-1 text-sm text-[#ff006e]">{Array.isArray(errors.ticket_type) ? errors.ticket_type[0] : errors.ticket_type}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00f5ff] hover:bg-[#00c4cc] disabled:bg-[#12121a] disabled:cursor-not-allowed text-[#0a0a0f] font-medium py-3 px-4 rounded-lg transition" style={{ boxShadow: '0 0 20px rgba(0,245,255,0.3)' }}
          >
            {loading ? 'Обработка...' : 'Купить билет'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Уже есть аккаунт?{' '}
            <Link href="/signin" className="text-[#00f5ff] hover:text-[#00c4cc] font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
