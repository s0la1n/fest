'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import PageLoader from '@/components/ui/PageLoader';
import './shop.css';

export default function ShopPage() {
  const { user, refreshUserData } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    quantity: 1,
    delivery_type: 'delivery' as 'delivery' | 'pickup',
    shipping_address: '',
    recipient_name: '',
    recipient_phone: '',
    additional_info: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    apiClient
      .get<any[]>('/shop')
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const purchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/shop/purchase', {
        merch_id: selected.id,
        quantity: form.quantity,
        delivery_type: form.delivery_type,
        shipping_address: form.delivery_type === 'pickup' ? '' : form.shipping_address,
        recipient_name: form.recipient_name || null,
        recipient_phone: form.recipient_phone || null,
        additional_info: form.additional_info || null,
      });
      setSelected(null);
      setForm({ quantity: 1, delivery_type: 'delivery', shipping_address: '', recipient_name: '', recipient_phone: '', additional_info: '' });
      refreshUserData?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
    } finally {
      setSubmitting(false);
    }
  };

  const priceCoins = (p: any) => Math.round(p?.price || 0);

  // Пагинация
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return (
      <div className="shop-page">
        <div className="shop-container">
          <div className="shop-unauth">
            <div className="shop-unauth-icon">⚠️</div>
            <h2 className="shop-unauth-title">ДОСТУП ЗАПРЕЩЁН</h2>
            <p className="shop-unauth-text">ВОЙДИТЕ В АККАУНТ, ЧТОБЫ СОВЕРШАТЬ ПОКУПКИ</p>
            <Link href="/signin" className="shop-unauth-link">ВОЙТИ</Link>
          </div>
        </div>
      </div>
    );
  }

  const balance = user.balance ?? 0;

  return (
    <div className="shop-page">
      <div className="shop-container">
        <div className="shop-header">
          <h1 className="shop-title">МАГАЗИН</h1>
          <p className="shop-description">ПОКУПАЙТЕ МЕРЧ ЗА ВИРТУАЛЬНУЮ ВАЛЮТУ</p>
        </div>

        <div className="shop-balance">
          <span className="shop-balance-label">ВАШ БАЛАНС:</span>
          <span className="shop-balance-value">{balance} МОНЕТ</span>
        </div>

        {loading ? (
          <PageLoader text="ЗАГРУЗКА ТОВАРОВ..." className="shop-loader" />
        ) : products.length === 0 ? (
          <div className="shop-empty">
            <p className="shop-empty-text">ТОВАРОВ ПОКА НЕТ</p>
            <p className="shop-empty-subtext">НОВЫЕ ПОСТУПЛЕНИЯ СКОРО</p>
          </div>
        ) : (
          <>
            <div className="shop-stats">
              <span className="shop-stats-count">ВСЕГО ТОВАРОВ: {products.length}</span>
              <span className="shop-stats-page">СТРАНИЦА {currentPage} ИЗ {totalPages}</span>
            </div>

            <div className="shop-grid">
              {currentProducts.map((p) => {
                const canBuy = p.stock_quantity >= 1 && balance >= priceCoins(p);
                return (
                  <div key={p.id} className="shop-card">
                    <div className="shop-card-image">
                      {p.main_image ? (
                        <img src={p.main_image} alt={p.name} />
                      ) : (
                        <span>🛍️</span>
                      )}
                    </div>
                    <div className="shop-card-info">
                      <h3 className="shop-card-name">{p.name}</h3>
                      <p className="shop-card-desc">{p.description || 'ОПИСАНИЕ ОТСУТСТВУЕТ'}</p>
                      <p className="shop-card-price">{priceCoins(p)} МОНЕТ</p>
                      <button
                        onClick={() => {
                          setSelected(p);
                          setForm((f) => ({ ...f, quantity: 1 }));
                        }}
                        disabled={!canBuy}
                        className="btn-pink"
                      >
                        <span>{!canBuy && balance < priceCoins(p) ? 'НЕ ХВАТАЕТ МОНЕТ' : 'КУПИТЬ'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="shop-pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← НАЗАД
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
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

        {selected && (
          <div className="shop-modal-overlay">
            <div className="shop-modal">
              <h3 className="shop-modal-title">КУПИТЬ: {selected.name}</h3>
              <p className="shop-modal-price">{priceCoins(selected)} МОНЕТ ЗА ШТ.</p>
              <form onSubmit={purchase} className="shop-form">
                {error && <div className="shop-error">{error}</div>}
                
                <div className="form-group">
                  <label className="form-label">КОЛИЧЕСТВО</label>
                  <input
                    type="number"
                    min={1}
                    max={selected.stock_quantity}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: parseInt(e.target.value, 10) || 1 }))}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">ПОЛУЧЕНИЕ</label>
                  <div className="form-radio-group">
                    <label className="form-radio">
                      <input
                        type="radio"
                        name="delivery_type"
                        checked={form.delivery_type === 'delivery'}
                        onChange={() => setForm((f) => ({ ...f, delivery_type: 'delivery' }))}
                      />
                      <span>ДОСТАВКА</span>
                    </label>
                    <label className="form-radio">
                      <input
                        type="radio"
                        name="delivery_type"
                        checked={form.delivery_type === 'pickup'}
                        onChange={() => setForm((f) => ({ ...f, delivery_type: 'pickup' }))}
                      />
                      <span>ЗАБРАТЬ НА ФЕСТИВАЛЕ</span>
                    </label>
                  </div>
                </div>
                
                {form.delivery_type === 'delivery' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">АДРЕС ДОСТАВКИ *</label>
                      <textarea
                        required
                        value={form.shipping_address}
                        onChange={(e) => setForm((f) => ({ ...f, shipping_address: e.target.value }))}
                        className="form-textarea"
                        rows={2}
                        placeholder="ГОРОД, УЛИЦА, ДОМ, КВАРТИРА"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ФИО ПОЛУЧАТЕЛЯ *</label>
                      <input
                        value={form.recipient_name}
                        onChange={(e) => setForm((f) => ({ ...f, recipient_name: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ТЕЛЕФОН *</label>
                      <input
                        type="tel"
                        value={form.recipient_phone}
                        onChange={(e) => setForm((f) => ({ ...f, recipient_phone: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                  </>
                )}
                
                <div className="form-group">
                  <label className="form-label">ДОП. ИНФОРМАЦИЯ</label>
                  <textarea
                    value={form.additional_info}
                    onChange={(e) => setForm((f) => ({ ...f, additional_info: e.target.value }))}
                    className="form-textarea"
                    rows={2}
                    placeholder="КОММЕНТАРИЙ К ЗАКАЗУ"
                  />
                </div>
                
                <div className="shop-total">
                  ИТОГО: <span>{priceCoins(selected) * form.quantity}</span> МОНЕТ
                </div>
                
                <div className="shop-modal-buttons">
                  <button type="submit" disabled={submitting} className="btn-blue">
                    <span>{submitting ? 'ОФОРМЛЕНИЕ...' : 'ОФОРМИТЬ'}</span>
                  </button>
                  <button type="button" onClick={() => setSelected(null)} className="btn-pink">
                    ОТМЕНА
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}