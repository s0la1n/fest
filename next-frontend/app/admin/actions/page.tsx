'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function AdminActionsPage() {
  const { user, hasRole } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && hasRole('admin')) {
      apiClient.get<any>('/admin/organizer-actions').then((d: any) => setLogs(d.actions ?? d ?? [])).catch(() => setLogs([])).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, hasRole]);

  if (!user || !hasRole('admin')) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4">
        <p className="text-slate-400">Доступ только для администратора.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Действия организаторов</h1>
        <p className="text-slate-400 mb-8">Просмотр действий организаторов турнира и косплея</p>
        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
        ) : logs.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
            <p className="text-slate-500">Записей о действиях пока нет.</p>
            <p className="text-slate-600 text-sm mt-2">Логирование действий организаторов подключается через API.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {logs.map((log: any, i: number) => (
              <li key={i} className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-sm">
                <span className="text-slate-400">{log.created_at ?? ''}</span>
                <span className="text-white ml-2">{log.action ?? log.message ?? JSON.stringify(log)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8">
          <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 font-medium">← В админ-панель</Link>
        </div>
      </div>
    </div>
  );
}
