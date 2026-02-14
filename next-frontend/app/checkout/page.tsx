'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = searchParams.get('ticketId');
  const [loading, setLoading] = useState(false);
  const [ticketInfo, setTicketInfo] = useState<any>(null);

  const API_URL = 'http://localhost:8000/api';

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
      // Перенаправляем на страницу оплаты ЮKassa
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Пожалуйста, войдите в систему</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Оплата билета</h1>
            <p className="mt-2 text-gray-600">
              Привет, <span className="font-semibold">{user.login}</span>!
            </p>
          </div>

          {ticketInfo && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о билете</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Номер билета:</span>
                  <span className="font-mono font-semibold">{ticketInfo.ticket_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Тип билета:</span>
                  <span className="font-semibold capitalize">{ticketInfo.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Статус:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ticketInfo.payment_status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {ticketInfo.payment_status === 'pending' ? 'Ожидает оплаты' : 'Оплачен'}
                  </span>
                </div>
                <div className="pt-3 border-t border-blue-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Итого к оплате:</span>
                    <span className="text-blue-700">{ticketInfo.price}₽</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Обработка платежа...' : 'Оплатить картой'}
            </button>

            <div className="flex items-center justify-center space-x-2">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-sm text-gray-500 px-4">или</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>

            <button 
              onClick={() => router.push('/profile')}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Оплатить позже в профиле
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              После оплаты билет появится в вашем профиле
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">✓</span>
              </div>
              <span className="text-sm text-gray-700">Безопасная оплата</span>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">🔄</span>
              </div>
              <span className="text-sm text-gray-700">Мгновенная доставка</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}