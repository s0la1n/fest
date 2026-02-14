'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function OrganizerTournamentApplicationsPage() {
  const { user, hasRole } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && hasRole('tournament_organizer')) {
      apiClient.get<any[]>('/organizer/tournament/applications').then(setList).catch(() => setList([])).finally(() => setLoading(false));
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
        <h1 className="text-3xl font-bold text-white mb-8">Заявки на турнир</h1>
        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
        ) : list.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
            <p className="text-slate-500">Заявок пока нет.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {list.map((app: any) => (
              <li key={app.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex justify-between items-center">
                <span className="text-white font-medium">{app.team_name ?? `Заявка #${app.id}`}</span>
                <span className="text-slate-400 text-sm">{app.status ?? '—'}</span>
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
