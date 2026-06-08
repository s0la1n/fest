'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import PageLoader from '@/components/ui/PageLoader';
import './cards.css';

const RARITY_LABELS: Record<string, string> = {
  common: 'ОБЫЧНАЯ',
  rare: 'РЕДКАЯ',
  epic: 'ЭПИЧЕСКАЯ',
  legendary: 'ЛЕГЕНДАРНАЯ',
  secret: 'СЕКРЕТНАЯ',
};

const BONUS_LABELS: Record<string, string> = {
  virtual_currency: 'ВИРТУАЛЬНАЯ ВАЛЮТА',
  coupon: 'ПРОМОКОД',
  discount: 'СКИДКА',
  physical_gift: 'ФИЗИЧЕСКИЙ ПОДАРОК',
  digital_gift: 'ЦИФРОВОЙ ПОДАРОК',
  experience: 'ВПЕЧАТЛЕНИЯ',
};

const STATUS_LABELS: Record<string, string> = {
  acquired: 'ПОЛУЧЕНА',
  bonus_used: 'БОНУС ИСПОЛЬЗОВАН',
  active: 'АКТИВНА',
  inactive: 'НЕАКТИВНА',
  expired: 'ИСТЕКЛА',
};

type UserCard = {
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
  qr_data: string | null;
  acquired_at: string;
};

