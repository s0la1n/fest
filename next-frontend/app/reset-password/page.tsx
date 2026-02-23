'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

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

  if (!isValid) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#12121a] rounded-xl border border-[#1a1a24] p-8 text-center">
          <h1 className="text-xl font-bold text-white mb-2">Неверная ссылка</h1>
          <p className="text-slate-400 text-sm mb-6">
            Ссылка для сброса пароля неполная или устарела. Запросите новую на странице восстановления пароля.
          </p>
          <Link href="/forgot-password" className="text-[#00f5ff] hover:text-[#00c4cc] font-medium">
            Восстановить пароль
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#12121a] rounded-xl border border-[#00f5ff]/30 p-8 text-center">
          <h1 className="text-xl font-bold text-white mb-2">Пароль изменён</h1>
          <p className="text-slate-400 text-sm mb-6">Войдите в аккаунт с новым паролем.</p>
          <Link
            href="/signin"
            className="inline-block py-3 px-6 border-2 border-[#00f5ff] text-[#00f5ff] rounded-md font-medium hover:bg-[#00f5ff]/10 transition"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-[#12121a] rounded-xl border border-[#00f5ff]/30 p-8" style={{ boxShadow: '0 0 30px rgba(0,245,255,0.15)' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Новый пароль</h1>
          <p className="mt-2 text-slate-400 text-sm">Введите новый пароль для {email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Новый пароль *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
              minLength={6}
              placeholder="Не менее 6 символов"
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00f5ff] focus:border-[#00f5ff] transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Повторите пароль *</label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => { setPasswordConfirmation(e.target.value); setError(''); }}
              required
              minLength={6}
              placeholder="Повторите новый пароль"
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00f5ff] focus:border-[#00f5ff] transition"
            />
          </div>
          {error && (
            <div className="p-4 bg-[#ff006e]/10 border border-[#ff006e]/30 rounded-md text-sm text-[#ff006e]">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border-2 border-[#00f5ff] text-[#00f5ff] bg-transparent rounded-md text-sm font-medium hover:bg-[#00f5ff]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f5ff] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/signin" className="text-sm font-medium text-[#00f5ff] hover:text-[#00c4cc]">
            ← Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}
