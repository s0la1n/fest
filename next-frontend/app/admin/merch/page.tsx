'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import './merch.css';

type MerchItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  sold_quantity: number;
  main_image: string | null;
  main_image_url?: string | null;
  created_at: string;
};

export default function AdminMerchPage() {
  const { user, hasRole } = useAuth();
  const [merch, setMerch] = useState<MerchItem[]>([]);
  const [filteredMerch, setFilteredMerch] = useState<MerchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MerchItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Фильтры и поиск
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'revenue'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && hasRole('admin')) {
      loadMerch();
    } else {
      setLoading(false);
    }
  }, [user, hasRole]);

  const loadMerch = async () => {
    try {
      const data = await apiClient.get<MerchItem[]>('/admin/merch');
      setMerch(data || []);
    } catch (err: any) {
      console.error('Ошибка загрузки:', err);
      setError(err?.message || 'Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  // Применение фильтров
  useEffect(() => {
    let result = [...merch];
    
    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }
    
    // Сортировка
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        return sortOrder === 'desc' ? b.price - a.price : a.price - b.price;
      } else if (sortBy === 'stock') {
        return sortOrder === 'desc' ? b.stock_quantity - a.stock_quantity : a.stock_quantity - b.stock_quantity;
      } else { // revenue (выручка = цена * продано)
        const revenueA = a.price * a.sold_quantity;
        const revenueB = b.price * b.sold_quantity;
        return sortOrder === 'desc' ? revenueB - revenueA : revenueA - revenueB;
      }
    });
    
    setFilteredMerch(result);
    setCurrentPage(1);
  }, [merch, searchQuery, sortBy, sortOrder]);

  // Пагинация
  const totalPages = Math.ceil(filteredMerch.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMerch = filteredMerch.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот товар? Это действие нельзя отменить.')) return;
    
    try {
      await apiClient.delete(`/admin/merch/${id}`);
      setSuccess('Товар удален');
      loadMerch();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleEdit = (item: MerchItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      stock_quantity: item.stock_quantity,
    });
    setImagePreview(item.main_image_url || null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setForm({
      name: '',
      description: '',
      price: '',
      stock_quantity: 0,
    });
    setImagePreview(null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('stock_quantity', form.stock_quantity.toString());
      if (imageFile) formData.append('image', imageFile);

      if (editingItem) {
        formData.append('_method', 'PUT');
        await apiClient.post(`/admin/merch/${editingItem.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Товар обновлен');
      } else {
        await apiClient.post('/admin/merch', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Товар добавлен');
      }
      setShowModal(false);
      loadMerch();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  };

  // Сброс фильтров
  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  // Статистика
  const stats = {
    count: filteredMerch.length,
    totalStock: filteredMerch.reduce((sum, item) => sum + item.stock_quantity, 0),
    totalSold: filteredMerch.reduce((sum, item) => sum + item.sold_quantity, 0),
    totalRevenue: filteredMerch.reduce((sum, item) => sum + (item.price * item.sold_quantity), 0),
  };

  if (!user || !hasRole('admin')) {
    return (
      <div className="access-denied">
        <p className="access-denied-text">Доступ запрещён. Только для администраторов.</p>
      </div>
    );
  }

  return (
    <div className="admin-merch-page">
      <div className="admin-merch-container">
        <div className="admin-merch-header">
          <div className="admin-merch-title-section">
            <h1 className="admin-merch-title">Управление товарами</h1>
            <p className="admin-merch-description">Добавление, редактирование и удаление товаров в магазине</p>
          </div>
          <button onClick={handleAdd} className="btn-primary">
            + Добавить товар
          </button>
        </div>

        {error && <div className="message-error">{error}</div>}
        {success && <div className="message-success">{success}</div>}

        {/* Фильтры */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Поиск</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Название товара..."
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Сортировка</label>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('_');
                  setSortBy(newSortBy as 'name' | 'price' | 'stock' | 'revenue');
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                className="filter-select"
              >
                <option value="name_asc">По названию (А-Я)</option>
                <option value="name_desc">По названию (Я-А)</option>
                <option value="price_asc">По цене (↑)</option>
                <option value="price_desc">По цене (↓)</option>
                <option value="stock_asc">По остатку (↑)</option>
                <option value="stock_desc">По остатку (↓)</option>
                <option value="revenue_asc">По выручке (↑)</option>
                <option value="revenue_desc">По выручке (↓)</option>
              </select>
            </div>
            <button onClick={resetFilters} className="filter-reset">
              Сбросить
            </button>
            <div className="filter-stats">
              <span>Товаров: {stats.count}</span>
              <span>В наличии: {stats.totalStock} шт.</span>
              <span>Продано: {stats.totalSold} шт.</span>
              <span>Выручка: {stats.totalRevenue.toLocaleString()} ₽</span>
            </div>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : filteredMerch.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Товаров не найдено.</p>
            <button onClick={handleAdd} className="empty-state-link">
              Добавить первый товар
            </button>
          </div>
        ) : (
          <>
            <div className="merch-stats">
              <span className="merch-stats-count">ВСЕГО ТОВАРОВ: {stats.count}</span>
              <span className="merch-stats-page">
                СТРАНИЦА {currentPage} ИЗ {totalPages} (ПОКАЗАНО: {currentMerch.length})
              </span>
            </div>

            <div className="merch-table-wrapper">
              <table className="merch-table">
                <thead>
                  <tr>
                    <th className="th-photo">Фото</th>
                    <th>Название</th>
                    <th>Описание</th>
                    <th>Цена</th>
                    <th>В наличии</th>
                    <th>Продано</th>
                    <th>Выручка</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMerch.map((item) => {
                    const revenue = item.price * item.sold_quantity;
                    return (
                      <tr key={item.id}>
                        <td className="table-photo-cell">
                          {item.main_image_url ? (
                            <img src={item.main_image_url} alt={item.name} className="table-photo" />
                          ) : (
                            <div className="table-photo-placeholder">🛍️</div>
                          )}
                        </td>
                        <td>
                          <div className="merch-name">
                            <span className="merch-name-text">{item.name}</span>
                            <span className="merch-slug">{item.slug}</span>
                          </div>
                        </td>
                        <td>
                          <div className="merch-description" title={item.description || ''}>
                            {item.description || '—'}
                          </div>
                        </td>
                        <td className="price-cell">{item.price.toLocaleString()} ₽</td>
                        <td className={`stock-cell ${item.stock_quantity <= 0 ? 'stock-out' : item.stock_quantity <= 5 ? 'stock-low' : ''}`}>
                          {item.stock_quantity} шт.
                        </td>
                        <td className="sold-cell">{item.sold_quantity} шт.</td>
                        <td className="revenue-cell">{revenue.toLocaleString()} ₽</td>
                        <td className="actions-cell">
                          <div className="actions-group">
                            <button onClick={() => handleEdit(item)} className="btn-edit-sm">
                              ✎
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="btn-delete-sm">
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="merch-pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← НАЗАД
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
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

      {/* Модальное окно */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h2 className="modal-title">
              {editingItem ? 'Редактировать товар' : 'Добавить товар'}
            </h2>
            <form onSubmit={handleSubmit} className="form" encType="multipart/form-data">
              <div className="form-field">
                <label className="form-label">Название *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="form-input"
                  placeholder="Название товара"
                />
              </div>
              
              <div className="form-field">
                <label className="form-label">Описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-textarea"
                  rows={3}
                  placeholder="Описание товара..."
                />
              </div>
              
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Цена (в монетах) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    min="0"
                    step="10"
                    className="form-input"
                    placeholder="100"
                  />
                </div>
                
                <div className="form-field">
                  <label className="form-label">Количество на складе *</label>
                  <input
                    type="number"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                    className="form-input"
                    placeholder="100"
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label className="form-label">Изображение</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="form-input"
                  ref={fileInputRef}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" className="preview-image" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="remove-photo-btn"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              
              <div className="form-actions">
                <button type="submit" disabled={submitting} className="btn-save">
                  {submitting ? 'Сохранение...' : (editingItem ? 'Сохранить' : 'Добавить')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}