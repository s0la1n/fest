'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const GAMES = [
  { id: 'cs2', name: 'Counter-Strike 2', label: 'CS2', video: '/videos/cs2.mp4' },
  { id: 'dota2', name: 'Dota 2', label: 'Dota 2', video: '/videos/dota2.mp4' },
  { id: 'valorant', name: 'Valorant', label: 'VAL', video: '/videos/valorant.mp4' },
];

const SPONSORS = [
  { name: 'Intel', url: 'https://intel.com' },
  { name: 'NVIDIA', url: 'https://nvidia.com' },
  { name: 'ASUS ROG', url: 'https://asus.com' },
  { name: 'HyperX', url: 'https://hyperx.com' },
  { name: 'Red Bull', url: 'https://redbull.com' },
  { name: 'Twitch', url: 'https://twitch.tv' },
];

const ZONES = [
  { id: 1, name: 'Главная сцена', desc: 'Концерты, шоу, награждение', color: '#FF6B6B', x: 15, y: 5, w: 35, h: 20 },
  { id: 2, name: 'Киберспорт', desc: 'Турниры Dota 2, CS2, Valorant', color: '#4ECDC4', x: 55, y: 5, w: 35, h: 25 },
  { id: 3, name: 'Косплей', desc: 'Сцена, гримёрки, фото', color: '#FFD166', x: 5, y: 35, w: 25, h: 25 },
  { id: 4, name: 'Инди-зона', desc: 'Демо игр, воркшопы', color: '#06D6A0', x: 35, y: 35, w: 30, h: 30 },
  { id: 5, name: 'Настолки', desc: 'Мафия, Magic, Манчкин', color: '#118AB2', x: 70, y: 40, w: 25, h: 25 },
  { id: 6, name: 'Фудкорт', desc: 'Еда и напитки', color: '#EF476F', x: 10, y: 70, w: 30, h: 25 },
  { id: 7, name: 'Мерч', desc: 'Атрибутика', color: '#073B4C', x: 45, y: 72, w: 25, h: 20 },
  { id: 8, name: 'VR-зона', desc: 'Виртуальная реальность', color: '#7209B7', x: 75, y: 68, w: 20, h: 25 },
];

