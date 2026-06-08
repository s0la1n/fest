'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import FAQ from '@/components/FAQ';
import './cosplay.css';

const WINNERS = [
  { 
    place: 1, 
    name: 'Алексей Воронов', 
    character: 'Спрингтрап', 
    from: 'Five Nights at Freddy\'s',
    image: '/images/cosplay/winner1.webp',
    placeClass: 'first',
    placeText: '1 МЕСТО'
  },
  { 
    place: 2, 
    name: 'Мария Дятлова', 
    character: 'Мэй', 
    from: 'It Takes Two',
    image: '/images/cosplay/winner2.webp',
    placeClass: 'second',
    placeText: '2 МЕСТО'
  },
  { 
    place: 3, 
    name: 'Дарья Соколова', 
    character: 'Чика', 
    from: 'Five Nights at Freddy\'s',
    image: '/images/cosplay/winner3.webp  ',
    placeClass: 'third',
    placeText: '3 МЕСТО'
  },
];

// Данные для галереи
const GALLERY_IMAGES = [
  { id: 1, src: '/images/cosplay/1.webp', alt: 'Бибоп и Рокстеди (Черепашки-ниндзя)' },
  { id: 2, src: '/images/cosplay/2.webp', alt: 'Девятый (Девять)' },
  { id: 3, src: '/images/cosplay/3.webp', alt: 'Собака (Майнкрафт)' },
  { id: 4, src: '/images/cosplay/4.webp', alt: 'Летучая мышь Руж (Sonic the Hedgehog)' },
  { id: 5, src: '/images/cosplay/5.webp', alt: 'Рэйвен (Юные титаны)' },
  { id: 6, src: '/images/cosplay/6.webp', alt: 'Декора (Культура)' },
  { id: 7, src: '/images/cosplay/7.webp', alt: 'Шпинель (Вселенная Стивена)' },
  { id: 8, src: '/images/cosplay/8.webp', alt: 'Шактрон (Гравити Фолз)' },
  { id: 9, src: '/images/cosplay/9.webp', alt: 'Химико Тогу (Моя геройская академия)' },
  { id: 10, src: '/images/cosplay/10.webp', alt: 'Дедпул (Дедпул)' },
  { id: 11, src: '/images/cosplay/11.webp', alt: 'Зомби (Растения против Зомби)' },
  { id: 12, src: '/images/cosplay/12.webp', alt: 'Элиас Эйнсворт и Тисэ Хатори (Невеста чародея)' },
  { id: 13, src: '/images/cosplay/13.webp', alt: 'Сержант Тамора Джин Калхун (Ральф)' },
  { id: 14, src: '/images/cosplay/14.webp', alt: 'Эмили и Чарли (Отель Хазбин)' },
  { id: 15, src: '/images/cosplay/15.webp', alt: 'Зомби (Лего) и Бирус (Dragon Ball)' },
  { id: 16, src: '/images/cosplay/16.webp', alt: 'Енот Ракета (Стражи Галактики)' },
];

const REGISTRATION_RULES = [
  'Для подачи заявки необходимо написать письмо на официальную почту фестиваля: cosplay@gamelabirint.ru',
  'Письмо должно быть оформлено строго по прикреплённому ниже шаблону. Заявки в свободной форме не рассматриваются.',
  'Костюм должен быть самодельным или значительно доработанным. Магазинные костюмы не допускаются к конкурсу.',
  'Организатор рассматривает заявку в течение 3 рабочих дней и отправляет ответ с решением: одобрение или отказ с указанием причины.',
  'Количество участников ограничено. Заявки принимаются до 20 июля 2026 года.',
];

const cosplayFaqItems = [
  { q: 'Что нужно для участия в конкурсе?', a: 'Купленный билет на фестиваль и регистрация участника организатором. Костюм должен быть самодельным или значительно доработанным.' },
  { q: 'Как участвовать?', a: 'Участники регистрируются организатором конкурса. Указывается один персонаж, откуда он, описание, фото и по желанию ссылки на другие работы.' },
  { q: 'Когда объявляют победителей?', a: 'Итоги голосования и решения жюри объявляются на сцене фестиваля. Расписание — в разделе «Расписание».' },
  { q: 'Как оцениваются работы?', a: 'Оценка состоит из двух частей: 50% — голосование зрителей, 50% — оценка профессионального жюри.' },
  { q: 'Какие призы?', a: 'Призовой фонд конкурса составляет 300 000 рублей. 1 место — 150 000 ₽, 2 место — 90 000 ₽, 3 место — 60 000 ₽. Также предусмотрены призы от партнёров.' },
  { q: 'Можно ли участвовать в нескольких образах?', a: 'Нет, каждый участник может заявить только один образ. Это обеспечивает честность конкурса.' },
  { q: 'Что нужно иметь в день выступления?', a: 'С собой нужно иметь билет, паспорт, готовый костюм и трек для выступления (если он нужен).' },
];

