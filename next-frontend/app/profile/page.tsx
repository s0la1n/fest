'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import PageLoader from '@/components/ui/PageLoader';
import './profile.css';

const TICKET_LABELS: Record<string, string> = { standard: 'СТАНДАРТ', vip: 'VIP', premium: 'ПРЕМИУМ', cosplay: 'КОСПЛЕЙ', tournament: 'ТУРНИР' };
const TICKET_COLORS: Record<string, string> = {
  standard: 'standard', vip: 'vip', premium: 'premium',
  cosplay: 'cosplay', tournament: 'standard',
};

type Ticket = {
  id: number;
  ticket_number: string;
  type: string;
  price: number;
  payment_status: string;
  qr_code?: string;
};

export default function ProfilePage() {
  const { user, refreshUserData } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileBonusMessage, setProfileBonusMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Состояния для модального окна QR-кода
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setLastName(user.last_name || '');
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const [ticketsRes, ordersRes] = await Promise.all([
        apiClient.get<{ tickets?: Ticket[] }>('/my-tickets'),
        apiClient.get<{ orders?: any[] }>('/my-orders').catch(() => ({ orders: [] })),
      ]);
      setTickets(ticketsRes?.tickets ?? []);
      setOrders(ordersRes?.orders ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileBonusMessage(null);
    try {
      const res = await apiClient.put<{ user?: any; profile_bonus_granted?: boolean; profile_bonus_amount?: number }>(
        '/profile',
        { last_name: lastName.trim() || null }
      );
      refreshUserData?.();
      if (res?.profile_bonus_granted && res?.profile_bonus_amount) {
        setProfileBonusMessage(`+${res.profile_bonus_amount} МОНЕТ ЗА ЗАПОЛНЕНИЕ ПРОФИЛЯ`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProfile(false);
    }
  };

  const getTicketTypeName = (type: string) => TICKET_LABELS[type] ?? type;
  const getTicketColor = (type: string) => TICKET_COLORS[type] ?? 'standard';

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'НОВЫЙ ПАРОЛЬ ДОЛЖЕН БЫТЬ НЕ МЕНЕЕ 6 СИМВОЛОВ' });
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordMessage({ type: 'error', text: 'ПАРОЛИ НЕ СОВПАДАЮТ' });
      return;
    }
    setChangingPassword(true);
    try {
      // ⚠️ Меняем put на post
      await apiClient.post('/change-password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirm,
      });
      setPasswordMessage({ type: 'success', text: 'ПАРОЛЬ УСПЕШНО ИЗМЕНЁН' });
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const msg = data?.errors?.current_password?.[0] ?? data?.message ?? 'НЕ УДАЛОСЬ ИЗМЕНИТЬ ПАРОЛЬ';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setChangingPassword(false);
    }
  };

  const showQrCode = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setQrData(null);
    setQrError(null);
    setQrLoading(true);
    
    try {
      const response = await apiClient.get<{ qr_data: string }>('/ticket/qr');
      setQrData(response.qr_data);
    } catch (err: any) {
      console.error('Ошибка получения QR-кода:', err);
      setQrError(err?.response?.data?.error || 'НЕ УДАЛОСЬ ЗАГРУЗИТЬ QR-КОД');
    } finally {
      setQrLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setQrData(null);
    setQrError(null);
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-empty">
            <p className="profile-empty-text">ВОЙДИТЕ В СИСТЕМУ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">МОЙ ПРОФИЛЬ</h1>
          <p className="profile-description">ЛИЧНЫЕ ДАННЫЕ И БИЛЕТЫ</p>
        </div>

        <div className="profile-grid">
          <div className="profile-left">
            <div className="profile-card">
              <h2 className="profile-card-title">ЛИЧНЫЕ ДАННЫЕ</h2>
              {profileBonusMessage && (
                <div className="profile-message success">{profileBonusMessage}</div>
              )}
              <div className="profile-form-group">
                <label className="profile-label">ЛОГИН</label>
                <p className="profile-value">{user.login}</p>
              </div>
              <div className="profile-form-group">
                <label className="profile-label">ИМЯ</label>
                <p className="profile-value">{user.name || '—'}</p>
              </div>
              <div className="profile-form-group">
                <label className="profile-label">ФАМИЛИЯ</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="ФАМИЛИЯ"
                  className="profile-input"
                />
              </div>
              {/* Блок с никнеймом полностью удалён */}
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="btn-pink"
              >
                <span>{savingProfile ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}</span>
              </button>
              <div className="profile-form-group" style={{ marginTop: '20px' }}>
                <label className="profile-label">БАЛАНС</label>
                <p className="profile-balance">{(user as any).balance ?? 0} МОНЕТ</p>
              </div>
              <div className="profile-form-group">
                <label className="profile-label">EMAIL</label>
                <p className="profile-value">{user.email}</p>
              </div>
              <div className="profile-form-group">
                <label className="profile-label">ТЕЛЕФОН</label>
                <p className="profile-value">{user.phone || '—'}</p>
              </div>
            </div>

            <div className="profile-card">
              <h2 className="profile-card-title">СМЕНА ПАРОЛЯ</h2>
              {passwordMessage && (
                <div className={`profile-message ${passwordMessage.type}`}>
                  {passwordMessage.text}
                </div>
              )}
              <form onSubmit={changePassword}>
                <div className="profile-form-group">
                  <label className="profile-label">ТЕКУЩИЙ ПАРОЛЬ *</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="ВВЕДИТЕ ТЕКУЩИЙ ПАРОЛЬ"
                    className="profile-input"
                  />
                </div>
                <div className="profile-form-group">
                  <label className="profile-label">НОВЫЙ ПАРОЛЬ *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="НЕ МЕНЕЕ 6 СИМВОЛОВ"
                    className="profile-input"
                  />
                </div>
                <div className="profile-form-group">
                  <label className="profile-label">ПОВТОРИТЕ НОВЫЙ ПАРОЛЬ *</label>
                  <input
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    required
                    minLength={6}
                    placeholder="ПОВТОРИТЕ НОВЫЙ ПАРОЛЬ"
                    className="profile-input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="btn-pink"
                >
                  <span>{changingPassword ? 'СОХРАНЕНИЕ...' : 'ИЗМЕНИТЬ ПАРОЛЬ'}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="profile-right">
            <div className="profile-orders-section">
              <h2 className="profile-section-title">МОИ ЗАКАЗЫ</h2>
              {loading ? (
                <PageLoader className="profile-loader" text="" />
              ) : orders.length === 0 ? (
                <div className="profile-empty">
                  <p className="profile-empty-text">ЗАКАЗОВ ПОКА НЕТ</p>
                </div>
              ) : (
                <div>
                  {orders.map((order: any) => (
                    <div key={order.id} className="profile-order-item">
                      <div className="profile-order-info">
                        <p className="profile-order-name">{order.merch?.name ?? 'ТОВАР'}</p>
                        <p className="profile-order-details">
                          #{order.order_number} · {order.quantity} ШТ.
                        </p>
                      </div>
                      <span className={`profile-order-status ${order.status === 'processing' ? 'processing' : 'completed'}`}>
                        {order.status === 'processing' ? 'В ОБРАБОТКЕ' : order.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="profile-tickets-section">
              <h2 className="profile-section-title">МОИ БИЛЕТЫ</h2>
              {loading ? (
                <PageLoader className="profile-loader" text="" />
              ) : tickets.length === 0 ? (
                <div className="profile-empty">
                  <p className="profile-empty-text">НЕТ БИЛЕТОВ</p>
                </div>
              ) : (
                <div>
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className={`profile-ticket-item ${ticket.payment_status === 'paid' ? 'paid' : 'pending'}`}>
                      <div className="profile-ticket-header">
                        <span className={`profile-ticket-badge ${getTicketColor(ticket.type)}`}>
                          {getTicketTypeName(ticket.type)}
                        </span>
                        <span className={`profile-ticket-status ${ticket.payment_status === 'paid' ? 'paid' : 'pending'}`}>
                          {ticket.payment_status === 'paid' ? 'ОПЛАЧЕН' : 'ОЖИДАЕТ ОПЛАТЫ'}
                        </span>
                      </div>
                      <p className="profile-ticket-number">#{ticket.ticket_number}</p>
                      <p className="profile-ticket-price">{ticket.price} ₽</p>
                      <div className="profile-ticket-footer">
                        {ticket.payment_status === 'paid' && (
                          <button
                            onClick={() => showQrCode(ticket)}
                            className="btn-qr"
                          >
                            QR-КОД
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно с QR-кодом */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">QR-КОД БИЛЕТА</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <p className="modal-ticket-number">#{selectedTicket.ticket_number}</p>
              <p className="modal-ticket-type">{getTicketTypeName(selectedTicket.type)}</p>
              
              {qrLoading ? (
                <PageLoader className="profile-loader" text="" />
              ) : qrError ? (
                <div className="profile-message error">{qrError}</div>
              ) : qrData ? (
                <div className="modal-qr-container">
                  <QRCodeSVG
                    value={qrData}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={true}
                  />
                </div>
              ) : null}
              
              <p className="modal-qr-note">ПРЕДЪЯВИТЕ QR-КОД НА ВХОДЕ</p>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeModal} className="btn-blue" style={{ width: '100%' }}>
                <span>ЗАКРЫТЬ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}