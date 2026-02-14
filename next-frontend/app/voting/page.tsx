'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface Participant {
  id: number;
  character_name?: string;
  origin?: string;
  photo?: string;
  user?: { name?: string; nickname?: string };
  votes_count?: number;
  has_voted?: boolean;
}

export default function VotingPage() {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchParticipants();
  }, [user]);

  const fetchParticipants = async () => {
    try {
      const data = await apiClient.get<{ participants?: Participant[] }>('/voting/participants');
      setParticipants(data.participants ?? []);
    } catch {
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (participantId: number) => {
    if (!user) return;
    setVoting(participantId);
    setVoteError(null);
    try {
      await apiClient.post(`/voting/vote`, { participant_id: participantId });
      await fetchParticipants();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const msg = err?.response?.data?.message || err?.message || 'Не удалось проголосовать';
      setVoteError(msg);
    } finally {
      setVoting(null);
    }
  };

  const hasVotedAny = participants.some((p) => p.has_voted);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Войдите в аккаунт, чтобы участвовать в голосовании.</p>
          <Link href="/signin" className="text-cyan-400 hover:text-cyan-300 font-medium">Войти</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Голосование</h1>
        <p className="text-slate-400 mb-8">Выберите одного участника конкурса косплея. Голосовать можно только один раз.</p>
        {voteError && <p className="mb-4 text-red-400 text-sm">{voteError}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
          </div>
        ) : participants.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700">
            <p className="text-slate-500">Участники для голосования пока не добавлены.</p>
            <p className="text-slate-600 text-sm mt-2">Список появится после модерации заявок.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {participants.map((p) => (
              <div
                key={p.id}
                className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-500/50 transition-colors"
              >
                <div className="aspect-[4/3] bg-slate-700 flex items-center justify-center text-slate-500">
                  {p.photo ? (
                    <img src={p.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🎭</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white">
                    {p.character_name || `Участник #${p.id}`}
                  </h3>
                  {p.origin && (
                    <p className="text-slate-400 text-sm mt-1">{p.origin}</p>
                  )}
                  <p className="text-cyan-400 text-sm mt-2">
                    Голосов: {p.votes_count ?? 0}
                  </p>
                  <button
                    onClick={() => handleVote(p.id)}
                    disabled={voting !== null || p.has_voted || hasVotedAny}
                    className="mt-3 w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
                  >
                    {p.has_voted ? 'Вы проголосовали' : hasVotedAny ? 'Голос учтён' : voting === p.id ? 'Отправка...' : 'Голосовать'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-medium">← На главную</Link>
        </div>
      </div>
    </div>
  );
}
