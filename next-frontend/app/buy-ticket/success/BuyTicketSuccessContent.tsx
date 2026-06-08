// app/buy-ticket/success/BuyTicketSuccessContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';

export default function BuyTicketSuccessContent() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('ticket_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState<{ login: string; password: string }>({
    login: '',
    password: '',
  });

  const checkPayment = () => {
    if (!ticketId) {
      setStatus('error');
      setMessage('Не указан номер заказа.');
      return;
    }
    setStatus('loading');
    setMessage('');
    setCredentials({ login: '', password: '' });
    
    apiClient
      .get<{ success?: boolean; message?: string; login?: string; password?: string }>(
        `/buy-ticket/confirm?ticket_id=${ticketId}`
      )
      .then((data) => {
        console.log('Confirm payment response:', data);
        setStatus(data.success ? 'success' : 'error');
        setMessage(data.message || (data.success ? 'Оплата подтверждена.' : 'Оплата не найдена.'));
        if (data.success && (data.login || data.password)) {
          setCredentials({ login: data.login ?? '', password: data.password ?? '' });
        }
      })
      .catch((err: any) => {
        console.error('Confirm payment error:', err);
        setStatus('error');
        setMessage(
          err?.message || 'Не удалось проверить оплату. Попробуйте позже или обратитесь в поддержку.'
        );
      });
  };

  useEffect(() => {
    if (ticketId) {
      checkPayment();
    } else {
      setStatus('error');
      setMessage('Не указан номер заказа.');
    }
  }, [ticketId]);

  if (status === 'loading') {
    return <PageLoader text="ПРОВЕРКА ОПЛАТЫ..." className="loader-container" />;
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="success-icon">
          <svg viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="success-title">ОПЛАТА ПОДТВЕРЖДЕНА</h2>
        <p className="success-message">{message}</p>
        {(credentials.login || credentials.password) ? (
          <div className="credentials-box">
            <p className="credentials-title">⚠️ СОХРАНИТЕ ДАННЫЕ ДЛЯ ВХОДА</p>
            <p className="credentials-row">
              <span className="credentials-label">ЛОГИН:</span>{' '}
              <span className="credentials-value">{credentials.login}</span>
            </p>
            <p className="credentials-row">
              <span className="credentials-label">ПАРОЛЬ:</span>{' '}
              <span className="credentials-value">{credentials.password}</span>
            </p>
          </div>
        ) : (
          <p className="credentials-note">ДАННЫЕ ДЛЯ ВХОДА ОТПРАВЛЕНЫ НА ВАШУ ПОЧТУ</p>
        )}
        <Link
          href="/signin"
          className="ticket-btn"
          style={{ display: 'inline-block', width: 'auto', padding: '12px 32px' }}
        >
          ВОЙТИ
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="error-title">ОШИБКА</h2>
      <p className="error-message">{message}</p>
      <div className="error-buttons">
        <button type="button" onClick={checkPayment} className="error-btn">
          ПРОВЕРИТЬ СНОВА
        </button>
        <Link href="/buy-ticket" className="error-link">
          ВЕРНУТЬСЯ К ПОКУПКЕ
        </Link>
      </div>
    </div>
  );
}