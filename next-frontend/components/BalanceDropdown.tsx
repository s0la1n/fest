'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';

const TYPE_LABELS: Record<string, string> = {
  registration_bonus: 'БОНУС ЗА РЕГИСТРАЦИЮ',
  bet_placement: 'СТАВКА',
  bet_win: 'ВЫИГРЫШ СТАВКИ',
  merch_purchase: 'ПОКУПКА В МАГАЗИНЕ',
  admin_grant: 'НАЧИСЛЕНИЕ',
  admin_deduct: 'СПИСАНИЕ',
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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    apiClient.get<{ history?: unknown[] }>('/balance/history')
      .then((res) => setHistory(parseHistory(res ?? {})))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [open, user]);

  if (!user) return null;

  const balance = user.balance ?? 0;

  return (
    <div className="balance-wrapper" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`balance-dropdown ${open ? 'open' : ''}`}
      >
        <span className="balance-amount">{balance.toLocaleString()}</span>
        <span className="balance-arrow">▼</span>
      </button>
      
      <div className={`balance-menu ${open ? 'open' : ''}`}>
        <div className="balance-menu-header">
          <p>{balance.toLocaleString()}</p>
          <span>БАЛАНС</span>
        </div>
        
        <div className="balance-history">
          {loading ? (
            <PageLoader className="balance-loading" text="ЗАГРУЗКА..." />
          ) : history.length === 0 ? (
            <div className="balance-empty">НЕТ ОПЕРАЦИЙ</div>
          ) : (
            (history as { id: number; type: string; amount: number; created_at: string }[]).slice(0, 10).map((item) => (
              <div key={item.id} className="balance-history-item">
                <div className="balance-history-type">{TYPE_LABELS[item.type] ?? item.type}</div>
                <div className="balance-history-date">{new Date(item.created_at).toLocaleString('ru-RU')}</div>
                <div className={`balance-history-amount ${item.amount >= 0 ? 'positive' : 'negative'}`}>
                  {item.amount >= 0 ? '+' : ''}{item.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}