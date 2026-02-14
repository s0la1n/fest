'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';

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

  // Функция для расчета цены в монетах - используем только поле price
  const priceCoins = (p: any) => Math.round(p?.price || 0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Войдите для покупок</p>
      </div>
    );
  }

  const balance = user.balance ?? 0;

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Магазин</h1>
        <div className="mb-6 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
          <span className="font-medium text-slate-300">Баланс: </span>
          <span className="font-bold text-amber-400">{balance} монет</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-slate-800 rounded-xl border border-slate-600 overflow-hidden">
                <div className="h-48 bg-slate-700 flex items-center justify-center text-4xl">
                  {p.main_image ? <img src={p.main_image} alt={p.name} className="w-full h-full object-cover" /> : '🛍️'}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-white">{p.name}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2">{p.description}</p>
                  <p className="mt-2 font-bold text-amber-400">💰 {priceCoins(p)} монет</p>
                  <button
                    onClick={() => {
                      setSelected(p);
                      setForm((f) => ({ ...f, quantity: 1 }));
                    }}
                    disabled={p.stock_quantity < 1 || balance < priceCoins(p)}
                    className="mt-2 w-full py-2 bg-cyan-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Купить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-600 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">Купить: {selected.name}</h3>
              <p className="text-amber-400 font-bold mb-4">{priceCoins(selected)} монет за шт.</p>
              <form onSubmit={purchase} className="space-y-4">
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Количество</label>
                  <input
                    type="number"
                    min={1}
                    max={selected.stock_quantity}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Получение</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery_type"
                        checked={form.delivery_type === 'delivery'}
                        onChange={() => setForm((f) => ({ ...f, delivery_type: 'delivery' }))}
                        className="text-cyan-500"
                      />
                      <span className="text-slate-300">Доставка</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery_type"
                        checked={form.delivery_type === 'pickup'}
                        onChange={() => setForm((f) => ({ ...f, delivery_type: 'pickup' }))}
                        className="text-cyan-500"
                      />
                      <span className="text-slate-300">Забрать на фестивале</span>
                    </label>
                  </div>
                </div>
                {form.delivery_type === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Адрес доставки *</label>
                    <textarea
                      required
                      value={form.shipping_address}
                      onChange={(e) => setForm((f) => ({ ...f, shipping_address: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      rows={2}
                      placeholder="Город, улица, дом, квартира"
                    />
                  </div>
                )}
                {form.delivery_type === 'delivery' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">ФИО получателя *</label>
                      <input
                        value={form.recipient_name}
                        onChange={(e) => setForm((f) => ({ ...f, recipient_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Телефон *</label>
                      <input
                        type="tel"
                        value={form.recipient_phone}
                        onChange={(e) => setForm((f) => ({ ...f, recipient_phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Доп. информация</label>
                  <textarea
                    value={form.additional_info}
                    onChange={(e) => setForm((f) => ({ ...f, additional_info: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    rows={2}
                    placeholder="Комментарий к заказу"
                  />
                </div>
                <p className="text-sm text-slate-400">Итого: {priceCoins(selected) * form.quantity} монет</p>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="flex-1 py-2 bg-cyan-600 text-white rounded-lg disabled:opacity-50">
                    {submitting ? '...' : 'Оформить'}
                  </button>
                  <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg">
                    Отмена
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