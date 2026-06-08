'use client';

import { useState, useEffect, useMemo, useRef, type ReactElement } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
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
  AreaChart,
  Area,
} from 'recharts';
import './statistics.css';

type Stats = {
  users_count?: number;
  tickets_sold?: number;
  orders_count?: number;
  merch_items_sold?: number;
  total_revenue?: number;
  active_users?: number;
  new_users_today?: number;
  new_users_week?: number;
  new_users_month?: number;
  total_bets?: number;
  total_bets_amount?: number;
  total_won_bets?: number;
  total_lost_bets?: number;
  win_rate?: number;
  total_cosplayers?: number;
  total_cosplay_votes?: number;
  total_teams?: number;
  total_matches?: number;
  finished_matches?: number;
  total_cards?: number;
  cards_used?: number;
  daily_stats?: Array<{
    date: string;
    users: number;
    tickets: number;
    orders: number;
    revenue: number;
  }>;
  top_users?: Array<{
    id: number;
    name: string;
    balance: number;
    tickets_count: number;
    bets_count: number;
  }>;
  popular_merch?: Array<{
    name: string;
    sold: number;
    revenue: number;
  }>;
};

const BAR_COLORS = ['#00f5ff', '#39ff14', '#ff00ff', '#f59e0b', '#ec4899', '#8b5cf6'];
const PIE_COLORS = ['#00f5ff', '#39ff14', '#ff00ff', '#f59e0b', '#ec4899', '#8b5cf6'];

