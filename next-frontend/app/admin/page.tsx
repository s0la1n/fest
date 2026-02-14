'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders } from '@/lib/api';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function AdminPage() {
  const { user, hasRole } = useAuth();
  const [tab, setTab] = useState<'schedule' | 'merch' | 'users'>('schedule');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [merch, setMerch] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const headers = getAuthHeaders();

  useEffect(() => {
    if (user && hasRole('admin') && tab === 'schedule') {
      fetch(`${API_URL}/admin/schedules`, { credentials: 'include', headers }).then((r) => r.json()).then(setSchedules).catch(() => setSchedules([]));
    }
  }, [user, hasRole, tab]);

  useEffect(() => {
    if (user && hasRole('admin') && tab === 'merch') {
      fetch(`${API_URL}/admin/merch`, { credentials: 'include', headers }).then((r) => r.json()).then(setMerch).catch(() => setMerch([]));
    }
  }, [user, hasRole, tab]);

  useEffect(() => {
    if (user && hasRole('admin') && tab === 'users') {
      fetch(`${API_URL}/admin/users`, { credentials: 'include', headers }).then((r) => r.json()).then(setUsers).catch(() => setUsers([]));
    }
  }, [user, hasRole, tab]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Войдите в систему</p>
      </div>
    );
  }

  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-red-400">Доступ запрещён</p>
      </div>
    );
  }

  const tabs = [
    { id: 'schedule' as const, label: 'Расписание' },
    { id: 'merch' as const, label: 'Товары магазина' },
    { id: 'users' as const, label: 'Пользователи' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Админ-панель</h1>
          <Link href="/admin/statistics" className="text-cyan-400 hover:underline">Статистика</Link>
        </div>

        <div className="flex gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg ${tab === t.id ? 'bg-cyan-600' : 'bg-slate-800'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'schedule' && (
          <div className="space-y-4">
            {schedules.map((s) => (
              <div key={s.id} className="bg-slate-800 rounded-lg p-4 border border-slate-600 flex justify-between">
                <div>
                  <p className="font-medium text-white">{s.short_name}</p>
                  <p className="text-slate-400 text-sm">{s.description}</p>
                  <p className="text-cyan-400 text-sm">День {s.day}, {s.start_time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'merch' && (
          <div className="space-y-4">
            {merch.map((m) => (
              <div key={m.id} className="bg-slate-800 rounded-lg p-4 border border-slate-600 flex justify-between">
                <div>
                  <p className="font-medium text-white">{m.name}</p>
                  <p className="text-slate-400 text-sm">{m.price}₽, в наличии: {m.stock_quantity}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                <p className="font-medium text-white">{u.login} — {u.email}</p>
                <p className="text-slate-400 text-sm">Роль: {u.role}, билетов: {u.tickets_count ?? 0}, заказов: {u.orders_count ?? 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
