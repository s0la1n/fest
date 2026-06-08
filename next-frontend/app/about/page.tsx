'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import FAQ from '@/components/FAQ';
import './about.css';

const values = [
  { title: 'Доступность', desc: 'Делаем игровую культуру открытой для всех' },
  { title: 'Инновации', desc: 'Внедряем передовые технологии в ивентах' },
  { title: 'Сообщество', desc: 'Объединяем геймеров, разработчиков и фанатов' },
  { title: 'Творчество', desc: 'Поощряем самовыражение через игры и косплей' },
];

const timelineEvents = [
  { year: 2018, desc: 'Первый фестиваль собрал 500 энтузиастов в небольшом лофте. Зарождение традиции и первые косплей-дефиле.', image: '/images/about/2018.webp' },
  { year: 2020, desc: 'Онлайн-трансляция собрала 5000 зрителей. Добавлены киберспортивные турниры по CS:GO и Dota 2.', image: '/images/about/2020.webp' },
  { year: 2023, desc: 'Фестиваль переехал в Тукаев Центр. 10 000 посетителей, 3 сцены, 50 косплееров.', image: '/images/about/2023.webp' },
  { year: 2025, desc: 'Международный уровень. Призовой фонд 5 млн рублей. Новые дисциплины и зоны.', image: '/images/about/2025.webp' },
];

const teamMembers = [
  { name: 'Самира Нурутдинова', role: 'Основатель и CEO', avatar: '/images/about/samira.gif' },
  { name: 'Регина Боязитова', role: 'Креативный директор', avatar: '/images/about/regina.webp' },
  { name: 'Наиля Натфуллина', role: 'Менеджер по коммуникациям', avatar: '/images/about/nail.webp' },
  { name: 'Лиана Маннапова', role: 'Разработчик', avatar: '/images/about/liana.webp' },
  { name: 'Анастасия Давыдова', role: 'Киберспорт-директор', avatar: '/images/about/anast.webp' },
  { name: 'Владислав Майоров', role: 'Косплей-координатор', avatar: '/images/about/vlad.webp' },
  { name: 'Дарья Свитова', role: 'Технический директор', avatar: '/images/about/dasha.webp' },
  { name: 'Николай Мамаев', role: 'PR-менеджер', avatar: '/images/about/cupsize.webp' },
];

const aboutFaqItems = [
  { q: 'С какого возраста можно посещать фестиваль?', a: 'Фестиваль доступен для всех возрастов! Для посетителей до 14 лет требуется сопровождение взрослых.' },
  { q: 'Можно ли прийти в косплее?', a: 'Да, косплей приветствуется! Есть гримёрка и комната для переодевания. Для участников конкурса — бесплатный вход.' },
  { q: 'Есть ли парковка?', a: 'Да, у Тукаев-центра есть собственная парковка на 500 мест. Парковка бесплатная для посетителей фестиваля.' },
  { q: 'Можно ли купить билет на месте?', a: 'Да, билеты продаются в кассах в день фестиваля, но рекомендуем покупать онлайн — это дешевле и гарантирует вход.' },
  { q: 'Будет ли фан-зона с приставками?', a: 'Да, в инди-зоне будет представлено более 30 ретро-приставок и современных игровых станций.' },
  { q: 'Как принять участие в косплей-конкурсе?', a: 'На странице косплей-конкурса подробно указаны этапы подачи заявки.' },
  { q: 'Есть ли скидки для студентов?', a: 'Да, при предъявлении студенческого билета в день фестиваля — скидка 15% на стандартный билет.' },
  { q: 'Будет ли трансляция фестиваля онлайн?', a: 'Да, все мероприятия главной сцены будут транслироваться в нашем VK.' },
];