function ChartResponsive({
  className = '',
  children,
}: {
  className?: string;
  children: ReactElement;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize((prev) => (prev.width !== width || prev.height !== height ? { width, height } : prev));
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`chart-wrapper ${className}`.trim()}>
      {size.width > 0 && size.height > 0 ? (
        <ResponsiveContainer width={size.width} height={size.height}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

export default function StatisticsPage() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [exportLoading, setExportLoading] = useState(false);

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

  // Фильтрация данных для графика
  const filteredDailyStats = useMemo(() => {
    if (!stats?.daily_stats || stats.daily_stats.length === 0) return [];
    
    const daysToShow = timeRange === 'week' ? 7 : 30;
    
    const sorted = [...stats.daily_stats].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return sorted.slice(-daysToShow);
  }, [stats?.daily_stats, timeRange]);

  // Экспорт в CSV
  const exportToCSV = () => {
    if (!stats) return;
    
    setExportLoading(true);
    
    const csvData = [];
    
    csvData.push(['Показатель', 'Значение']);
    csvData.push(['Дата генерации', new Date().toLocaleString('ru-RU')]);
    csvData.push([]);
    
    csvData.push(['ОСНОВНАЯ СТАТИСТИКА', '']);
    csvData.push(['Всего пользователей', stats.users_count ?? 0]);
    csvData.push(['Новых сегодня', stats.new_users_today ?? 0]);
    csvData.push(['Новых за неделю', stats.new_users_week ?? 0]);
    csvData.push(['Активных (30 дней)', stats.active_users ?? 0]);
    csvData.push(['Продано билетов', stats.tickets_sold ?? 0]);
    csvData.push(['Общая выручка', `${stats.total_revenue?.toLocaleString() ?? 0} ₽`]);
    csvData.push(['Заказов мерча', stats.orders_count ?? 0]);
    csvData.push(['Продано единиц мерча', stats.merch_items_sold ?? 0]);
    csvData.push([]);
    
    csvData.push(['СТАВКИ', '']);
    csvData.push(['Всего ставок', stats.total_bets ?? 0]);
    csvData.push(['Сумма ставок', `${stats.total_bets_amount?.toLocaleString() ?? 0} монет`]);
    csvData.push(['Выиграно ставок', stats.total_won_bets ?? 0]);
    csvData.push(['Проиграно ставок', stats.total_lost_bets ?? 0]);
    csvData.push(['Процент выигрыша', `${stats.win_rate ?? 0}%`]);
    csvData.push([]);
    
    csvData.push(['КОСПЛЕЙ И ТУРНИРЫ', '']);
    csvData.push(['Всего косплееров', stats.total_cosplayers ?? 0]);
    csvData.push(['Голосов за косплей', stats.total_cosplay_votes ?? 0]);
    csvData.push(['Всего команд', stats.total_teams ?? 0]);
    csvData.push(['Всего матчей', stats.total_matches ?? 0]);
    csvData.push(['Завершено матчей', stats.finished_matches ?? 0]);
    csvData.push([]);
    
    csvData.push(['КАРТОЧКИ', '']);
    csvData.push(['Всего карточек', stats.total_cards ?? 0]);
    csvData.push(['Активировано карточек', stats.cards_used ?? 0]);
    csvData.push(['Осталось карточек', (stats.total_cards ?? 0) - (stats.cards_used ?? 0)]);
    csvData.push([]);
    
    if (stats.top_users && stats.top_users.length > 0) {
      csvData.push(['ТОП ПОЛЬЗОВАТЕЛЕЙ ПО БАЛАНСУ', '', '', '']);
      csvData.push(['Место', 'ID', 'Имя', 'Баланс', 'Билетов', 'Ставок']);
      stats.top_users.forEach((user, index) => {
        csvData.push([index + 1, user.id, user.name, user.balance, user.tickets_count, user.bets_count]);
      });
      csvData.push([]);
    }
    
    if (stats.popular_merch && stats.popular_merch.length > 0) {
      csvData.push(['ПОПУЛЯРНЫЕ ТОВАРЫ', '', '']);
      csvData.push(['Название', 'Продано', 'Выручка']);
      stats.popular_merch.forEach((item) => {
        csvData.push([item.name, item.sold, `${item.revenue.toLocaleString()} ₽`]);
      });
      csvData.push([]);
    }
    
    if (stats.daily_stats && stats.daily_stats.length > 0) {
      csvData.push(['ЕЖЕДНЕВНАЯ СТАТИСТИКА', '', '', '', '']);
      csvData.push(['Дата', 'Новые пользователи', 'Продано билетов', 'Заказов', 'Выручка']);
      stats.daily_stats.forEach((day) => {
        csvData.push([day.date, day.users, day.tickets, day.orders, `${day.revenue.toLocaleString()} ₽`]);
      });
    }
    
    const csvString = csvData.map(row => row.join(';')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `statistics_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setExportLoading(false);
  };

  // Экспорт в JSON
  const exportToJSON = () => {
    if (!stats) return;
    
    setExportLoading(true);
    
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        users_count: stats.users_count,
        tickets_sold: stats.tickets_sold,
        total_revenue: stats.total_revenue,
        orders_count: stats.orders_count,
        merch_items_sold: stats.merch_items_sold,
        total_bets: stats.total_bets,
        win_rate: stats.win_rate,
        total_cosplayers: stats.total_cosplayers,
        total_teams: stats.total_teams,
        total_matches: stats.total_matches,
        total_cards: stats.total_cards,
        cards_used: stats.cards_used,
      },
      details: {
        new_users: {
          today: stats.new_users_today,
          week: stats.new_users_week,
          month: stats.new_users_month,
        },
        bets: {
          total: stats.total_bets,
          total_amount: stats.total_bets_amount,
          won: stats.total_won_bets,
          lost: stats.total_lost_bets,
          win_rate: stats.win_rate,
        },
        cosplay: {
          total_cosplayers: stats.total_cosplayers,
          total_votes: stats.total_cosplay_votes,
        },
        tournaments: {
          total_teams: stats.total_teams,
          total_matches: stats.total_matches,
          finished_matches: stats.finished_matches,
        },
        cards: {
          total: stats.total_cards,
          used: stats.cards_used,
          available: (stats.total_cards ?? 0) - (stats.cards_used ?? 0),
        },
      },
      top_users: stats.top_users,
      popular_merch: stats.popular_merch,
      daily_stats: stats.daily_stats,
    };
    
    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `statistics_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setExportLoading(false);
  };

  if (!user) {
    return (
      <div className="statistics-page min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Войдите в систему</p>
      </div>
    );
  }

  if (!hasRole('admin')) {
    return (
      <div className="statistics-page min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-red-400">Доступ запрещён</p>
      </div>
    );
  }

  const barData = stats
    ? [
        { name: 'Пользователи', value: stats.users_count ?? 0, fill: BAR_COLORS[0] },
        { name: 'Билеты', value: stats.tickets_sold ?? 0, fill: BAR_COLORS[1] },
        { name: 'Заказы', value: stats.orders_count ?? 0, fill: BAR_COLORS[2] },
        { name: 'Ед. мерча', value: stats.merch_items_sold ?? 0, fill: BAR_COLORS[3] },
        { name: 'Команды', value: stats.total_teams ?? 0, fill: BAR_COLORS[4] },
        { name: 'Косплееры', value: stats.total_cosplayers ?? 0, fill: BAR_COLORS[5] },
      ]
    : [];

  const betsData = stats
    ? [
        { name: 'Всего ставок', value: stats.total_bets ?? 0 },
        { name: 'Выиграно', value: stats.total_won_bets ?? 0 },
        { name: 'Проиграно', value: stats.total_lost_bets ?? 0 },
      ].filter((d) => d.value > 0)
    : [];

  if (loading) {
    return <PageLoader />;
  }

  if (!stats) {
    return (
      <div className="statistics-page">
        <div className="statistics-container">
          <div className="text-center py-12 text-slate-500">
            {error || 'Нет данных для отображения'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="statistics-container">
        <div className="statistics-header">
          <div>
            <h1 className="statistics-title">Статистика фестиваля</h1>
            <p className="statistics-description">Общая аналитика и показатели</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={exportLoading}
              className="btn-pink"
            >
              {exportLoading ? 'Экспорт...' : 'CSV'}
            </button>
            <button
              onClick={exportToJSON}
              disabled={exportLoading}
              className="btn-blue"
            >
              {exportLoading ? 'Экспорт...' : 'JSON'}
            </button>
          </div>
        </div>

        {/* Основные карточки */}
        <div className="statistics-grid">
          <div className="stat-card">
            <p className="stat-label">Пользователей</p>
            <p className="stat-value cyan">{stats.users_count ?? 0}</p>
            <p className="stat-sub">+{stats.new_users_today ?? 0} сегодня</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Активных</p>
            <p className="stat-value green">{stats.active_users ?? 0}</p>
            <p className="stat-sub">за 30 дней</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Билетов продано</p>
            <p className="stat-value magenta">{stats.tickets_sold ?? 0}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Выручка</p>
            <p className="stat-value amber">{stats.total_revenue?.toLocaleString() ?? 0} ₽</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Ставок</p>
            <p className="stat-value cyan">{stats.total_bets ?? 0}</p>
            <p className="stat-sub">Win Rate: {stats.win_rate ?? 0}%</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Карточек</p>
            <p className="stat-value magenta">{stats.cards_used ?? 0} / {stats.total_cards ?? 0}</p>
            <p className="stat-sub">использовано</p>
          </div>
        </div>

        {/* График трендов */}
        {filteredDailyStats.length > 0 && (
          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Динамика показателей</h2>
              <div className="chart-buttons">
                <button
                  onClick={() => setTimeRange('week')}
                  className={`chart-btn ${timeRange === 'week' ? 'active' : ''}`}
                >
                  Неделя
                </button>
                <button
                  onClick={() => setTimeRange('month')}
                  className={`chart-btn ${timeRange === 'month' ? 'active' : ''}`}
                >
                  Месяц
                </button>
              </div>
            </div>
            <ChartResponsive className="chart-wrapper--trend">
                <AreaChart data={filteredDailyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00f5ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="users"
                    name="Новые пользователи"
                    stroke="#00f5ff"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Выручка (₽)"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
            </ChartResponsive>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Столбчатая диаграмма */}
          <div className="stat-section">
            <h2 className="stat-section-title">Общие показатели</h2>
            <ChartResponsive className="chart-wrapper--section">
                  <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
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
                    />
                    <Bar dataKey="value" name="Значение" radius={[4, 4, 0, 0]}>
                      {barData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
            </ChartResponsive>
          </div>

          {/* Круговая диаграмма ставок */}
          {betsData.length > 0 && (
            <div className="stat-section">
              <h2 className="stat-section-title">Статистика ставок</h2>
              <ChartResponsive className="chart-wrapper--section">
                    <PieChart>
                      <Pie
                        data={betsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => {
                          const percentValue = percent ?? 0;
                          return `${name} ${(percentValue * 100).toFixed(0)}%`;
                        }}
                        labelLine={{ stroke: '#64748b' }}
                      >
                        {betsData.map((_, index) => (
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
                      />
                      <Legend
                        wrapperStyle={{ color: '#94a3b8' }}
                        formatter={(value) => <span className="text-slate-300">{value}</span>}
                      />
                    </PieChart>
              </ChartResponsive>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-600">
                <div className="text-center">
                  <p className="stat-label text-xs">Всего ставок</p>
                  <p className="text-white font-bold">{stats.total_bets ?? 0}</p>
                </div>
                <div className="text-center">
                  <p className="stat-label text-xs">Сумма ставок</p>
                  <p className="text-amber-400 font-bold">{stats.total_bets_amount?.toLocaleString() ?? 0} монет</p>
                </div>
                <div className="text-center">
                  <p className="stat-label text-xs">Выиграно</p>
                  <p className="text-[#39ff14] font-bold">{stats.total_won_bets ?? 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Топ пользователей */}
          {stats.top_users && stats.top_users.length > 0 && (
            <div className="stat-section">
              <h2 className="stat-section-title">Топ пользователей по балансу</h2>
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Место</th>
                    <th>Имя</th>
                    <th>Баланс</th>
                    <th>Билетов</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_users.map((user, index) => (
                    <tr key={user.id}>
                      <td className={`stat-rank ${index === 0 ? 'stat-rank-1' : index === 1 ? 'stat-rank-2' : index === 2 ? 'stat-rank-3' : ''}`}>
                        {index + 1}
                      </td>
                      <td>{user.name || 'User ' + user.id}</td>
                      <td className="stat-value cyan text-lg">{user.balance.toLocaleString()} монет</td>
                      <td>{user.tickets_count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Популярный мерч */}
          {stats.popular_merch && stats.popular_merch.length > 0 && (
            <div className="stat-section">
              <h2 className="stat-section-title">Популярные товары</h2>
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Продано</th>
                    <th>Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.popular_merch.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{item.sold} шт.</td>
                      <td className="stat-value amber text-lg">{item.revenue.toLocaleString()} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Дополнительная статистика */}
        <div className="stat-footer-grid">
          <div className="stat-footer-card">
            <p className="stat-footer-label">Новые пользователи</p>
            <p className="stat-footer-value">{stats.new_users_week ?? 0}</p>
            <p className="stat-sub">за неделю</p>
          </div>
          <div className="stat-footer-card">
            <p className="stat-footer-label">Завершено матчей</p>
            <p className="stat-footer-value">{stats.finished_matches ?? 0} / {stats.total_matches ?? 0}</p>
            <p className="stat-sub">всего матчей</p>
          </div>
          <div className="stat-footer-card">
            <p className="stat-footer-label">Голосов за косплей</p>
            <p className="stat-footer-value">{stats.total_cosplay_votes ?? 0}</p>
            <p className="stat-sub">всего голосов</p>
          </div>
          <div className="stat-footer-card">
            <p className="stat-footer-label">Средний чек</p>
            <p className="stat-footer-value">
              {stats.total_revenue && stats.tickets_sold 
                ? Math.round(stats.total_revenue / (stats.tickets_sold || 1)).toLocaleString() 
                : 0} ₽
            </p>
            <p className="stat-sub">на билет</p>
          </div>
        </div>
      </div>
    </div>
  );
}