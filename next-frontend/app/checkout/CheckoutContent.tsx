// app/checkout/CheckoutContent.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = searchParams.get('ticketId');
  const [loading, setLoading] = useState(false);
  const [ticketInfo, setTicketInfo] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

  useEffect(() => {
    if (ticketId && user) {
      fetchTicketInfo();
    }
  }, [ticketId, user]);

  const fetchTicketInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTicketInfo(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки информации о билете:', error);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/start-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        alert(data.message || 'Ошибка при создании платежа');
      }
    } catch (error) {
      console.error('Ошибка при создании платежа:', error);
      alert('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-card">
            <div className="text-center">
              <div className="checkout-icon">⚠️</div>
              <h2 className="checkout-title">ДОСТУП ЗАПРЕЩЁН</h2>
              <p className="checkout-text">ПОЖАЛУЙСТА, ВОЙДИТЕ В СИСТЕМУ</p>
              <a href="/signin" className="checkout-btn">ВОЙТИ</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-card">
          <div className="checkout-header">
            <h1 className="checkout-title">ОПЛАТА БИЛЕТА</h1>
            <p className="checkout-subtitle">
              ПРИВЕТ, <span className="checkout-username">{user.login}</span>!
            </p>
          </div>

          {ticketInfo && (
            <div className="checkout-info">
              <h2 className="checkout-info-title">ИНФОРМАЦИЯ О БИЛЕТЕ</h2>
              <div className="checkout-info-row">
                <span className="checkout-info-label">НОМЕР БИЛЕТА:</span>
                <span className="checkout-info-value">{ticketInfo.ticket_number}</span>
              </div>
              <div className="checkout-info-row">
                <span className="checkout-info-label">ТИП БИЛЕТА:</span>
                <span className="checkout-info-value">{ticketInfo.type}</span>
              </div>
              <div className="checkout-info-row">
                <span className="checkout-info-label">СТАТУС:</span>
                <span className={`checkout-status ${ticketInfo.payment_status === 'pending' ? 'status-pending' : 'status-paid'}`}>
                  {ticketInfo.payment_status === 'pending' ? 'ОЖИДАЕТ ОПЛАТЫ' : 'ОПЛАЧЕН'}
                </span>
              </div>
              <div className="checkout-total">
                <span>ИТОГО К ОПЛАТЕ:</span>
                <span className="checkout-total-price">{ticketInfo.price} ₽</span>
              </div>
            </div>
          )}

          <div className="checkout-actions">
            <button 
              onClick={handlePayment}
              disabled={loading}
              className="checkout-pay-btn"
            >
              {loading ? 'ОБРАБОТКА...' : 'ОПЛАТИТЬ КАРТОЙ'}
            </button>

            <div className="checkout-divider">
              <span className="checkout-divider-text">ИЛИ</span>
            </div>

            <button 
              onClick={() => router.push('/profile')}
              className="checkout-later-btn"
            >
              ОПЛАТИТЬ ПОЗЖЕ В ПРОФИЛЕ
            </button>

            <p className="checkout-note">
              ПОСЛЕ ОПЛАТЫ БИЛЕТ ПОЯВИТСЯ В ВАШЕМ ПРОФИЛЕ
            </p>
          </div>

          <div className="checkout-footer">
            <div className="checkout-footer-item">
              <span className="checkout-footer-icon">✓</span>
              <span className="checkout-footer-text">БЕЗОПАСНАЯ ОПЛАТА</span>
            </div>
            <div className="checkout-footer-divider"></div>
            <div className="checkout-footer-item">
              <span className="checkout-footer-icon">🔄</span>
              <span className="checkout-footer-text">МГНОВЕННАЯ ДОСТАВКА</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}