const TEMPLATE = `Тема письма: ЗАЯВКА НА КОСПЛЕЙ-КОНКУРС | [НИКНЕЙМ УЧАСТНИКА]

Тело письма:

=== ЗАЯВКА НА УЧАСТИЕ В КОСПЛЕЙ-КОНКУРСЕ "ИГРОВОЙ ЛАБИРИНТ 2026" ===

1. ФИО участника (полностью): ________________
2. Никнейм/псевдоним: ________________
3. Контактный телефон: ________________
4. VK/MAX: ________________
5. Город/регион: ________________

=== ИНФОРМАЦИЯ О КОСТЮМЕ ===

6. Персонаж: ________________
7. Источник (игра/аниме/фильм): ________________
8. Описание костюма (материалы, время создания и т.д.): ________________
9. Фото работы (ссылка на альбом или прикрепить файл): ________________
10. Ссылки на портфолио (при наличии): ________________

=== ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ ===

11. Есть ли опыт участия в конкурсах? (да/нет, если да — указать какие): ________________
12. Нужна ли помощь с проживанием? (да/нет): ________________
13. Будет ли сценическое выступление? (да/нет, если да — описание): ________________
14. Согласны ли с правилами конкурса? (да/нет): ________________`;

export default function CosplayPage() {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

  const openModal = (image: { src: string; alt: string }) => {
    setSelectedImage(image);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="cosplay-page">
      {/* Hero-блок */}
      <section className="hero-cosplay-section">
        <div className="hero-background"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">КОСПЛЕЙ-КОНКУРС</h1>
            <div className='hero-description-back'>
              <p className="hero-description">
                Сделай косплей на любимого персонажа и выиграй главный приз 300 000 ₽
              </p>
            </div>
            <Link href="/buy-ticket" className="btn-blue">
              ГОЛОСОВАТЬ
            </Link>
          </div>
          <div className="hero-image">
            <div className="cosplay-image"></div>
          </div>
        </div>
      </section>

      {/* Что такое косплей */}
      <section className="section-pixel">
        <div className="container-pixel">
          <h2 className="section-title">ЧТО ТАКОЕ КОСПЛЕЙ</h2>
          <p className="section-subtitle">Искусство перевоплощения</p>
          <div className="description-text">
            <p>
              Косплей — это перевоплощение в персонажа из игр, аниме, кино или комиксов. 
              Участники создают костюмы и образы, отыгрывают характер героя и выступают 
              на сцене перед зрителями и жюри.
            </p>
            <p className="mt-4">
              На нашем фестивале косплей-конкурс собирает мастеров со всего региона. 
              Мы оцениваем качество костюма, сходство с персонажем и сценическое выступление.
            </p>
          </div>
        </div>
      </section>

      {/* Победители прошлого года */}
      <section className="section-pixel">
        <div className="container-pixel">
          <h2 className="section-title">ПОБЕДИТЕЛИ 2025</h2>
          <p className="section-subtitle">Лучшие образы прошлого года</p>
          <div className="winners-grid">
            {WINNERS.map((winner) => (
              <div key={winner.place} className="winner-card">
                <div className={`winner-place ${winner.placeClass}`}>
                  {winner.placeText}
                </div>
                <div 
                  className="winner-image" 
                  style={{ backgroundImage: `url(${winner.image})` }}
                ></div>
                <div className="winner-info">
                  <h3 className="winner-name">{winner.name}</h3>
                  <p className="winner-character">{winner.character} — {winner.from}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Правила регистрации */}
      <section className="section-pixel">
        <div className="container-pixel">
          <h2 className="section-title">ПРАВИЛА РЕГИСТРАЦИИ</h2>
          <p className="section-subtitle">Как стать участником конкурса</p>
          <div className="rules-grid">
            {REGISTRATION_RULES.map((rule, i) => (
              <div key={i} className="rule-item">
                <div className="rule-number">{i + 1}</div>
                <div className="rule-text">{rule}</div>
              </div>
            ))}
            <div className="template-block">
              <div className="template-title">✧ ШАБЛОН ЗАЯВКИ ✧</div>
              <p style={{ fontSize: '12px', marginBottom: '8px' }}>Скопируйте и заполните этот шаблон:</p>
              <pre className="template-code">{TEMPLATE}</pre>
              <p style={{ fontSize: '11px', marginTop: '12px', color: '#64748b' }}>
                Отправьте заполненную заявку на почту: <a href="mailto:festival2026.test@gmail.com?subject=Заявка%20на%20конкурс" style={{ textDecoration: 'none'}}><strong style={{ color: '#ff00ff' }}>festival2026.test@gmail.com</strong></a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Фотографии косплееров */}
      <section className="section-pixel">
        <div className="container-pixel">
          <h2 className="section-title">ГАЛЕРЕЯ</h2>
          <p className="section-subtitle">Фотографии участников прошлых лет</p>
          <div className="gallery-grid">
            {GALLERY_IMAGES.map((image) => (
              <div 
                key={image.id} 
                className="gallery-item"
                onClick={() => openModal(image)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="gallery-image"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Модальное окно для просмотра фото */}
      {selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>✕</button>
            <img 
              src={selectedImage.src} 
              alt={selectedImage.alt}
              className="modal-image"
            />
            <p className="modal-caption">{selectedImage.alt}</p>
          </div>
        </div>
      )}

      {/* FAQ */}
      <FAQ 
        items={cosplayFaqItems} 
        title="ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ" 
        subtitle="Всё, что нужно знать перед посещением"
        color="cyan"
      />
    </div>
  );
}