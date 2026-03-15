'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';

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

const STATUS_LABELS: Record<string, string> = {
  acquired: 'Получена',
  active: 'Активна',
  bonus_used: 'Бонус использован',
  bonus_expired: 'Истекла',
  shared: 'Поделился',
  transferred: 'Передана',
};

type UserCardItem = {
  id: number;
  card_id: number;
  name: string;
  description: string | null;
  image: string;
  rarity: string;
  type_bonus: string;
  bonus_value: number | null;
  coupon_code: string | null;
  status: string;
  acquired_at: string;
};

export default function CardsPage() {
  const { user, refreshUserData } = useAuth();
  const [cards, setCards] = useState<UserCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');
  const [useBonusLoading, setUseBonusLoading] = useState<number | null>(null);
  const [bonusResult, setBonusResult] = useState<{ message: string; bonus?: Record<string, unknown> } | null>(null);

  const loadCards = async () => {
    try {
      const data = await apiClient.get<{ cards: UserCardItem[] }>('/cards');
      setCards(data.cards ?? []);
    } catch (e) {
      console.error(e);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadCards();
    else setLoading(false);
  }, [user]);

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    setCodeSuccess('');
    if (!code.trim()) {
      setCodeError('Введите код');
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await apiClient.post<{ success?: boolean; message?: string; card?: unknown; error?: string }>(
        '/cards/get-card',
        { code: code.trim() }
      );
      if (res.success) {
        setCodeSuccess(res.message || 'Карточка получена!');
        setCode('');
        loadCards();
        refreshUserData?.();
      } else {
        setCodeError((res as { error?: string }).error || 'Ошибка');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Ошибка запроса';
      setCodeError(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUseBonus = async (userCardId: number) => {
    setBonusResult(null);
    setUseBonusLoading(userCardId);
    try {
      const res = await apiClient.post<{ success?: boolean; message?: string; bonus?: Record<string, unknown> }>(
        `/cards/${userCardId}/use-bonus`
      );
      if (res.success) {
        setBonusResult({ message: res.message || 'Готово', bonus: res.bonus });
        loadCards();
        refreshUserData?.();
      } else {
        setBonusResult({ message: (res as { error?: string }).error || 'Ошибка' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Ошибка';
      setBonusResult({ message });
    } finally {
      setUseBonusLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Войдите, чтобы просматривать и активировать карточки маскотов</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Карточки маскотов</h1>
        <p className="text-slate-400 text-sm mb-8">
          Находите секретные QR-коды или коды на фестивале, вводите их ниже и получайте карточки спонсоров с бонусами.
        </p>

        {/* Ввод секретного кода */}
        <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-600 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Ввести код</h2>
          <form onSubmit={handleSubmitCode} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-300 mb-1">Секретный код или код с QR</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Введите код"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                disabled={submitLoading}
              />
            </div>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg disabled:opacity-50 transition"
            >
              {submitLoading ? 'Проверка...' : 'Получить карточку'}
            </button>
          </form>
          {codeError && <p className="mt-2 text-red-400 text-sm">{codeError}</p>}
          {codeSuccess && <p className="mt-2 text-green-400 text-sm">{codeSuccess}</p>}
        </section>

        {/* Результат использования бонуса */}
        {bonusResult && (
          <div className="mb-6 p-4 rounded-lg bg-slate-800 border border-slate-600 text-slate-200">
            <p className="font-medium text-white">{bonusResult.message}</p>
            {bonusResult.bonus && Object.keys(bonusResult.bonus).length > 0 && (
              <pre className="mt-2 text-sm text-slate-400 overflow-auto">
                {JSON.stringify(bonusResult.bonus, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Мои карточки — только свои */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Мои карточки</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-600 border-t-cyan-500" />
            </div>
          ) : cards.length === 0 ? (
            <p className="text-slate-500">У вас пока нет карточек. Введите секретный код выше.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-800 rounded-xl overflow-hidden border border-slate-600 hover:border-slate-500 transition"
                >
                  <div className="aspect-[4/3] bg-slate-700 relative">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-4xl">
                        🎴
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${
                        c.rarity === 'secret'
                          ? 'bg-amber-600/90'
                          : c.rarity === 'legendary'
                          ? 'bg-purple-600/90'
                          : c.rarity === 'epic'
                          ? 'bg-indigo-600/90'
                          : c.rarity === 'rare'
                          ? 'bg-blue-600/90'
                          : 'bg-slate-600/90'
                      } text-white`}
                    >
                      {RARITY_LABELS[c.rarity] ?? c.rarity}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white truncate">{c.name}</h3>
                    {c.description && (
                      <p className="text-slate-400 text-sm mt-0.5 line-clamp-2">{c.description}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      {BONUS_LABELS[c.type_bonus] ?? c.type_bonus} · {STATUS_LABELS[c.status] ?? c.status}
                    </p>
                    {(c.status === 'acquired' || c.status === 'active') && (
                      <button
                        type="button"
                        onClick={() => handleUseBonus(c.id)}
                        disabled={useBonusLoading !== null}
                        className="mt-3 w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition"
                      >
                        {useBonusLoading === c.id ? '...' : 'Использовать бонус'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
