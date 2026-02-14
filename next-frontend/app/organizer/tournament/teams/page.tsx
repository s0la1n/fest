'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function OrganizerTournamentTeamsPage() {
  const { user, hasRole } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && hasRole('tournament_organizer')) {
      apiClient.get<any[]>('/organizer/tournament/teams').then((d: any) => setTeams(d.teams ?? d ?? [])).catch(() => setTeams([])).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, hasRole]);

  if (!user || !hasRole('tournament_organizer')) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4">
        <p className="text-slate-400">Доступ только для организатора турнира.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Команды турнира</h1>
        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
        ) : teams.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
            <p className="text-slate-500">Команд пока нет.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {teams.map((t: any) => (
              <li key={t.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <span className="text-white font-medium">{t.team_name ?? t.name ?? `Команда #${t.id}`}</span>
                {t.tag && <span className="text-slate-400 text-sm ml-2">({t.tag})</span>}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8">
          <Link href="/organizer/tournament" className="text-cyan-400 hover:text-cyan-300 font-medium">← К разделу орг. турнира</Link>
        </div>
      </div>
    </div>
  );
}