const ticketTypes = [
  { 
    type: 'standard', 
    name: 'СТАНДАРТ', 
    price: 1500, 
    color: '#00f5ff',
    features: [
      'Вход на фестиваль (3 день)',
      'Доступ ко всем игровым зонам',
      'Участие в розыгрышах',
      'Доступ к лекциям и мастер-классам',
    ]
  },
  { 
    type: 'vip', 
    name: 'VIP', 
    price: 3500, 
    color: '#ff00ff',
    features: [
      'Все преимущества стандартного билета',
      'Доступ на все дни фестиваля',
      'Отдельный вход на фестиваль',
      'VIP-зона отдыха с напитками',
      'Приоритетная регистрация на мероприятия',
    ]
  },
  { 
    type: 'premium', 
    name: 'ПРЕМИУМ', 
    price: 5000, 
    color: '#f59e0b',
    features: [
      'Все преимущества VIP билета',
      'Встреча со звёздными гостями',
      'Фотосессия в профессиональной студии',
      'Ужин с организаторами и партнёрами',
      'Именной бейдж и подарочный набор',
    ]
  },
];

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="about-page">
      {/* Hero-блок с ноутбуком и фоновым изображением */}
      <section className="hero-laptop-section">
        <div className="hero-background"></div>
        <div className="laptop-container">
          <div className="laptop-bg">
            <div className="laptop-screen-content">
              {/* Гифка внутри экрана ноутбука */}
              <div className="laptop-screen-inner">
                <img 
                  src="/images/about/screen.gif" 
                  alt="Игровой процесс"
                  className="screen-gif"
                />
              </div>
              <div className="laptop-text-overlay">
                <h1 className="laptop-title">ИГРОВОЙ ЛАБИРИНТ</h1>
                <div className="laptop-description-back">
                  <p className="laptop-description">
                    8 лет истории. От локальной встречи энтузиастов до крупнейшего игрового фестиваля региона
                  </p>
                </div>
                <Link href="/buy-ticket" className="btn-blue">
                  НАЧАТЬ ИГРУ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Миссия */}
      <section className="section-pixel section-dark">
        <div className="container-pixel">
          <h2 className="section-title">НАША МИССИЯ</h2>
          <p className="section-subtitle">
            Мы создаём пространство, где игровая культура оживает
          </p>
          <div className="values-grid">
            {values.map((v, i) => (
              <div key={i} className="pixel-card">
                <h3 className="pixel-card-title">{v.title}</h3>
                <p className="pixel-card-text">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* История фестиваля с фотографиями */}
      <section className="section-pixel">
        <div className="container-pixel">
          <h2 className="section-title">ИСТОРИЯ ФЕСТИВАЛЯ</h2>
          <p className="section-subtitle">
            Как мы росли вместе с вами
          </p>
          <div className="timeline">
            {timelineEvents.map((event) => (
              <div key={event.year} className="timeline-item">
                <div className="timeline-image-wrapper">
                  <div className="timeline-image">
                    <Image 
                      src={event.image} 
                      alt={`Фестиваль ${event.year}`} 
                      width={200} 
                      height={200}
                      className="timeline-img"
                    />
                  </div>
                </div>
                <div className="timeline-year">{event.year}</div>
                <div className="timeline-content">
                  <p className="timeline-text">{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Блок билетов */}
      <section className="section-pixel section-dark">
        <div className="container-pixel">
          <h2 className="section-title">ВЫБЕРИ БИЛЕТ</h2>
          <p className="section-subtitle">
            Стань частью самого масштабного игрового события
          </p>
          <div className="tickets-grid">
            {ticketTypes.map((ticket) => (
              <div key={ticket.type} className="ticket-card" style={{ borderColor: ticket.color }}>
                <div className="ticket-header" style={{ background: `linear-gradient(135deg, ${ticket.color}20, transparent)` }}>
                  <h3 className="ticket-name" style={{ color: ticket.color }}>{ticket.name}</h3>
                  <div className="ticket-price">
                    <span className="price-amount">{ticket.price}</span>
                    <span className="price-currency">₽</span>
                  </div>
                </div>
                <div className="ticket-features">
                  {ticket.features.map((feature, idx) => (
                    <div key={idx} className="ticket-feature">
                      <span className="feature-icon">✓</span>
                      <span className="feature-text">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href="/buy-ticket" className="ticket-btn" style={{ background: ticket.color, color: '#0a0a0f' }}>
                  КУПИТЬ БИЛЕТ
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Команда */}
      <section className="section-pixel">
        <div className="container-pixel">
          <h2 className="section-title">КОМАНДА МЕЧТЫ</h2>
          <p className="section-subtitle">
            Люди, которые превращают идеи в реальность
          </p>
          <div className="team-grid">
            {teamMembers.map((member, i) => (
              <div key={i} className="team-card">
                <div className="team-avatar">
                  <Image 
                    src={member.avatar} 
                    alt={member.name} 
                    width={100} 
                    height={100}
                    className="team-avatar-img"
                  />
                </div>
                <div className="team-info">
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section className="section-pixel section-dark">
        <div className="container-pixel">
          <h2 className="section-title">КОНТАКТЫ</h2>
          <p className="section-subtitle">
            Свяжитесь с нами любым удобным способом
          </p>
          <div className="contacts-grid">
            <div className="contact-info-card">
              <div className="contact-icon">📍</div>
              <h3 className="contact-title">АДРЕС</h3>
              <a 
                href="https://yandex.ru/maps/?text=Казань, ул. Габдуллы Тукая, 87, Тукаев Центр, 2 этаж" 
                target="_blank" 
                rel="noopener noreferrer"
                className="contact-link"
              >
                <p className="contact-text">г. Казань, ул. Габдуллы Тукая, 87<br/>Тукаев Центр, 2 этаж</p>
              </a>
            </div>
            <div className="contact-info-card">
              <div className="contact-icon">📞</div>
              <h3 className="contact-title">ТЕЛЕФОН</h3>
              <a href="tel:+78431234567" className="contact-link">
                <p className="contact-text">+7 (843) 123-45-67</p>
              </a>
              <a href="tel:+78432345678" className="contact-link">
                <p className="contact-text">+7 (843) 234-56-78</p>
              </a>
            </div>
            <div className="contact-info-card">
              <div className="contact-icon">✉️</div>
              <h3 className="contact-title">EMAIL</h3>
              <a href="mailto:info@gamelabirint.ru" className="contact-link">
                <p className="contact-text">info@gamelabirint.ru</p>
              </a>
              <a href="mailto:partners@gamelabirint.ru" className="contact-link">
                <p className="contact-text">partners@gamelabirint.ru</p>
              </a>
            </div>
            <div className="contact-info-card">
              <div className="contact-icon">🕐</div>
              <h3 className="contact-title">ЧАСЫ РАБОТЫ</h3>
              <p className="contact-text">Ежедневно: 10:00 - 20:00<br/>В день фестиваля: 09:00 - 23:00</p>
            </div>
          </div>
        </div>
      </section>

      <FAQ 
        items={aboutFaqItems} 
        title="ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ" 
        subtitle="Всё, что нужно знать перед посещением"
      />
    </div>
  );
}