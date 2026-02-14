'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type Stats = {
  users_count?: number;
  tickets_sold?: number;
  orders_count?: number;
  merch_items_sold?: number;
};

const BAR_COLORS = ['#00f5ff', '#39ff14', '#ff00ff', '#f59e0b'];
const PIE_COLORS = ['#00f5ff', '#39ff14', '#ff00ff', '#f59e0b'];

export default function StatisticsPage() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !hasRole('admin')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiClient.get<Stats>('/admin/statistics')
      .then((data) => setStats(data ?? null))
      .catch((e) => { setStats(null); setError(e?.message || 'Не удалось загрузить статистику'); })
      .finally(() => setLoading(false));
  }, [user, hasRole]);

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

  const barData = stats
    ? [
        { name: 'Пользователи', value: stats.users_count ?? 0, fill: BAR_COLORS[0] },
        { name: 'Билеты продано', value: stats.tickets_sold ?? 0, fill: BAR_COLORS[1] },
        { name: 'Заказов мерча', value: stats.orders_count ?? 0, fill: BAR_COLORS[2] },
        { name: 'Ед. мерча продано', value: stats.merch_items_sold ?? 0, fill: BAR_COLORS[3] },
      ]
    : [];

  const pieData = stats
    ? [
        { name: 'Пользователи', value: stats.users_count ?? 0 },
        { name: 'Билеты', value: stats.tickets_sold ?? 0 },
        { name: 'Заказы', value: stats.orders_count ?? 0 },
        { name: 'Ед. мерча', value: stats.merch_items_sold ?? 0 },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Статистика</h1>
          <Link href="/" className="text-cyan-400 hover:underline">На главную</Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-slate-500">Загрузка...</div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Карточки с цифрами */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-600">
                <p className="text-slate-400 text-sm">Пользователей</p>
                <p className="text-2xl font-bold text-[#00f5ff]">{stats.users_count ?? 0}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-600">
                <p className="text-slate-400 text-sm">Проданные билеты</p>
                <p className="text-2xl font-bold text-[#39ff14]">{stats.tickets_sold ?? 0}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-600">
                <p className="text-slate-400 text-sm">Заказов мерча</p>
                <p className="text-2xl font-bold text-[#ff00ff]">{stats.orders_count ?? 0}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-600">
                <p className="text-slate-400 text-sm">Единиц мерча</p>
                <p className="text-2xl font-bold text-amber-400">{stats.merch_items_sold ?? 0}</p>
              </div>
            </div>

            {/* Столбчатая диаграмма */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-600">
              <h2 className="text-lg font-semibold text-white mb-4">Сводка показателей</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Bar dataKey="value" name="Значение" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Круговая диаграмма (если есть ненулевые значения) */}
            {pieData.length > 0 && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-600">
                <h2 className="text-lg font-semibold text-white mb-4">Соотношение показателей</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#64748b' }}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                        }}
                        formatter={(value: number) => [value, '']}
                      />
                      <Legend
                        wrapperStyle={{ color: '#94a3b8' }}
                        formatter={(value) => <span className="text-slate-300">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : !error ? (
          <div className="text-slate-500">Нет данных</div>
        ) : null}
      </div>
    </div>
  );
}
