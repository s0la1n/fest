'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function BalancePage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/balance`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance ?? 0);
      } else {
        setBalance(user?.balance ?? 0);
      }
    } catch {
      setBalance(user?.balance ?? 0);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <p className="text-slate-400">Войдите, чтобы просмотреть баланс</p>
          <Link href="/signin" className="mt-4 inline-block text-[#00f5ff] hover:underline">Войти</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-[#12121a] rounded-2xl border border-[#00f5ff]/30 p-8 text-center" style={{ boxShadow: '0 0 30px rgba(0,245,255,0.15)' }}>
          <h1 className="text-2xl font-bold text-white mb-2">Ваш баланс</h1>
          {loading ? (
            <div className="h-16 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00f5ff] border-t-transparent"></div>
            </div>
          ) : (
            <p className="text-5xl font-bold text-amber-400 mb-6">💰 {balance}</p>
          )}
          <p className="text-slate-400 text-sm mb-8">Виртуальная валюта фестиваля</p>
          <Link
            href="/balance/history"
            className="inline-block w-full py-3 px-4 bg-[#00f5ff] text-[#0a0a0f] rounded-lg font-medium hover:bg-[#00c4cc] transition" style={{ boxShadow: '0 0 15px rgba(0,245,255,0.3)' }}
          >
            История операций
          </Link>
        </div>
      </div>
    </div>
  );
}