export default function CardsPage() {
  const { user, token, loading: authLoading, refreshUserData } = useAuth();
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [activatingCardId, setActivatingCardId] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [qrScanner, setQrScanner] = useState<Html5QrcodeScanner | null>(null);
  const [showBonusQr, setShowBonusQr] = useState<{ cardId: number; qrData: string; message: string } | null>(null);

  const isAuthenticated = !!user && !!token;

  // Загрузка карточек пользователя
  const loadCards = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get<{ cards: UserCard[] }>('/cards');
      setCards(data.cards || []);
    } catch (err) {
      console.error('Ошибка загрузки карточек:', err);
      setError('НЕ УДАЛОСЬ ЗАГРУЗИТЬ КАРТОЧКИ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadCards();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user]);

  // Активация карточки по коду
  const activateCardByCode = async (code: string) => {
    if (!code.trim()) {
      setError('ВВЕДИТЕ КОД КАРТОЧКИ');
      return false;
    }

    setActivating(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiClient.post<{ success: boolean; message: string; card: UserCard }>(
        '/cards/get-card',
        { code: code.trim() }
      );

      if (data.success) {
        setSuccess(data.message || 'КАРТОЧКА УСПЕШНО АКТИВИРОВАНА!');
        setCodeInput('');
        loadCards();
        return true;
      } else {
        setError(data.message || 'НЕ УДАЛОСЬ АКТИВИРОВАТЬ КАРТОЧКУ');
        return false;
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'ОШИБКА АКТИВАЦИИ КАРТОЧКИ';
      setError(message);
      return false;
    } finally {
      setActivating(false);
    }
  };

  // Обработчик формы активации
  const handleActivateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    await activateCardByCode(codeInput);
  };

  // Запуск сканера QR-кода
  const startScanner = () => {
    setShowScanner(true);
    setError('');
    
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        false
      );
      
      scanner.render(
        (decodedText) => {
          scanner.clear();
          setShowScanner(false);
          setQrScanner(null);
          activateCardByCode(decodedText);
        },
        (errorMessage) => {
          console.log('QR scan error:', errorMessage);
        }
      );
      
      setQrScanner(scanner);
    }, 100);
  };

  // Остановка сканера
  const stopScanner = () => {
    if (qrScanner) {
      qrScanner.clear();
      setQrScanner(null);
    }
    setShowScanner(false);
  };

  // Использование бонуса карточки
  const useBonus = async (userCardId: number, card: UserCard) => {
    setActivatingCardId(userCardId);
    setError('');
    setSuccess('');

    try {
      const data = await apiClient.post<{ success: boolean; message: string; bonus?: any }>(
        `/cards/${userCardId}/use-bonus`
      );

      if (data.success) {
        if (data.bonus?.type === 'virtual_currency') {
          // Для виртуальной валюты - показываем успех и обновляем баланс
          setSuccess(`${data.message} Получено ${data.bonus.amount} монет!`);
          await refreshUserData?.();
          loadCards();
        } else if (data.bonus?.qr_data) {
          // Для остальных типов - показываем QR-код
          setShowBonusQr({
            cardId: userCardId,
            qrData: data.bonus.qr_data,
            message: data.bonus.message || data.message
          });
          loadCards();
        } else {
          setSuccess(data.message || 'БОНУС УСПЕШНО ИСПОЛЬЗОВАН!');
          loadCards();
        }
      } else {
        setError(data.message || 'НЕ УДАЛОСЬ ИСПОЛЬЗОВАТЬ БОНУС');
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'ОШИБКА ИСПОЛЬЗОВАНИЯ БОНУСА';
      setError(message);
    } finally {
      setActivatingCardId(null);
    }
  };

  // Загрузка аутентификации
  if (authLoading) {
    return (
      <div className="cards-page">
        <PageLoader text="ЗАГРУЗКА..." className="cards-loader" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="cards-page">
        <div className="cards-container">
          <div className="cards-card">
            <div className="cards-error">
              <div className="cards-error-icon">⚠️</div>
              <h2>ДОСТУП ЗАПРЕЩЁН</h2>
              <p>ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ</p>
              <Link href="/signin" className="cards-btn">ВОЙТИ В АККАУНТ</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cards-page">
      <div className="cards-container">
        <div className="cards-header">
          <h1 className="cards-title">МОИ КАРТОЧКИ</h1>
          <p className="cards-subtitle">АКТИВИРУЙТЕ КАРТОЧКИ И ПОЛУЧАЙТЕ БОНУСЫ</p>
        </div>

        {error && (
          <div className="cards-error-box">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="cards-success-box">
            <p>{success}</p>
          </div>
        )}

        {/* Модальное окно для показа QR-кода бонуса */}
        {showBonusQr && (
          <div className="cards-scanner-modal">
            <div className="cards-scanner-container">
              <div className="cards-scanner-header">
                <h3 className="cards-scanner-title">ПРЕДЪЯВИТЕ КОД</h3>
                <button 
                  className="cards-scanner-close" 
                  onClick={() => setShowBonusQr(null)}
                >
                  ✕
                </button>
              </div>
              <div className="cards-bonus-qr">
                <div className="cards-bonus-message">{showBonusQr.message}</div>
                <div className="cards-bonus-qr-code">
                  <QRCodeSVG 
                    value={showBonusQr.qrData} 
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="L"
                    includeMargin={true}
                  />
                </div>
                <p className="cards-scanner-hint">
                  Покажите этот QR-код на стойке организаторов
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Сканер QR-кода для активации */}
        {showScanner && (
          <div className="cards-scanner-modal">
            <div className="cards-scanner-container">
              <div className="cards-scanner-header">
                <h3 className="cards-scanner-title">НАВЕДИТЕ НА QR-КОД</h3>
                <button className="cards-scanner-close" onClick={stopScanner}>✕</button>
              </div>
              <div id="qr-reader" className="cards-qr-reader"></div>
              <p className="cards-scanner-hint">НАВЕДИТЕ КАМЕРУ НА QR-КОД КАРТОЧКИ</p>
            </div>
          </div>
        )}

        {/* Форма активации карточки */}
        <div className="cards-activate-section">
          <h2 className="cards-section-title">АКТИВИРОВАТЬ КАРТОЧКУ</h2>
          <form onSubmit={handleActivateCard} className="cards-activate-form">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="ВВЕДИТЕ КОД С КАРТОЧКИ"
              className="cards-input"
            />
            <div className="cards-buttons-group">
              <button
                type="submit"
                disabled={activating}
                className="cards-activate-btn"
              >
                {activating ? 'АКТИВАЦИЯ...' : 'АКТИВИРОВАТЬ'}
              </button>
              <button
                type="button"
                onClick={startScanner}
                className="cards-scan-btn"
              >
              Сканировать 
              </button>
            </div>
          </form>
        </div>

        {/* Список карточек */}
        {loading ? (
          <PageLoader text="ЗАГРУЗКА КАРТОЧЕК..." className="cards-loader" />
        ) : cards.length === 0 ? (
          <div className="cards-empty">
            <p>У ВАС ПОКА НЕТ КАРТОЧЕК</p>
            <p>АКТИВИРУЙТЕ КАРТОЧКУ ПО КОДУ ИЛИ QR</p>
          </div>
        ) : (
          <div className="cards-grid">
            {cards.map((card) => (
              <div key={card.id} className="cards-item" data-rarity={card.rarity} data-status={card.status}>
                <div className="cards-item-image">
                  {card.image ? (
                    <img src={card.image} alt={card.name} />
                  ) : (
                    <div className="cards-item-placeholder">🎴</div>
                  )}
                  <span className={`cards-item-rarity ${card.rarity}`}>
                    {RARITY_LABELS[card.rarity] ?? card.rarity}
                  </span>
                </div>
                <div className="cards-item-info">
                  <h3 className="cards-item-name">{card.name}</h3>
                  {card.description && (
                    <p className="cards-item-desc">{card.description}</p>
                  )}
                  <div className="cards-item-tags">
                    <span className="cards-item-tag">
                      {BONUS_LABELS[card.type_bonus] ?? card.type_bonus}
                    </span>
                    <span className={`cards-item-status ${card.status}`}>
                      {STATUS_LABELS[card.status] ?? card.status}
                    </span>
                  </div>
                  {card.bonus_value && card.type_bonus === 'virtual_currency' && (
                    <div className="cards-item-bonus-value">
                      БОНУС: +{card.bonus_value} МОНЕТ
                    </div>
                  )}
                  {card.coupon_code && card.type_bonus === 'coupon' && (
                    <div className="cards-item-bonus-value">
                      ПРОМОКОД: {card.coupon_code}
                    </div>
                  )}
                  {card.bonus_value && card.type_bonus === 'discount' && (
                    <div className="cards-item-bonus-value">
                      СКИДКА: {card.bonus_value}%
                    </div>
                  )}
                  <div className="cards-item-date">
                    ПОЛУЧЕНА: {new Date(card.acquired_at).toLocaleDateString('ru-RU')}
                  </div>
                  <div className="cards-item-actions">
                    {card.status === 'acquired' && (
                      <button
                        onClick={() => useBonus(card.id, card)}
                        disabled={activatingCardId === card.id}
                        className="cards-use-btn"
                      >
                        {activatingCardId === card.id ? 'АКТИВАЦИЯ...' : 'ИСПОЛЬЗОВАТЬ БОНУС'}
                      </button>
                    )}
                    {card.status === 'bonus_used' && (
                      <span className="cards-used-label">БОНУС ИСПОЛЬЗОВАН</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}