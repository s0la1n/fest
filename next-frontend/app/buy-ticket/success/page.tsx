'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function BuyTicketSuccessPage() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('ticket_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState<{ login: string; password: string }>({ login: '', password: '' });

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
      .get<{ success?: boolean; message?: string; login?: string; password?: string }>(`/buy-ticket/confirm?ticket_id=${ticketId}`)
      .then((data) => {
        setStatus(data.success ? 'success' : 'error');
        setMessage(data.message || (data.success ? 'Оплата подтверждена.' : 'Оплата не найдена.'));
        if (data.success && (data.login || data.password)) {
          setCredentials({ login: data.login ?? '', password: data.password ?? '' });
        }
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(
          err?.message || 'Не удалось проверить оплату. Попробуйте позже или обратитесь в поддержку.'
        );
      });
  };

  useEffect(() => {
    checkPayment();
  }, [ticketId]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="bg-[#12121a] backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-[#00f5ff]/30" style={{ boxShadow: '0 0 40px rgba(0,245,255,0.15)' }}>
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00f5ff] mb-4" />
            <p className="text-slate-300">Проверка оплаты...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-[#39ff14]" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ filter: 'drop-shadow(0 0 10px rgba(57,255,20,0.5))' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Оплата прошла успешно</h2>
            <p className="text-slate-300 mb-4">{message}</p>
            {credentials.login || credentials.password ? (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-left">
                <p className="text-amber-200 text-sm font-medium mb-2">Сохраните данные для входа (письмо не отправилось):</p>
                <p className="text-white font-mono text-sm"><span className="text-slate-400">Логин:</span> {credentials.login}</p>
                <p className="text-white font-mono text-sm mt-1"><span className="text-slate-400">Пароль:</span> {credentials.password}</p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm mb-6">
                Данные для входа (логин и пароль) отправлены на вашу почту. Проверьте почту и войдите в систему.
              </p>
            )}
            <Link
              href="/signin"
              className="inline-block bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] px-6 py-3 rounded-lg font-medium transition" style={{ boxShadow: '0 0 15px rgba(0,245,255,0.3)' }}
            >
              Перейти к входу
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ошибка</h2>
            <p className="text-slate-300 mb-6">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={checkPayment}
                className="inline-block bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] px-6 py-3 rounded-lg font-medium transition" style={{ boxShadow: '0 0 15px rgba(0,245,255,0.3)' }}
              >
                Проверить снова
              </button>
              <Link
                href="/buy-ticket"
                className="inline-block bg-[#12121a] border border-[#00f5ff]/30 hover:bg-[#00f5ff]/10 text-[#00f5ff] px-6 py-3 rounded-lg font-medium transition text-center"
              >
                Вернуться к покупке билета
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
