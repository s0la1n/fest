'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

/** Приём заявок закрыт: фестиваль уже начался */
const FESTIVAL_STARTED = true;

const STATUS_LABELS: Record<string, string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  waiting_list: 'Лист ожидания',
  under_review: 'На проверке',
};

const statusClasses: Record<string, string> = {
  approved: 'bg-[#39ff14]/20 text-[#39ff14]',
  rejected: 'bg-[#ff006e]/20 text-[#ff006e]',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status] ?? 'bg-[#ff00ff]/20 text-[#ff00ff]'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{ tournament: any; cosplay: any; pending_invitations: any[] }>({
    tournament: null,
    cosplay: null,
    pending_invitations: [],
  });
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'tournament' | 'cosplay'>('tournament');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tournamentForm, setTournamentForm] = useState({
    game_id: '',
    team_name: '',
    tag: '',
    city: '',
    description: '',
    awards: '',
    member_logins: ['', '', '', ''],
  });
  const [cosplayForm, setCosplayForm] = useState({
    character_name: '',
    origin: '',
    photo: '',
    biography: '',
    character_description: '',
    portfolio_link: '',
    awards: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [apps, gamesList] = await Promise.all([
        apiClient.get<{ tournament?: any; cosplay?: any; pending_invitations?: any[] }>('/applications').catch(() => null),
        apiClient.get<any[]>('/applications/games').catch(() => []),
      ]);
      if (apps) setData({ tournament: apps.tournament ?? null, cosplay: apps.cosplay ?? null, pending_invitations: apps.pending_invitations ?? [] });
      setGames(Array.isArray(gamesList) ? gamesList : []);
      if (Array.isArray(gamesList) && gamesList.length && !tournamentForm.game_id) {
        setTournamentForm((f) => ({ ...f, game_id: String(gamesList[0].id) }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, body: object, endpoint: string, updateKey: 'tournament' | 'cosplay') => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const json = await apiClient.post<any>(endpoint, body);
      setData((d) => ({ ...d, [updateKey]: json }));
    } catch (err) {
      const msg = (err as Error & { response?: { data?: { message?: string } } })?.message
        || (err as any)?.response?.data?.message;
      setError(msg || 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  const submitTournament = (e: React.FormEvent) =>
    handleSubmit(e, { ...tournamentForm, member_logins: tournamentForm.member_logins.filter((l) => l.trim()) }, '/applications/tournament', 'tournament');

  const submitCosplay = (e: React.FormEvent) => handleSubmit(e, cosplayForm, '/applications/cosplay', 'cosplay');

  const handleInvitation = async (id: number, action: 'accept' | 'reject') => {
    try {
      await apiClient.post(`/applications/invitations/${id}/${action}`);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const addMemberSlot = () => {
    setTournamentForm((f) => ({ ...f, member_logins: [...f.member_logins, ''] }));
  };
  const removeMemberSlot = (i: number) => {
    setTournamentForm((f) => ({
      ...f,
      member_logins: f.member_logins.filter((_, idx) => idx !== i),
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <p className="text-slate-400">Войдите для подачи заявок</p>
          <Link href="/signin" className="mt-4 inline-block text-[#00f5ff] hover:underline">Войти</Link>
        </div>
      </div>
    );
  }

  if (FESTIVAL_STARTED) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-[#12121a] border border-[#1a1a24] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-4">Мои заявки</h1>
          <p className="text-slate-400 mb-6">
            Приём заявок закрыт — фестиваль уже начался. Подать заявку на турнир или косплей будет возможно в следующем сезоне.
          </p>
          <Link href="/" className="inline-block text-[#00f5ff] hover:text-[#00c4cc] font-medium">На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Мои заявки</h1>

        {/* Приглашения в команду */}
        {data.pending_invitations?.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-[#00f5ff]/10 border border-[#00f5ff]/30">
            <h2 className="font-semibold text-[#00f5ff] mb-2">Приглашения в команду</h2>
            <p className="text-sm text-slate-400 mb-3">Вас пригласили в команду. Подтвердите участие.</p>
            {data.pending_invitations.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-t border-[#00f5ff]/20 first:border-0">
                <div>
                  <p className="text-white font-medium">{inv.team?.tournament_application?.team_name}</p>
                  <p className="text-sm text-slate-400">
                    {inv.team?.tournament_application?.game?.name} • от {inv.inviter?.login}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleInvitation(inv.id, 'accept')}
                    className="px-3 py-1.5 bg-[#39ff14] text-[#0a0a0f] hover:bg-[#39ff14]/90 rounded-lg text-sm font-medium"
                  >
                    Принять
                  </button>
                  <button
                    onClick={() => handleInvitation(inv.id, 'reject')}
                    className="px-3 py-1.5 bg-[#12121a] border border-[#1a1a24] hover:border-[#00f5ff]/30 text-slate-300 rounded-lg text-sm"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#00f5ff] border-t-transparent mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              {(['tournament', 'cosplay'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg font-medium ${tab === t ? 'bg-[#00f5ff] text-[#0a0a0f]' : 'bg-[#12121a] text-slate-300 border border-[#1a1a24]'}`}
                >
                  {t === 'tournament' ? 'Турнир' : 'Косплей'}
                </button>
              ))}
            </div>

            {tab === 'tournament' && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                {data.tournament ? (
                  <div>
                    <p className="text-slate-400">Заявка на турнир (на следующий год)</p>
                    <p className="font-bold text-lg text-white">{data.tournament.team_name}</p>
                    <p className="text-sm text-slate-400">Игра: {data.tournament.game?.name}</p>
                    <StatusBadge status={data.tournament.status} />
                    {data.tournament.team?.invitations && (
                      <div className="mt-4">
                        <p className="text-sm text-slate-400">Участники:</p>
                        <ul className="text-sm text-slate-300 mt-1">
                          {data.tournament.team.invitations.map((inv: any) => (
                            <li key={inv.id}>{inv.invited_user?.login} — {inv.status === 'accepted' ? 'принято' : 'ожидает'}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={submitTournament} className="space-y-4">
                    <p className="text-sm text-[#ff00ff]">Нужен оплаченный билет «Турнир». Заявки на фестиваль следующего года.</p>
                    {error && <p className="text-[#ff006e] text-sm">{error}</p>}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Игра *</label>
                      <select
                        required
                        value={tournamentForm.game_id}
                        onChange={(e) => setTournamentForm((f) => ({ ...f, game_id: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                      >
                        {games.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Название команды *</label>
                      <input
                        required
                        value={tournamentForm.team_name}
                        onChange={(e) => setTournamentForm((f) => ({ ...f, team_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Тег *</label>
                      <input
                        required
                        maxLength={10}
                        value={tournamentForm.tag}
                        onChange={(e) => setTournamentForm((f) => ({ ...f, tag: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                        placeholder="ABCD"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Город *</label>
                      <input
                        required
                        value={tournamentForm.city}
                        onChange={(e) => setTournamentForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Участники (логины) * — должны быть зарегистрированы и иметь билет «Турнир»</label>
                      {tournamentForm.member_logins.map((login, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input
                            value={login}
                            onChange={(e) => {
                              const next = [...tournamentForm.member_logins];
                              next[i] = e.target.value;
                              setTournamentForm((f) => ({ ...f, member_logins: next }));
                            }}
                            className="flex-1 px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                            placeholder="Логин участника"
                          />
                          <button type="button" onClick={() => removeMemberSlot(i)} className="px-3 py-2 bg-[#ff006e]/20 text-[#ff006e] rounded-lg">−</button>
                        </div>
                      ))}
                      <button type="button" onClick={addMemberSlot} className="text-sm text-[#00f5ff] hover:underline">+ Добавить участника</button>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full py-2 bg-[#00f5ff] hover:bg-[#00c4cc] text-[#0a0a0f] text-white rounded-lg disabled:opacity-50">
                      {submitting ? 'Отправка...' : 'Подать заявку'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {tab === 'cosplay' && (
              <div className="bg-[#12121a] rounded-xl p-6 border border-[#00f5ff]/20">
                {data.cosplay ? (
                  <div>
                    <p className="text-slate-400">Заявка на косплей</p>
                    <p className="font-bold text-lg text-white">{data.cosplay.character_name}</p>
                    <p className="text-sm text-slate-400">Происхождение: {data.cosplay.origin}</p>
                    <StatusBadge status={data.cosplay.status} />
                  </div>
                ) : (
                  <form onSubmit={submitCosplay} className="space-y-4">
                    <p className="text-sm text-[#ff00ff]">Нужен оплаченный билет «Косплей».</p>
                    {error && <p className="text-[#ff006e] text-sm">{error}</p>}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Имя персонажа *</label>
                      <input
                        required
                        value={cosplayForm.character_name}
                        onChange={(e) => setCosplayForm((f) => ({ ...f, character_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Происхождение персонажа (игра/аниме) *</label>
                      <input
                        required
                        value={cosplayForm.origin}
                        onChange={(e) => setCosplayForm((f) => ({ ...f, origin: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Фото для сайта *</label>
                      <input
                        required
                        value={cosplayForm.photo}
                        onChange={(e) => setCosplayForm((f) => ({ ...f, photo: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Биография участника</label>
                      <textarea
                        value={cosplayForm.biography}
                        onChange={(e) => setCosplayForm((f) => ({ ...f, biography: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Краткое описание персонажа</label>
                      <textarea
                        value={cosplayForm.character_description}
                        onChange={(e) => setCosplayForm((f) => ({ ...f, character_description: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Ссылка на портфолио</label>
                      <input
                        value={cosplayForm.portfolio_link}
                        onChange={(e) => setCosplayForm((f) => ({ ...f, portfolio_link: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Награды и достижения</label>
                      <textarea
                        value={cosplayForm.awards}
                        onChange={(e) => setCosplayForm((f) => ({ ...f, awards: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#12121a] border border-[#1a1a24] focus:border-[#00f5ff] rounded-lg text-white"
                        rows={2}
                      />
                    </div>
                    <button type="submit" disabled={submitting} className="w-full py-2 bg-[#00f5ff] hover:bg-[#00c4cc] text-[#0a0a0f] text-white rounded-lg disabled:opacity-50">
                      {submitting ? 'Отправка...' : 'Подать заявку'}
                    </button>
                  </form>
                )}
              </div>
            )}

            <p className="mt-4 text-sm text-slate-500">Можно подать только одну заявку — либо на турнир, либо на косплей.</p>
          </>
        )}
      </div>
    </div>
  );
}
