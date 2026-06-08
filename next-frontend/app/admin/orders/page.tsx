'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import './orders.css';

type Order = {
  id: number;
  order_number: string;
  user_id: number;
  merch_id: number;
  user?: {
    id: number;
    name: string;
    login: string;
    email: string;
  };
  merch?: {
    id: number;
    name: string;
    main_image: string;
  };
  quantity: number;
  total_amount: number;
  shipping_address: string;
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  processing: 'В обработке',
  confirmed: 'Подтверждён',
  shipped: 'Отправлен',
  cancelled: 'Отменён',
};

const STATUS_CLASSES: Record<string, string> = {
  processing: 'status-processing',
  confirmed: 'status-confirmed',
  shipped: 'status-shipped',
  cancelled: 'status-cancelled',
};

export default function AdminOrdersPage() {
  const { user, hasRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);
  
  // Фильтры и поиск
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user && hasRole('admin')) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user, hasRole]);

  const loadOrders = async () => {
    try {
      const data = await apiClient.get<{ orders: Order[] }>('/admin/orders');
      setOrders(data.orders || []);
      setFilteredOrders(data.orders || []);
    } catch (err: any) {
      console.error('Ошибка загрузки заказов:', err);
      setError(err?.message || 'Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  // Применение фильтров
  useEffect(() => {
    let result = [...orders];
    
    // Поиск по номеру заказа, email пользователя или названию товара
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.order_number.toLowerCase().includes(query) ||
        order.user?.email?.toLowerCase().includes(query) ||
        order.user?.name?.toLowerCase().includes(query) ||
        order.merch?.name?.toLowerCase().includes(query)
      );
    }
    
    // Фильтр по статусу
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Сортировка
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.total_amount - a.total_amount : a.total_amount - b.total_amount;
      }
    });
    
    setFilteredOrders(result);
    setCurrentPage(1); // Сброс на первую страницу при изменении фильтров
  }, [orders, searchQuery, statusFilter, sortBy, sortOrder]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
    try {
      await apiClient.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      await loadOrders();
    } catch (err: any) {
      setError(err?.message || 'Ошибка обновления статуса');
    } finally {
      setUpdating(null);
    }
  };

  // Сброс фильтров
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Пагинация
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Статистика по отфильтрованным заказам
  const stats = useMemo(() => {
    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalItems = filteredOrders.reduce((sum, order) => sum + order.quantity, 0);
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { totalAmount, totalItems, statusCounts, count: filteredOrders.length };
  }, [filteredOrders]);

  if (!user || !hasRole('admin')) {
    return (
      <div className="access-denied">
        <p className="access-denied-text">Доступ запрещён. Только для администраторов.</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-container">
        <div className="admin-orders-header">
          <div className="admin-orders-title-section">
            <h1 className="admin-orders-title">Управление заказами</h1>
            <p className="admin-orders-description">Просмотр и управление заказами мерча</p>
          </div>
        </div>

        {error && (
          <div className="message-error">
            {error}
          </div>
        )}

        {/* Фильтры */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Поиск</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="№ заказа / Email / Товар"
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Статус</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Все статусы</option>
                <option value="processing">В обработке</option>
                <option value="confirmed">Подтверждён</option>
                <option value="shipped">Отправлен</option>
                <option value="cancelled">Отменён</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Сортировка</label>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('_');
                  setSortBy(newSortBy as 'date' | 'amount');
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                className="filter-select"
              >
                <option value="date_desc">Новые сначала</option>
                <option value="date_asc">Старые сначала</option>
                <option value="amount_desc">По сумме (↓)</option>
                <option value="amount_asc">По сумме (↑)</option>
              </select>
            </div>
            <button onClick={resetFilters} className="filter-reset">
              Сбросить
            </button>
            <div className="filter-stats">
              <span>Найдено: {stats.count}</span>
              <span>Общая сумма: {stats.totalAmount.toLocaleString()} ₽</span>
            </div>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            Заказов не найдено
          </div>
        ) : (
          <>
            <div className="orders-stats">
              <span className="orders-stats-count">ВСЕГО ЗАКАЗОВ: {stats.count}</span>
              <span className="orders-stats-page">
                СТРАНИЦА {currentPage} ИЗ {totalPages} (ПОКАЗАНО: {currentOrders.length})
              </span>
            </div>

            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>№ заказа</th>
                    <th>Пользователь</th>
                    <th>Товар</th>
                    <th>Кол-во</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-number">{order.order_number}</td>
                      <td>
                        <div className="user-info">
                          <span className="user-name">{order.user?.name || `User ${order.user_id}`}</span>
                          {order.user?.email && (
                            <span className="user-email">{order.user.email}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="merch-info">
                          {order.merch?.main_image && (
                            <img src={order.merch.main_image} alt="" className="merch-image" />
                          )}
                          <span className="merch-name">{order.merch?.name || `Товар #${order.merch_id}`}</span>
                        </div>
                      </td>
                      <td>{order.quantity}</td>
                      <td className="order-amount">{order.total_amount.toLocaleString()} ₽</td>
                      <td>
                        <span className={`status-badge ${STATUS_CLASSES[order.status] || ''}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="order-date">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          disabled={updating === order.id}
                          className="status-select"
                        >
                          <option value="processing">В обработке</option>
                          <option value="confirmed">Подтверждён</option>
                          <option value="shipped">Отправлен</option>
                          <option value="cancelled">Отменён</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="orders-pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← НАЗАД
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Показываем не все страницы, а ограниченный диапазон
                    if (totalPages <= 7) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      );
                    }
                    
                    // Показываем страницы с ...
                    if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      );
                    }
                    
                    if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={page} className="pagination-dots">...</span>;
                    }
                    
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  ВПЕРЁД →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}