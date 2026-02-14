'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const TYPE_LABELS: Record<string, string> = {
  registration_bonus: 'Бонус за регистрацию',
  bet_placement: 'Ставка',
  bet_win: 'Выигрыш ставки',
  merch_purchase: 'Покупка в магазине',
  admin_grant: 'Начислено администратором',
  admin_deduct: 'Списание',
};

export default function BalanceHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/balance/history`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-slate-400">Войдите, чтобы просмотреть историю</p>
          <Link href="/auth/login" className="mt-4 inline-block text-cyan-400 hover:underline">Войти</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/balance" className="text-amber-400 hover:underline flex items-center gap-2">
            ← Назад к балансу
          </Link>
        </div>
        <div className="bg-slate-800 rounded-2xl border border-slate-600 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-600 bg-slate-800">
            <h1 className="text-xl font-bold text-white">История операций</h1>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-slate-500">История пуста</div>
          ) : (
            <ul className="divide-y divide-slate-700">
              {history.map((item) => (
                <li key={item.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{TYPE_LABELS[item.type] || item.type}</p>
                    <p className="text-sm text-slate-400">{new Date(item.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                  <span className={`font-bold ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.amount >= 0 ? '+' : ''}{item.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
