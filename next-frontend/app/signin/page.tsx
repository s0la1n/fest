'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.login, formData.password);
      // Успех — контекст сам сделает router.push('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка входа';
      const hint = message.includes('Неверный логин') || message.includes('credentials')
        ? ' В поле «Логин» можно ввести email. Если вы купили билет — используйте логин и пароль из письма или со страницы после оплаты.'
        : '';
      setError(message + hint);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-[#12121a] rounded-xl border border-[#00f5ff]/30 p-8" style={{ boxShadow: '0 0 30px rgba(0,245,255,0.15)' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Вход в аккаунт</h1>
          <p className="mt-2 text-slate-400">Введите логин и пароль</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Логин *
            </label>
            <input
              type="text"
              name="login"
              value={formData.login}
              onChange={handleChange}
              required
              placeholder="Ваш логин"
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00f5ff] focus:border-[#00f5ff] transition"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-300">
                Пароль *
              </label>
              <Link href="/forgot-password" className="text-sm text-[#00f5ff] hover:text-[#00c4cc]">
                Забыли пароль?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Ваш пароль"
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00f5ff] focus:border-[#00f5ff] transition"
            />
          </div>
          
          {error && (
            <div className="p-4 bg-[#ff006e]/10 border border-[#ff006e]/30 rounded-md">
              <div className="text-sm text-[#ff006e]">{error}</div>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border-2 border-[#00f5ff] text-[#00f5ff] bg-transparent rounded-md text-sm font-medium hover:bg-[#00f5ff]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f5ff] disabled:opacity-50 disabled:cursor-not-allowed transition"
            style={{ boxShadow: '0 0 15px rgba(0,245,255,0.2)' }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            <Link href="/" className="font-medium text-[#00f5ff] hover:text-[#00c4cc]">
              Вернуться на главную
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
