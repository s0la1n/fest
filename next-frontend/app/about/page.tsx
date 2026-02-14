'use client';

import { useState } from 'react';
import Link from 'next/link';
import PhotoPlaceholder from '@/components/PhotoPlaceholder';

const values = [
  { title: 'Доступность', desc: 'Делаем игровую культуру открытой для всех' },
  { title: 'Инновации', desc: 'Внедряем передовые технологии в ивентах' },
  { title: 'Сообщество', desc: 'Объединяем геймеров, разработчиков и фанатов' },
  { title: 'Творчество', desc: 'Поощряем самовыражение через игры и косплей' },
];

const faqItems = [
  { q: 'С какого возраста можно посещать фестиваль?', a: 'Фестиваль доступен для всех возрастов! Для посетителей до 14 лет требуется сопровождение взрослых.' },
  { q: 'Можно ли прийти в косплее?', a: 'Да, косплей приветствуется! Есть гримерка и комната для переодевания.' },
  { q: 'Есть ли парковка?', a: 'Да, у Тукаев-центра парковка на 500 мест.' },
];

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <div className="bg-[#0a0a0f] text-slate-200 min-h-screen">
      {/* Hero-блок */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">ИГРОВОЙ ЛАБИРИНТ: 8 ЛЕТ ИСТОРИИ</h1>
          <p className="text-slate-400 mb-8">От локальной встречи энтузиастов до крупнейшего игрового фестиваля региона</p>
          <Link href="/buy-ticket" className="inline-block px-8 py-4 bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] rounded-lg font-semibold transition" style={{ boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}>
            ПРИСОЕДИНИТЬСЯ 2026
          </Link>
        </div>
      </section>

      {/* Главное фото */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <PhotoPlaceholder ratio="wide" className="min-h-[280px]" />
        </div>
      </section>

      {/* "Миссии" конкурса */}
      <section className="py-16 px-4 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">НАША МИССИЯ</h2>
          <p className="text-slate-400 mb-12 max-w-3xl">
            Мы создаём пространство, где игровая культура оживает. Это точка сборки для разработчиков, киберспортсменов, косплееров и всех, кто верит, что игры могут менять мир.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-[#12121a] rounded-xl p-6 border border-[#00f5ff]/20">
                <h3 className="font-semibold text-[#00f5ff] mb-2">{v.title}</h3>
                <p className="text-slate-400 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* История фестиваля */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">ИСТОРИЯ ФЕСТИВАЛЯ</h2>
          <div className="space-y-12">
            {[2018, 2020, 2023, 2026].map((year, i) => (
              <div key={year} className="flex flex-col md:flex-row gap-8 items-start">
                <PhotoPlaceholder ratio="video" className="w-full md:w-80 shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-[#00f5ff] mb-2">{year}</h3>
                  <p className="text-slate-400">
                    Ключевое событие года: рост числа участников, новые дисциплины и партнёры.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Команда работников фестиваля */}
      <section className="py-16 px-4 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">КОМАНДА МЕЧТЫ</h2>
          <p className="text-slate-400 mb-8">Люди, которые превращают идеи в реальность</p>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { name: 'Самира Нурутлинова', role: 'Основатель и CEO' },
              { name: 'Мария Соколова', role: 'Креативный директор' },
              { name: 'Наиля Натфуллина', role: 'Менеджер по коммуникациям' },
              { name: 'Дмитрий Поляков', role: 'Разработчик' },
            ].map((m, i) => (
              <div key={i} className="flex gap-6 bg-[#12121a] rounded-xl p-6 border border-[#1a1a24]">
                <PhotoPlaceholder ratio="square" className="w-24 h-24 shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">{m.name}</h3>
                  <p className="text-[#00f5ff] text-sm">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ</h2>
          <div className="space-y-2">
            {faqItems.map((faq, i) => (
              <div
                key={i}
                className="bg-[#12121a] rounded-lg border border-[#1a1a24] overflow-hidden cursor-pointer hover:border-[#00f5ff]/50 transition"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <h3 className="font-medium text-white p-4">{faq.q}</h3>
                {openFaq === i && <p className="text-slate-400 text-sm px-4 pb-4">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
