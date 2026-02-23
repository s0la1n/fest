'use client';

import { useState } from 'react';
import Link from 'next/link';
import PhotoPlaceholder from '@/components/PhotoPlaceholder';

const FAQ = [
  { q: 'Что нужно для участия в конкурсе?', a: 'Билет типа «Косплей» и регистрация участника организатором. Костюм должен быть самодельным или значительно доработанным.' },
  { q: 'Как участвовать?', a: 'Участники регистрируются организатором конкурса. Указывается один персонаж, откуда он, описание, фото и по желанию ссылки на другие работы.' },
  { q: 'Как поменять тип билета на «Косплей»?', a: 'Обратитесь в поддержку фестиваля.' },
  { q: 'Когда объявляют победителей?', a: 'Итоги голосования и решения жюри объявляются на сцене фестиваля. Расписание — в разделе «Расписание».' },
];

export default function CosplayPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-[#0a0a0f] text-slate-200 min-h-screen">
      {/* Баннер */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-[#ff00ff]/20 text-[#ff00ff] rounded text-sm mb-4">КОНКУРС</span>
              <h1 className="text-4xl font-bold text-white mb-4">КОСПЛЕЙ-КОНКУРС 2026</h1>
              <p className="text-slate-400 mb-6">Сделай косплей на любимого персонажа и выиграй главный приз 500 000 ₽</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/voting" className="px-8 py-4 bg-[#ff00ff] hover:bg-[#ff66ff] text-white rounded-lg font-semibold transition" style={{ boxShadow: '0 0 20px rgba(255,0,255,0.4)' }}>
                  ГОЛОСОВАТЬ ЗА УЧАСТНИКОВ
                </Link>
              </div>
            </div>
            <div className="relative min-h-[320px] rounded-2xl overflow-hidden border-2 border-[#ff00ff]/30">
              <img 
                src="/images/cosplay/photo.jpg" 
                alt="Косплей конкурс 2026" 
                className="w-full h-full object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.target as HTMLImageElement;
                  target.style.backgroundColor = '#1a1a2e';
                  target.style.display = 'flex';
                  target.style.alignItems = 'center';
                  target.style.justifyContent = 'center';
                  target.innerHTML = '<span class="text-slate-400">Изображение не загрузилось</span>';
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={{
                  background: 'radial-gradient(circle at center, transparent 30%, rgba(255,0,255,0.1) 70%)'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Что такое косплей */}
      <section className="py-16 px-4 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Что такое косплей</h2>
          <p className="text-slate-400 mb-4">
            Косплей — это перевоплощение в персонажа из игр, аниме, кино или комиксов. Участники создают костюмы и образы, отыгрывают характер героя и выступают на сцене перед зрителями и жюри.
          </p>
          <p className="text-slate-400">
            На нашем фестивале косплей-конкурс собирает мастеров со всего региона. Мы оцениваем качество костюма, сходство с персонажем и сценическое выступление.
          </p>
        </div>
      </section>

      {/* Победители прошлого года */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Победители прошлого года</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#12121a] rounded-xl overflow-hidden border border-[#1a1a24]">
                <PhotoPlaceholder ratio="tall" className="min-h-[280px]" />
                <div className="p-4">
                  <p className="font-medium text-white">Участник {i}</p>
                  <p className="text-slate-500 text-sm">Персонаж — Игра / Аниме</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Правила регистрации на конкурс */}
      <section className="py-16 px-4 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Правила регистрации на конкурс</h2>
          <ul className="space-y-4 text-slate-400">
            <li>• Участники регистрируются организатором: персонаж, откуда он (игра, аниме, фильм), описание, награды, фото и ссылки на работы.</li>
            <li>• Костюм должен быть самодельным или значительно доработанным. Качество и сходство с персонажем учитываются жюри.</li>
          </ul>
          <div className="mt-8">
            <Link href="/voting" className="inline-block px-6 py-3 bg-[#ff00ff] hover:bg-[#ff66ff] text-white rounded-lg font-medium transition" style={{ boxShadow: '0 0 15px rgba(255,0,255,0.3)' }}>
              Участники и голосование
            </Link>
          </div>
        </div>
      </section>

      {/* Фотографии косплееров */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Фотографии косплееров</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <PhotoPlaceholder key={i} ratio="square" className="min-h-[180px]" />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Частые вопросы</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-[#12121a] rounded-lg border border-[#1a1a24] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-4 py-3 text-left flex justify-between items-center text-white font-medium"
                >
                  {item.q}
                  <span className="text-[#ff00ff]">{openFaq === i ? '−' : '+'}</span>
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

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Покажи свой косплей</h2>
        <p className="text-slate-400 mb-6">Участники конкурса и голосование — в разделе «Голосование»</p>
        <Link href="/buy-ticket" className="inline-block px-10 py-4 bg-[#ff00ff] hover:bg-[#ff66ff] text-white rounded-lg font-semibold transition" style={{ boxShadow: '0 0 20px rgba(255,0,255,0.4)' }}>
          КУПИТЬ БИЛЕТ
        </Link>
      </section>
    </div>
  );
}
