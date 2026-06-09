'use client';

import { useState, useEffect } from 'react';

export function PaymentStatusChecker({ ticketId }: { ticketId: number }) {
  const [status, setStatus] = useState('pending');
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/check-status`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.ticket_status);
        
        if (data.ticket_status === 'paid') {
          // Оплата прошла успешно
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Ошибка проверки статуса:', error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (status === 'pending') {
      const interval = setInterval(checkStatus, 5000); // Проверяем каждые 5 секунд
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Статус оплаты: <span className="capitalize">{status}</span></p>
          <p className="text-sm text-gray-600">Проверяем статус оплаты...</p>
        </div>
        <button
          onClick={checkStatus}
          disabled={checking}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {checking ? 'Проверка...' : 'Проверить'}
        </button>
      </div>
    </div>
  );
}