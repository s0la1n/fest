'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  registration_bonus: 'Бонус за регистрацию',
  bet_placement: 'Ставка',
  bet_win: 'Выигрыш ставки',
  merch_purchase: 'Покупка в магазине',
  admin_grant: 'Начислено',
  admin_deduct: 'Списание',
};

function parseHistory(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'history' in data && Array.isArray((data as { history: unknown[] }).history)) {
    return (data as { history: unknown[] }).history;
  }
  return [];
}

export function BalanceDropdown() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    apiClient.get<{ history?: unknown[] }>('/balance/history').then((res) => setHistory(parseHistory(res ?? {}))).catch(() => setHistory([])).finally(() => setLoading(false));
  }, [open, user]);

  if (!user) return null;

  const balance = user.balance ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/30 hover:bg-[#00f5ff]/20 transition"
      >
        <span className="font-semibold">{balance}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-[#12121a] border border-[#00f5ff]/30 rounded-xl shadow-xl z-50" style={{ boxShadow: '0 0 20px rgba(0,245,255,0.15)' }}>
          <div className="p-3 border-b border-[#1a1a24]">
            <p className="font-bold text-[#00f5ff]">Баланс: {balance}</p>
            <p className="text-xs text-slate-400">История операций</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#00f5ff] border-t-transparent mx-auto"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Нет операций</div>
            ) : (
              <ul className="divide-y divide-[#1a1a24]">
                {(history as { id: number; type: string; amount: number; created_at: string }[]).slice(0, 15).map((item) => (
                  <li key={item.id} className="px-3 py-2 flex justify-between items-center text-sm">
                    <div>
                      <p className="text-slate-200">{TYPE_LABELS[item.type] ?? item.type}</p>
                      <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString('ru-RU')}</p>
                    </div>
                    <span className={`font-medium ${item.amount >= 0 ? 'text-[#39ff14]' : 'text-[#ff006e]'}`}>
                      {item.amount >= 0 ? '+' : ''}{item.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
