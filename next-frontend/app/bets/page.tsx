'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const BET_STATUS: Record<string, string> = {
  pending: 'Ожидает',
  active: 'Активна',
  won: 'Выиграна',
  lost: 'Проиграна',
  returned: 'Возвращена',
  cancelled: 'Отменена',
};

export default function BetsPage() {
  const { user, refreshUserData } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [betOn, setBetOn] = useState<'team1_win' | 'team2_win'>('team1_win');
  const [amount, setAmount] = useState('');
  const [odds, setOdds] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();
      const [matchesRes, betsRes] = await Promise.all([
        fetch(`${API_URL}/bets/matches`, { credentials: 'include', headers }),
        fetch(`${API_URL}/bets`, { credentials: 'include', headers }),
      ]);
      if (matchesRes.ok) setMatches(await matchesRes.json());
      else setMatches([]);
      if (betsRes.ok) setMyBets(await betsRes.json());
      else setMyBets([]);
    } catch (e) {
      console.error(e);
      setMatches([]);
      setMyBets([]);
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/bets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          match_id: selectedMatch.id,
          bet_on: betOn,
          coins_amount: parseInt(amount, 10),
          odds: parseFloat(odds),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setMyBets((b) => [json, ...b]);
        setSelectedMatch(null);
        setAmount('');
        setOdds('');
        refreshUserData?.();
      } else {
        setError(json.message || 'Ошибка');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Войдите для размещения ставок</p>
      </div>
    );
  }

  const balance = user.balance ?? 0;
  const maxAmount = Math.min(balance, 10000);

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Ставки</h1>
        <div className="mb-6 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
          <span className="font-medium text-slate-300">Ваш баланс: </span>
          <span className="font-bold text-amber-400">{balance} монет</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Доступные матчи</h2>
                <div className="space-y-3">
                  {matches.length === 0 ? (
                    <p className="text-gray-500">Нет доступных матчей</p>
                  ) : (
                    matches.map((m) => (
                      <div
                        key={m.id}
                        className="bg-slate-800 rounded-lg p-4 border border-slate-600 cursor-pointer hover:border-cyan-500/50 transition"
                        onClick={() => {
                          setSelectedMatch(m);
                          setBetOn('team1_win');
                          setOdds('1.5');
                        }}
                      >
                        <p className="text-xs text-slate-400">{m.game?.name}</p>
                        <p className="font-medium text-white">{m.team1?.team_name || m.team1?.display_name || 'TBD'} vs {m.team2?.team_name || m.team2?.display_name || 'TBD'}</p>
                        <p className="text-sm text-slate-400">{new Date(m.start_time).toLocaleString('ru-RU')}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Мои ставки</h2>
                <div className="space-y-3">
                  {myBets.length === 0 ? (
                    <p className="text-gray-500">Пока нет ставок</p>
                  ) : (
                    myBets.map((b) => (
                      <div key={b.id} className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                        <p className="text-sm text-slate-300">{b.match?.team1?.team_name || b.match?.team1?.display_name} vs {b.match?.team2?.team_name || b.match?.team2?.display_name}</p>
                        <p className="text-sm">Ставка: {b.coins_amount} монет (x{b.odds})</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          b.status === 'won' ? 'bg-green-100' : b.status === 'lost' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {BET_STATUS[b.status] || b.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {selectedMatch && (
              <div className="mt-8 bg-slate-800 rounded-xl p-6 border-2 border-cyan-500/50">
                <h3 className="text-lg font-bold text-white mb-4">Разместить ставку</h3>
                <p className="text-slate-400 mb-4">{selectedMatch.team1?.team_name || selectedMatch.team1?.display_name} vs {selectedMatch.team2?.team_name || selectedMatch.team2?.display_name}</p>
                <form onSubmit={placeBet} className="space-y-4">
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">На кого ставите?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" checked={betOn === 'team1_win'} onChange={() => setBetOn('team1_win')} />
                        {selectedMatch.team1?.team_name || selectedMatch.team1?.display_name}
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" checked={betOn === 'team2_win'} onChange={() => setBetOn('team2_win')} />
                        {selectedMatch.team2?.team_name || selectedMatch.team2?.display_name}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Сумма (макс. {maxAmount})</label>
                    <input
                      type="number"
                      min={1}
                      max={maxAmount}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Коэффициент</label>
                    <input
                      type="number"
                      step="0.01"
                      min={1}
                      max={100}
                      value={odds}
                      onChange={(e) => setOdds(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-cyan-600 text-white rounded-lg disabled:opacity-50">
                      {submitting ? '...' : 'Поставить'}
                    </button>
                    <button type="button" onClick={() => setSelectedMatch(null)} className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg">
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
