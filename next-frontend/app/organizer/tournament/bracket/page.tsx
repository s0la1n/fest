'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function OrganizerTournamentBracketPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Турнирная сетка</h1>
        <p className="text-slate-400 mb-8">Указание победителей матчей (управление результатами)</p>
        <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
          <p className="text-slate-500">Сетка и управление матчами доступны также на странице <Link href="/schedule" className="text-cyan-400 hover:text-cyan-300">Расписание</Link>. Функция сохранения результата организатором будет подключена к API.</p>
        </div>
        <div className="mt-8">
          <Link href="/organizer/tournament" className="text-cyan-400 hover:text-cyan-300 font-medium">← К разделу орг. турнира</Link>
        </div>
      </div>
    </div>
  );
}
