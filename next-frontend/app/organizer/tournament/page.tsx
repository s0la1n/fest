'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function OrganizerTournamentPage() {
  const { user, hasRole } = useAuth();

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
        <h1 className="text-3xl font-bold text-white mb-2">Организатор турнира</h1>
        <p className="text-slate-400 mb-8">Заявки, команды и турнирная сетка</p>

        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/organizer/tournament/applications"
            className="block p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white mb-2">Заявки</h2>
            <p className="text-slate-400 text-sm">Рассмотрение заявок команд, принять или отклонить</p>
          </Link>
          <Link
            href="/organizer/tournament/teams"
            className="block p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white mb-2">Команды</h2>
            <p className="text-slate-400 text-sm">Информация о командах турнира</p>
          </Link>
          <Link
            href="/organizer/tournament/bracket"
            className="block p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white mb-2">Турнирная сетка</h2>
            <p className="text-slate-400 text-sm">Указание победителей матчей</p>
          </Link>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-medium">← На главную</Link>
        </div>
      </div>
    </div>
  );
}
