'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import './cards.css';

const RARITY_LABELS: Record<string, string> = {
  common: 'Обычная',
  rare: 'Редкая',
  epic: 'Эпическая',
  legendary: 'Легендарная',
  secret: 'Секретная',
};

const BONUS_LABELS: Record<string, string> = {
  virtual_currency: 'Виртуальная валюта',
  coupon: 'Промокод',
  discount: 'Скидка',
  physical_gift: 'Физический подарок',
  digital_gift: 'Цифровой подарок',
  experience: 'Впечатления',
};

type Card = {
  id: number;
  name: string;
  description: string | null;
  image: string;
  rarity: string;
  type_bonus: string;
  bonus_value: number | null;
  coupon_code: string | null;
  stock_quantity: number;
  used_quantity: number;
  qr_code_get: string | null;
  status: string;
  created_at: string;
};

export default function AdminCardsPage() {
  const { user, hasRole } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [newCard, setNewCard] = useState({
    name: '',
    description: '',
    rarity: 'common',
    type_bonus: 'discount',
    bonus_value: '',
    coupon_code: '',
    stock_quantity: 100,
  });

  useEffect(() => {
    if (user && hasRole('admin')) {
      loadCards();
    } else {
      setLoading(false);
    }
  }, [user, hasRole]);

  // Фильтрация карточек
  useEffect(() => {
    let filtered = [...cards];

    // Поиск по названию и описанию
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(query) ||
        (card.description && card.description.toLowerCase().includes(query)) ||
        (card.coupon_code && card.coupon_code.toLowerCase().includes(query)) ||
        (card.qr_code_get && card.qr_code_get.toLowerCase().includes(query))
      );
    }

    // Фильтр по редкости
    if (filterRarity !== 'all') {
      filtered = filtered.filter(card => card.rarity === filterRarity);
    }

    // Фильтр по типу бонуса
    if (filterType !== 'all') {
      filtered = filtered.filter(card => card.type_bonus === filterType);
    }

    setFilteredCards(filtered);
    setCurrentPage(1); // Сброс на первую страницу при изменении фильтров
  }, [cards, searchQuery, filterRarity, filterType]);

  // Пагинация
  const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCards = filteredCards.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ cards: Card[] }>('/admin/cards');
      setCards(data.cards || []);
    } catch (err: any) {
      console.error('Ошибка загрузки карточек:', err);
      setError(err?.message || 'Не удалось загрузить карточки');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('name', newCard.name);
    formData.append('description', newCard.description);
    formData.append('rarity', newCard.rarity);
    formData.append('type_bonus', newCard.type_bonus);
    formData.append('stock_quantity', newCard.stock_quantity.toString());
    formData.append('status', 'available');
    
    // Для виртуальной валюты добавляем bonus_value
    if (newCard.type_bonus === 'virtual_currency' && newCard.bonus_value) {
      formData.append('bonus_value', newCard.bonus_value);
    }
    
    // Для промокода и скидки не отправляем bonus_value и coupon_code на бэкенд,
    // они будут генерироваться автоматически при активации карточки пользователем
    if (newCard.type_bonus === 'coupon') {
      // coupon_code не отправляем - будет генерироваться при активации
    }
    
    if (newCard.type_bonus === 'discount' && newCard.bonus_value) {
      formData.append('bonus_value', newCard.bonus_value);
    }
    
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    try {
      const data = await apiClient.post<{ success: boolean; card: Card; message: string }>(
        '/admin/cards',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (data.success) {
        setSuccess(data.message || 'Карточка создана');
        setShowAddForm(false);
        setNewCard({
          name: '',
          description: '',
          rarity: 'common',
          type_bonus: 'discount',
          bonus_value: '',
          coupon_code: '',
          stock_quantity: 100,
        });
        setSelectedImage(null);
        setImagePreview(null);
        loadCards();
      } else {
        setError(data.message || 'Ошибка создания карточки');
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Ошибка создания карточки';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm('Удалить эту карточку? Это действие нельзя отменить.')) return;
    
    try {
      await apiClient.delete(`/admin/cards/${cardId}`);
      setSuccess('Карточка удалена');
      loadCards();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Ошибка удаления';
      setError(message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterRarity('all');
    setFilterType('all');
    setCurrentPage(1);
  };

  const getAvailableFilters = () => {
    const rarities = new Set(cards.map(c => c.rarity));
    const types = new Set(cards.map(c => c.type_bonus));
    
    return {
      rarities: Array.from(rarities),
      types: Array.from(types),
    };
  };

  const availableFilters = getAvailableFilters();

  // Получить подсказку для типа бонуса
  const getBonusHint = (type: string): string => {
    switch (type) {
      case 'virtual_currency':
        return 'Пользователь получит указанное количество монет';
      case 'coupon':
        return 'При активации сгенерируется уникальный промокод';
      case 'discount':
        return 'Пользователь получит скидку указанного процента';
      case 'physical_gift':
        return 'При активации нужно будет получить подарок на стойке информации';
      case 'digital_gift':
        return 'При активации откроется ссылка на цифровой подарок';
      case 'experience':
        return 'Впечатления (backstage, экскурсия и т.д.)';
      default:
        return '';
    }
  };

  if (!user || !hasRole('admin')) {
    return (
      <div className="access-denied">
        <p className="access-denied-text">Доступ запрещён. Только для администраторов.</p>
      </div>
    );
  }

  return (
    <div className="admin-cards-page">
      <div className="admin-cards-container">
        <div className="admin-cards-header">
          <div className="admin-cards-title-section">
            <h1 className="admin-cards-title">Управление карточками</h1>
            <p className="admin-cards-description">Создание и управление карточками маскотов</p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setError('');
              setSuccess('');
              setSelectedImage(null);
              setImagePreview(null);
            }}
            className="btn-primary"
          >
            + Новая карточка
          </button>
        </div>

        {error && (
          <div className="message-error">
            {error}
          </div>
        )}

        {success && (
          <div className="message-success">
            {success}
          </div>
        )}

        {/* Фильтры и поиск */}
        <div className="filter-section">
          <div className="filter-row">
            <div className="filter-search">
              <input
                type="text"
                placeholder="ПОИСК ПО НАЗВАНИЮ, ОПИСАНИЮ, КОДУ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="filter-clear-search">
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">РЕДКОСТЬ:</label>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="filter-select"
              >
                <option value="all">ВСЕ</option>
                {availableFilters.rarities.map(rarity => (
                  <option key={rarity} value={rarity}>
                    {RARITY_LABELS[rarity] || rarity}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">ТИП БОНУСА:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">ВСЕ</option>
                <option value="virtual_currency">Виртуальная валюта</option>
                <option value="coupon">Промокод</option>
                <option value="discount">Скидка</option>
                <option value="physical_gift">Физический подарок</option>
                <option value="digital_gift">Цифровой подарок</option>
                <option value="experience">Впечатления</option>
              </select>
            </div>

            {(searchQuery || filterRarity !== 'all' || filterType !== 'all') && (
              <button onClick={resetFilters} className="filter-reset-btn">
                СБРОСИТЬ
              </button>
            )}
          </div>

          <div className="filter-stats">
            <span className="filter-stats-count">
              ПОКАЗАНО: {filteredCards.length} / {cards.length} КАРТОЧЕК
            </span>
            {totalPages > 1 && (
              <span className="filter-stats-pages">
                СТРАНИЦА {currentPage} ИЗ {totalPages}
              </span>
            )}
          </div>
        </div>

        {showAddForm && (
          <div className="admin-cards-form">
            <h2 className="form-title">Создать новую карточку</h2>
            <form onSubmit={handleCreateCard} encType="multipart/form-data">
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Название *</label>
                  <input
                    type="text"
                    value={newCard.name}
                    onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Название карточки"
                  />
                </div>
                
                <div className="form-field">
                  <label className="form-label">Изображение *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    required
                    className="form-input"
                  />
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                  )}
                </div>
                
                <div className="form-field">
                  <label className="form-label">Редкость *</label>
                  <select
                    value={newCard.rarity}
                    onChange={(e) => setNewCard({ ...newCard, rarity: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="common">Обычная</option>
                    <option value="rare">Редкая</option>
                    <option value="epic">Эпическая</option>
                    <option value="legendary">Легендарная</option>
                    <option value="secret">Секретная</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label className="form-label">Тип бонуса *</label>
                  <select
                    value={newCard.type_bonus}
                    onChange={(e) => {
                      setNewCard({ 
                        ...newCard, 
                        type_bonus: e.target.value,
                        bonus_value: '',
                        coupon_code: '',
                      });
                    }}
                    className="form-select"
                    required
                  >
                    <option value="virtual_currency">Виртуальная валюта</option>
                    <option value="coupon">Промокод</option>
                    <option value="discount">Скидка</option>
                    <option value="physical_gift">Физический подарок</option>
                    <option value="digital_gift">Цифровой подарок</option>
                    <option value="experience">Впечатления</option>
                  </select>
                  <p className="form-hint">{getBonusHint(newCard.type_bonus)}</p>
                </div>
                
                {newCard.type_bonus === 'virtual_currency' && (
                  <div className="form-field">
                    <label className="form-label">Количество монет *</label>
                    <input
                      type="number"
                      value={newCard.bonus_value}
                      onChange={(e) => setNewCard({ ...newCard, bonus_value: e.target.value })}
                      required
                      min="10"
                      step="10"
                      className="form-input"
                      placeholder="100"
                    />
                  </div>
                )}
                
                {newCard.type_bonus === 'discount' && (
                  <div className="form-field">
                    <label className="form-label">Процент скидки *</label>
                    <input
                      type="number"
                      value={newCard.bonus_value}
                      onChange={(e) => setNewCard({ ...newCard, bonus_value: e.target.value })}
                      required
                      min="5"
                      max="90"
                      className="form-input"
                      placeholder="10"
                    />
                  </div>
                )}
                
                <div className="form-field">
                  <label className="form-label">Количество на складе *</label>
                  <input
                    type="number"
                    value={newCard.stock_quantity}
                    onChange={(e) => setNewCard({ ...newCard, stock_quantity: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                    className="form-input"
                    placeholder="100"
                  />
                </div>
                
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Описание</label>
                  <textarea
                    value={newCard.description}
                    onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                    rows={3}
                    className="form-textarea"
                    placeholder="Описание карточки..."
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ minWidth: '180px', height: '50px', fontSize: '16px' }}
                >
                  {submitting ? 'Создание...' : 'Создать карточку'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                  style={{ minWidth: '180px', height: '50px', fontSize: '16px' }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <PageLoader />
        ) : filteredCards.length === 0 ? (
          <div className="empty-state">
            {cards.length === 0 ? 'Нет созданных карточек' : 'Карточки не найдены по заданным фильтрам'}
          </div>
        ) : (
          <>
            <div className="cards-grid">
              {currentCards.map((card) => (
                <div key={card.id} className="card-item" data-rarity={card.rarity}>
                  <div className="card-image">
                    {card.image ? (
                      <img src={card.image} alt={card.name} className="card-img" />
                    ) : (
                      <div className="card-img-placeholder">🎴</div>
                    )}
                    <span className={`card-rarity-badge`} data-rarity={card.rarity}>
                      {RARITY_LABELS[card.rarity] ?? card.rarity}
                    </span>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{card.name}</h3>
                    {card.description && (
                      <p className="card-description">{card.description}</p>
                    )}
                    <div className="card-badges">
                      <span className="card-badge">
                        {BONUS_LABELS[card.type_bonus] ?? card.type_bonus}
                      </span>
                    </div>
                    <div className="card-stats">
                      <p>В наличии: {card.stock_quantity - card.used_quantity} / {card.stock_quantity}</p>
                      <p>Использовано: {card.used_quantity}</p>
                      {card.qr_code_get && (
                        <p>Код активации: {card.qr_code_get}</p>
                      )}
                      {card.bonus_value && card.type_bonus === 'virtual_currency' && (
                        <p>Бонус: +{card.bonus_value} монет</p>
                      )}
                      {card.bonus_value && card.type_bonus === 'discount' && (
                        <p>Скидка: {card.bonus_value}%</p>
                      )}
                      {card.type_bonus === 'coupon' && (
                        <p>При активации генерируется уникальный промокод</p>
                      )}
                      {card.type_bonus === 'physical_gift' && (
                        <p>Получить на стойке информации</p>
                      )}
                      {card.type_bonus === 'digital_gift' && (
                        <p>Цифровой подарок</p>
                      )}
                      {card.type_bonus === 'experience' && (
                        <p>Впечатления (backstage, экскурсия)</p>
                      )}
                    </div>
                    <div className="card-actions">
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="btn-danger"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="cards-pagination">
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
    </div>
  );
}