export default function HomePage() {
  const [hoverGame, setHoverGame] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<number | null>(null);

  return (
    <div className="bg-[#0a0a0f] text-slate-200">
      {/* Hero-блок */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f5ff]/5 via-transparent to-[#ff00ff]/5" />
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4" style={{ textShadow: '0 0 30px rgba(0,245,255,0.3)' }}>ИГРОВОЙ ЛАБИРИНТ</h1>
          <p className="text-xl text-[#00f5ff] mb-2">Казань — Тукаев Центр</p>
          <time className="block text-slate-400 mb-8" dateTime="2026-03-29">29.03.2026</time>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/about" className="px-8 py-4 border-2 border-[#00f5ff] text-[#00f5ff] hover:bg-[#00f5ff]/10 rounded-lg font-semibold transition" style={{ boxShadow: '0 0 15px rgba(0,245,255,0.3)' }}>
              ПОДРОБНЕЕ
            </Link>
          </div>
        </div>
      </section>

      {/* Турнир с тремя карточками игр и видео */}
      <section className="py-16 px-4 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Киберспортивный турнир</h2>
          <p className="text-slate-400 mb-8 max-w-2xl">
            Здесь решают не слова, а скилл. Присоединяйся к главному киберспортивному событию сезона!
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {GAMES.map((g) => (
              <Link
                key={g.id}
                href="/tournament"
                className="relative block bg-[#12121a] rounded-xl border border-[#00f5ff]/30 overflow-hidden aspect-video group hover:border-[#00f5ff] transition" style={{ boxShadow: '0 0 15px rgba(0,245,255,0.1)' }}
                onMouseEnter={() => setHoverGame(g.id)}
                onMouseLeave={() => setHoverGame(null)}
              >
                {hoverGame === g.id ? (
                  <video
                    src={g.video}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    title={g.name}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[#00f5ff] mb-2" style={{ textShadow: '0 0 20px rgba(0,245,255,0.5)' }}>
                      {g.label}
                    </span>
                    <span className="font-semibold text-white">{g.name}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
          <Link href="/tournament" className="inline-block mt-6 px-8 py-4 bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] rounded-lg font-semibold transition" style={{ boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}>
            УЧАСТВОВАТЬ
          </Link>
        </div>
      </section>

      {/* About preview */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">О фестивале</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-[#12121a] border border-[#1a1a24] rounded-lg aspect-video flex items-center justify-center text-slate-500">photo</div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Заголовок</h3>
              <p className="text-slate-400">Игровой Лабиринт — крупнейшее событие региона для геймеров и косплееров.</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/about" className="inline-block px-6 py-3 border-2 border-[#00f5ff] text-[#00f5ff] rounded-lg hover:bg-[#00f5ff]/10 transition">
              ПОДРОБНЕЕ
            </Link>
          </div>
        </div>
      </section>

      {/* Cosplay */}
      <section className="py-16 px-4 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          <div className="bg-[#12121a] border border-[#ff00ff]/30 rounded-lg w-full md:w-80 h-80 flex items-center justify-center text-slate-500 shrink-0">photo</div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Косплей-конкурс</h2>
            <p className="text-slate-400 mb-6">Превратись в любимого персонажа и выиграй главный приз.</p>
            <Link href="/cosplay" className="inline-block px-8 py-4 bg-[#ff00ff] text-white hover:bg-[#ff66ff] rounded-lg font-semibold transition" style={{ boxShadow: '0 0 20px rgba(255,0,255,0.4)' }}>
              ПОДРОБНЕЕ
            </Link>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="py-16 px-4 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Спонсоры</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {SPONSORS.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#12121a] border border-[#1a1a24] rounded-xl px-8 py-6 hover:border-[#00f5ff]/50 transition min-w-[120px] text-center"
              >
                <span className="text-slate-400 font-medium">{s.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Festival map */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">План фестиваля</h2>
          <p className="text-slate-400 text-center mb-8">Наведите на название зоны — подсветится на карте</p>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-[#12121a] rounded-xl p-4 border border-[#1a1a24]">
              <svg viewBox="0 0 100 100" className="w-full h-auto">
                {ZONES.map((z) => (
                  <rect
                    key={z.id}
                    x={z.x}
                    y={z.y}
                    width={z.w}
                    height={z.h}
                    fill={activeZone === z.id ? z.color : `${z.color}40`}
                    stroke={z.color}
                    strokeWidth={activeZone === z.id ? 1 : 0.3}
                    opacity={activeZone === z.id || !activeZone ? 1 : 0.4}
                  />
                ))}
              </svg>
            </div>
            <div className="space-y-3">
              {ZONES.map((z) => (
                <div
                  key={z.id}
                  onMouseEnter={() => setActiveZone(z.id)}
                  onMouseLeave={() => setActiveZone(null)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${activeZone === z.id ? 'border-[#00f5ff] bg-[#00f5ff]/10' : 'border-[#1a1a24] bg-[#12121a]'}`}
                >
                  <h3 className="font-semibold text-white" style={{ color: activeZone === z.id ? undefined : z.color }}>{z.name}</h3>
                  <p className="text-sm text-slate-400">{z.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Schedule CTA */}
      <section className="py-16 px-4 bg-[#0d0d14] text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Расписание</h2>
        <p className="text-slate-400 mb-6">5 дней фестиваля</p>
        <Link href="/schedule" className="inline-block px-8 py-4 bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] rounded-lg font-semibold transition" style={{ boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}>
          СМОТРЕТЬ РАСПИСАНИЕ
        </Link>
      </section>
    </div>
  );
}
