'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function OrganizerCosplayPage() {
  const { user, hasRole } = useAuth();

  if (!user || !hasRole('cosplay_organizer')) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4">
        <p className="text-slate-400">Доступ только для организатора конкурса косплея.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Организатор конкурса косплея</h1>
        <p className="text-slate-400 mb-8">Заявки, участники и распределение мест</p>

        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/organizer/cosplay/applications"
            className="block p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white mb-2">Заявки</h2>
            <p className="text-slate-400 text-sm">Рассмотрение заявок, принять или отклонить</p>
          </Link>
          <Link
            href="/organizer/cosplay/participants"
            className="block p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white mb-2">Участники</h2>
            <p className="text-slate-400 text-sm">Информация об участниках конкурса</p>
          </Link>
          <Link
            href="/organizer/cosplay/voting"
            className="block p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white mb-2">Голосование / места</h2>
            <p className="text-slate-400 text-sm">Распределение мест среди участников</p>
          </Link>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-medium">← На главную</Link>
        </div>
      </div>
    </div>
  );
}
