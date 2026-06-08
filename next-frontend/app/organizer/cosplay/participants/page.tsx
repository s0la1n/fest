'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import './participants.css';

type Cosplayer = {
  id: number;
  name: string;
  last_name: string;
  character_name: string;
  origin: string;
  photo_url: string | null;
  portfolio_link: string | null;
  votes_count: number;
  created_at: string;
};

type SortField = 'name' | 'votes' | 'date';

export default function OrganizerCosplayParticipantsPage() {
  const { user, isOrganizer, isAdmin } = useAuth();
  const [cosplayers, setCosplayers] = useState<Cosplayer[]>([]);
  const [filteredCosplayers, setFilteredCosplayers] = useState<Cosplayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCosplayer, setSelectedCosplayer] = useState<Cosplayer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Поиск и фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'votes' | 'date'>('votes');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [form, setForm] = useState({
    name: '',
    last_name: '',
    character_name: '',
    origin: '',
    portfolio_link: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && (isOrganizer() || isAdmin())) {
      loadCosplayers();
    } else {
      setLoading(false);
    }
  }, [user, isOrganizer, isAdmin]);

  const loadCosplayers = async () => {
    try {
      const data = await apiClient.get<{ cosplayers: Cosplayer[] }>('/organizer/cosplay/participants');
      setCosplayers(data.cosplayers || []);
      setFilteredCosplayers(data.cosplayers || []);
      setError('');
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось загрузить участников');
    } finally {
      setLoading(false);
    }
  };

  // Применение фильтров и сортировки (как на странице товаров)
  useEffect(() => {
    let result = [...cosplayers];
    
    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.last_name.toLowerCase().includes(query) ||
        c.character_name.toLowerCase().includes(query) ||
        c.origin.toLowerCase().includes(query)
      );
    }
    
    // Сортировка
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.name} ${a.last_name}`;
        const nameB = `${b.name} ${b.last_name}`;
        return sortOrder === 'desc' ? nameB.localeCompare(nameA, 'ru') : nameA.localeCompare(nameB, 'ru');
      } else (sortBy === 'votes') 
        return sortOrder === 'desc' ? b.votes_count - a.votes_count : a.votes_count - b.votes_count;
    });
    
    setFilteredCosplayers(result);
    setCurrentPage(1);
  }, [cosplayers, searchQuery, sortBy, sortOrder]);

  // Сброс фильтров
  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('votes');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Пагинация
  const totalPages = Math.ceil(filteredCosplayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCosplayers = filteredCosplayers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этого участника?')) return;
    
    setError('');
    setSuccess('');
    
    try {
      await apiClient.delete(`/organizer/cosplay/participants/${id}`);
      setSuccess('Участник удален');
      loadCosplayers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка удаления');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (cosplayer: Cosplayer) => {
    setSelectedCosplayer(cosplayer);
    setForm({
      name: cosplayer.name,
      last_name: cosplayer.last_name,
      character_name: cosplayer.character_name,
      origin: cosplayer.origin,
      portfolio_link: cosplayer.portfolio_link || '',
    });
    setPhotoPreview(cosplayer.photo_url);
    setPhotoFile(null);
    setIsEditing(true);
    setShowModal(true);
    setError('');
  };

  const handleAdd = () => {
    setSelectedCosplayer(null);
    setForm({
      name: '',
      last_name: '',
      character_name: '',
      origin: '',
      portfolio_link: '',
    });
    setPhotoPreview(null);
    setPhotoFile(null);
    setIsEditing(false);
    setShowModal(true);
    setError('');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Файл слишком большой. Максимальный размер 5MB');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
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
      formData.append('name', form.name.trim());
      formData.append('last_name', form.last_name.trim());
      formData.append('character_name', form.character_name.trim());
      formData.append('origin', form.origin.trim());
      
      // portfolio_link - если пусто, отправляем пустую строку
      const portfolioLink = form.portfolio_link?.trim() || '';
      formData.append('portfolio_link', portfolioLink);
      
      // Для добавления фото обязательно
      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (!isEditing && !photoFile) {
        setError('Фото обязательно для добавления');
        setSubmitting(false);
        return;
      }

      if (isEditing && selectedCosplayer) {
        formData.append('_method', 'PUT');
        await apiClient.post(`/organizer/cosplay/participants/${selectedCosplayer.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Участник обновлен');
      } else {
        await apiClient.post('/organizer/cosplay/participants', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Участник добавлен');
      }
      
      setShowModal(false);
      loadCosplayers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Ошибка сохранения:', err);
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error || 'Ошибка сохранения';
      setError(errorMsg);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Экспорт в CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Имя', 'Фамилия', 'Персонаж', 'Вселенная', 'Голосов', 'Портфолио', 'Дата регистрации'];
    const rows = filteredCosplayers.map(c => [
      c.id,
      c.name,
      c.last_name,
      c.character_name,
      c.origin,
      c.votes_count,
      c.portfolio_link || '',
      new Date(c.created_at).toLocaleDateString('ru-RU')
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `cosplayers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!user || (!isOrganizer() && !isAdmin())) {
    return (
      <div className="access-denied">
        <p className="access-denied-text">Доступ только для организатора.</p>
      </div>
    );
  }

  return (
    <div className="organizer-cosplay-page">
      <div className="organizer-cosplay-container">
        <div className="organizer-cosplay-header">
          <div className="organizer-cosplay-title-section">
            <h1 className="organizer-cosplay-title">Участники конкурса косплея</h1>
            <p className="organizer-cosplay-description">Управление участниками и просмотр голосов</p>
          </div>
          <div className="header-actions">
            <button onClick={exportToCSV} className="btn-secondary">
              Экспорт CSV
            </button>
            <button onClick={handleAdd} className="btn-primary">
              + Добавить участника
            </button>
          </div>
        </div>

        {error && <div className="message-error">{error}</div>}
        {success && <div className="message-success">{success}</div>}

        {/* Фильтры и сортировка (как на странице товаров) */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Поиск</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Имя, персонаж или вселенная..."
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Сортировка</label>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('_');
                  setSortBy(newSortBy as 'name' | 'votes' | 'date');
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                className="filter-select"
              >
                <option value="votes_desc">По голосам (↓)</option>
                <option value="votes_asc">По голосам (↑)</option>
                <option value="name_asc">По имени (А-Я)</option>
                <option value="name_desc">По имени (Я-А)</option>
              </select>
            </div>
            <button onClick={resetFilters} className="filter-reset">
              Сбросить
            </button>
            <div className="filter-stats">
              <span>Участников: {filteredCosplayers.length}</span>
              <span>Голосов: {filteredCosplayers.reduce((sum, c) => sum + c.votes_count, 0)}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : filteredCosplayers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Участников не найдено.</p>
            <button onClick={handleAdd} className="empty-state-link">
              Добавить первого участника
            </button>
          </div>
        ) : (
          <>
            <div className="cosplayers-stats">
              <span className="cosplayers-stats-count">ВСЕГО УЧАСТНИКОВ: {filteredCosplayers.length}</span>
              <span className="cosplayers-stats-page">
                СТРАНИЦА {currentPage} ИЗ {totalPages} (ПОКАЗАНО: {currentCosplayers.length})
              </span>
            </div>

            <div className="participants-table-wrapper">
              <table className="participants-table">
                <thead>
                  <tr>
                    <th>Участник</th>
                    <th>Персонаж</th>
                    <th>Вселенная</th>
                    <th>Голосов</th>
                    <th>Портфолио</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCosplayers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="participant-name-cell">
                          <span className="participant-name">{c.name}</span>
                          <span className="participant-lastname">{c.last_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="participant-character">{c.character_name}</span>
                      </td>
                      <td>
                        <span className="participant-origin">{c.origin}</span>
                      </td>
                      <td className="text-center">
                        <span className="votes-count-badge">{c.votes_count}</span>
                      </td>
                      <td>
                        {c.portfolio_link ? (
                          <a 
                            href={c.portfolio_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="portfolio-link"
                            title={c.portfolio_link}
                          >
                            Открыть
                          </a>
                        ) : (
                          <span className="portfolio-empty">—</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => handleEdit(c)} className="btn-edit-sm" title="Редактировать">
                            ✎
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="btn-delete-sm" title="Удалить">
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="cosplayers-pagination">
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {isEditing ? 'Редактировать участника' : 'Добавить участника'}
            </h2>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Имя *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Введите имя"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Фамилия *</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Введите фамилию"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Персонаж *</label>
                  <input
                    type="text"
                    value={form.character_name}
                    onChange={(e) => setForm({ ...form, character_name: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Введите имя персонажа"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Вселенная *</label>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Откуда персонаж"
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Фото {!isEditing && '*'}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="form-input"
                  ref={fileInputRef}
                  required={!isEditing}
                />
                <p className="form-hint">Максимальный размер: 5MB. Поддерживаются JPG, PNG, GIF</p>
                {photoPreview && (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Preview" className="preview-image" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="remove-photo-btn"
                      title="Удалить фото"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div className="form-field">
                <label className="form-label">Портфолио (ссылка)</label>
                <input
                  type="url"
                  value={form.portfolio_link}
                  onChange={(e) => setForm({ ...form, portfolio_link: e.target.value })}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={submitting} className="btn-save">
                  {submitting ? 'Сохранение...' : (isEditing ? 'Сохранить' : '➕ Добавить')}
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