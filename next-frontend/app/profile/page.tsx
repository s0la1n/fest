'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

const TICKET_LABELS: Record<string, string> = { standard: 'Стандарт', vip: 'VIP', premium: 'Премиум', cosplay: 'Косплей', tournament: 'Турнир' };
const TICKET_COLORS: Record<string, string> = {
  standard: 'bg-[#00f5ff]/20 text-[#00f5ff]', vip: 'bg-[#ff00ff]/20 text-[#ff00ff]', premium: 'bg-[#39ff14]/20 text-[#39ff14]',
  cosplay: 'bg-[#ff006e]/20 text-[#ff006e]', tournament: 'bg-[#00f5ff]/20 text-[#00f5ff]',
};

export default function ProfilePage() {
  const { user, refreshUserData } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileBonusMessage, setProfileBonusMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setLastName(user.last_name || '');
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const [ticketsRes, ordersRes] = await Promise.all([
        apiClient.get<{ tickets?: any[] }>('/my-tickets'),
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
        { nickname: nickname.trim() || null, last_name: lastName.trim() || null }
      );
      refreshUserData?.();
      if (res?.profile_bonus_granted && res?.profile_bonus_amount) {
        setProfileBonusMessage(`Вам начислено ${res.profile_bonus_amount} монет за заполнение профиля.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProfile(false);
    }
  };

  const getTicketTypeName = (type: string) => TICKET_LABELS[type] ?? type;
  const getTicketColor = (type: string) => TICKET_COLORS[type] ?? 'bg-[#12121a] text-slate-300';

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Новый пароль должен быть не менее 6 символов' });
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordMessage({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }
    setChangingPassword(true);
    try {
      await apiClient.put('/change-password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirm,
      });
      setPasswordMessage({ type: 'success', text: 'Пароль успешно изменён' });
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const msg = data?.errors?.current_password?.[0] ?? data?.message ?? 'Не удалось изменить пароль';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <p className="text-slate-400">Войдите в систему</p>
          <Link href="/signin" className="mt-4 inline-block text-[#00f5ff] hover:underline">Войти</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Мой профиль</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#12121a] rounded-xl p-6 border border-[#1a1a24]">
              <h2 className="text-lg font-semibold text-white mb-4">Личные данные</h2>
              {profileBonusMessage && (
                <p className="mb-4 text-sm text-[#39ff14] bg-[#39ff14]/10 px-3 py-2 rounded-lg">{profileBonusMessage}</p>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400">Логин</label>
                  <p className="text-white">{user.login}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400">Имя</label>
                  <p className="text-white">{user.name || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400">Фамилия (необязательно, за заполнение — бонус монетами)</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Фамилия"
                    className="w-full mt-1 px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:border-[#00f5ff]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400">Никнейм (необязательно, для турнира/косплея; за заполнение — бонус)</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Никнейм"
                    className="w-full mt-1 px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:border-[#00f5ff]"
                  />
                </div>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="px-4 py-2 bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] rounded-lg text-sm disabled:opacity-50"
                >
                  {savingProfile ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
                <div>
                  <label className="block text-sm text-slate-400">Баланс</label>
                  <p className="text-[#00f5ff] font-semibold">{(user as any).balance ?? 0} монет</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400">Email</label>
                  <p className="text-white">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400">Телефон</label>
                  <p className="text-white">{user.phone || '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#12121a] rounded-xl p-6 border border-[#1a1a24]">
              <h2 className="text-lg font-semibold text-white mb-4">Смена пароля</h2>
              {passwordMessage && (
                <p className={`mb-4 text-sm px-3 py-2 rounded-lg ${
                  passwordMessage.type === 'success' ? 'text-[#39ff14] bg-[#39ff14]/10' : 'text-[#ff006e] bg-[#ff006e]/10'
                }`}>
                  {passwordMessage.text}
                </p>
              )}
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Текущий пароль *</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Введите текущий пароль"
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white placeholder-slate-500 focus:border-[#00f5ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Новый пароль *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Не менее 6 символов"
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white placeholder-slate-500 focus:border-[#00f5ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Повторите новый пароль *</label>
                  <input
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Повторите новый пароль"
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white placeholder-slate-500 focus:border-[#00f5ff] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {changingPassword ? 'Сохранение...' : 'Изменить пароль'}
                </button>
              </form>
            </div>

          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#12121a] rounded-xl p-6 border border-[#1a1a24]">
              <h2 className="text-lg font-semibold text-white mb-6">Мои заказы</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00f5ff] border-t-transparent mx-auto"></div>
                </div>
              ) : orders.length === 0 ? (
                <p className="text-slate-400">Заказов пока нет</p>
              ) : (
                <ul className="space-y-3">
                  {orders.map((order: any) => (
                    <li key={order.id} className="flex items-center justify-between py-3 border-b border-[#1a1a24] last:border-0">
                      <div>
                        <p className="text-white font-medium">{order.merch?.name ?? 'Товар'}</p>
                        <p className="text-slate-400 text-sm">#{order.order_number} · {order.quantity} шт. · {order.shipping_address}</p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded ${order.status === 'processing' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                        {order.status === 'processing' ? 'В обработке' : order.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-[#12121a] rounded-xl p-6 border border-[#1a1a24]">
              <h2 className="text-lg font-semibold text-white mb-6">Мои билеты</h2>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00f5ff] border-t-transparent mx-auto"></div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Нет билетов</div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`rounded-xl p-5 border ${
                        ticket.payment_status === 'paid' ? 'bg-green-900/20 border-green-700/50' : 'bg-amber-900/20 border-amber-700/50'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm ${getTicketColor(ticket.type)}`}>
                              {getTicketTypeName(ticket.type)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              ticket.payment_status === 'paid' ? 'bg-[#39ff14]/20 text-[#39ff14]' : 'bg-[#ff00ff]/20 text-[#ff00ff]'
                            }`}>
                              {ticket.payment_status === 'paid' ? 'Оплачен' : 'Ожидает оплаты'}
                            </span>
                          </div>
                          <p className="text-white font-medium">#{ticket.ticket_number}</p>
                          <p className="text-slate-400 text-sm">{ticket.price}₽</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
