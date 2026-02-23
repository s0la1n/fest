'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

const GAMES_FALLBACK = [
  { id: 1, slug: 'cs2', name: 'Counter-Strike 2', description: 'Командный тактический шутер от Valve.', official_url: 'https://www.counter-strike.net' },
  { id: 2, slug: 'dota2', name: 'Dota 2', description: 'Многопользовательская командная игра в жанре MOBA.', official_url: 'https://www.dota2.com' },
  { id: 3, slug: 'valorant', name: 'Valorant', description: 'Тактический шутер 5 на 5 от Riot Games.', official_url: 'https://playvalorant.com' },
];

const REGISTRATION_RULES = [
  'Команды хранятся в базе и формируются организатором турнира.',
  'Указывается название команды, тег, логотип, город и состав. Участникам не нужен аккаунт на сайте.',
];

const TWITCH_CHANNEL = 'festival_stream';

const FAQ = [
  { q: 'Как посмотреть команды турнира?', a: 'На этой странице выберите игру и посмотрите зарегистрированные команды. Расписание и сетка — в разделе «Расписание».' },
  { q: 'Где смотреть трансляцию?', a: 'Трансляция матчей ведётся на нашем канале в Twitch. Ссылка на стрим — в блоке выше.' },
  { q: 'Сколько человек в команде?', a: 'В каждой команде может быть до 5 игроков включая капитана.' },
];

export default function TournamentPage() {
  const [games, setGames] = useState<typeof GAMES_FALLBACK>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [modalTeam, setModalTeam] = useState<any | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [twitchParent, setTwitchParent] = useState('localhost');
  useEffect(() => {
    if (typeof window !== 'undefined') setTwitchParent(window.location.hostname);
  }, []);
  const twitchEmbedUrl = `https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${twitchParent}`;

  useEffect(() => {
    apiClient.get<typeof GAMES_FALLBACK>('/games').then(setGames).catch(() => setGames(GAMES_FALLBACK));
  }, []);

  useEffect(() => {
    const gid = selectedGameId ?? games[0]?.id;
    if (gid) {
      apiClient.get<any[]>(`/teams/${gid}`).then((d) => (Array.isArray(d) ? d : [])).catch(() => []).then(setTeams);
    } else {
      setTeams([]);
    }
  }, [selectedGameId, games]);

  const displayGames = games.length ? games : GAMES_FALLBACK;
  const currentGameId = selectedGameId ?? displayGames[0]?.id ?? 1;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {/* Баннер */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f5ff]/10 via-transparent to-[#ff00ff]/5" />
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">КИБЕРСПОРТИВНЫЙ ТУРНИР</h1>
          <p className="text-xl text-[#00f5ff] mb-2">Игровой Лабиринт 2026</p>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Команды формируются организатором. CS2, Dota 2, Valorant — одна сцена, один фестиваль.
          </p>
          <Link href="/schedule" className="inline-block px-8 py-4 bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] rounded-lg font-semibold transition" style={{ boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}>
            РАСПИСАНИЕ И СЕТКА
          </Link>
        </div>
      </section>

      {/* Игры: описание и ссылка на официальный сайт */}
      <section className="py-16 px-4 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Игры турнира</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {displayGames.map((g) => (
              <div key={g.id} className="bg-[#12121a] rounded-xl p-6 border border-[#1a1a24] hover:border-[#00f5ff]/50 transition">
                <h3 className="text-lg font-semibold text-white mb-2">{g.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{g.description || 'Официальная дисциплина турнира.'}</p>
                <a
                  href={(g as any).official_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00f5ff] hover:text-[#00c4cc] text-sm font-medium"
                >
                  Официальный сайт →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Правила регистрации команды */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Правила регистрации команды</h2>
          <ul className="space-y-4 text-slate-400">
            {REGISTRATION_RULES.map((rule, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-[#00f5ff] shrink-0">{(i + 1)}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link href="/schedule" className="inline-block px-6 py-3 bg-[#12121a] border border-[#00f5ff]/30 hover:bg-[#00f5ff]/10 text-[#00f5ff] rounded-lg font-medium">
              Расписание и турнирная сетка
            </Link>
          </div>
        </div>
      </section>

      {/* Карточки команд: переключение между играми */}
      <section className="py-16 px-4 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Команды на турнир</h2>
          <p className="text-slate-400 mb-6">Выберите игру и посмотрите зарегистрированные команды</p>
          <div className="flex flex-wrap gap-3 mb-8">
            {displayGames.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGameId(g.id)}
                className={`px-6 py-3 rounded-xl font-medium transition ${
                  currentGameId === g.id ? 'bg-[#00f5ff] text-[#0a0a0f]' : 'bg-[#12121a] text-slate-300 hover:bg-[#16161f] border border-[#1a1a24]'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teams.map((t) => (
              <button
                key={t.id}
                onClick={() => setModalTeam(t)}
                className="bg-[#12121a] rounded-xl p-4 border border-[#1a1a24] hover:border-[#00f5ff]/50 text-left transition"
              >
                <p className="font-semibold text-white">
                  {t.team_name || t.display_name || 'Команда'}
                </p>
                <p className="text-slate-500 text-sm mt-1">Нажмите для состава</p>
              </button>
            ))}
          </div>
          {teams.length === 0 && (
            <div className="text-center py-12 text-slate-500">Пока нет команд для выбранной игры</div>
          )}
        </div>
      </section>

      {/* Трансляция на Twitch */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Трансляция на Twitch</h2>
          <p className="text-slate-400 mb-6">
            Следите за матчами в прямом эфире на нашем канале. Расписание стримов смотрите в разделе «Расписание».
          </p>
          <div className="bg-[#12121a] rounded-xl overflow-hidden border border-[#1a1a24] aspect-video max-w-4xl">
            <iframe
              src={twitchEmbedUrl}
              title="Twitch"
              className="w-full h-full"
              allowFullScreen
            />
          </div>
          <p className="mt-4 text-slate-500 text-sm">
            Канал: <a href={`https://twitch.tv/${TWITCH_CHANNEL}`} target="_blank" rel="noopener noreferrer" className="text-[#00f5ff] hover:text-[#00c4cc]">twitch.tv/{TWITCH_CHANNEL}</a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Частые вопросы</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="bg-[#12121a] rounded-lg border border-[#1a1a24] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-4 py-3 text-left flex justify-between items-center text-white font-medium"
                >
                  {item.q}
                  <span className="text-[#00f5ff]">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3 text-slate-400 text-sm border-t border-[#1a1a24] pt-2">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="py-12 px-4 text-center">
        <Link href="/schedule" className="inline-block px-6 py-3 bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] rounded-lg font-medium transition" style={{ boxShadow: '0 0 15px rgba(0,245,255,0.3)' }}>
          Турнирная сетка и расписание
        </Link>
      </div>

      {modalTeam && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setModalTeam(null)}>
          <div className="bg-[#12121a] rounded-xl p-6 max-w-md w-full border border-[#00f5ff]/30" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">
              {modalTeam.team_name || 'Состав команды'}
            </h3>
            <ul className="space-y-2">
              {modalTeam.players?.map((p: any) => (
                <li key={p.id} className="flex justify-between text-slate-300">
                  <span>{p.display_name ?? 'Игрок'}</span>
                  <span className="text-[#00f5ff] text-sm">{p.role === 'captain' ? 'Капитан' : 'Игрок'}</span>
                </li>
              ))}
            </ul>
            {(!modalTeam.players || modalTeam.players.length === 0) && (
              <p className="text-slate-500">Состав не указан</p>
            )}
            <button onClick={() => setModalTeam(null)} className="mt-6 w-full py-2 bg-[#00f5ff]/20 border border-[#00f5ff]/30 text-[#00f5ff] rounded-lg hover:bg-[#00f5ff]/30">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
