'use client';

import { useState } from 'react';
import Image from 'next/image';

interface TimelineEvent {
  year: number;
  title: string;
  description: string;
  stats: string[];
  image: string;
  highlight: boolean;
}

const timelineEvents: TimelineEvent[] = [
  {
    year: 2018,
    title: "Первый шаг",
    description: "Небольшое локальное мероприятие для 300 энтузиастов в культурном центре",
    stats: ["300 посетителей", "15 инди-игр", "1 сцена"],
    image: "/about/2018.jpg",
    highlight: false
  },
  {
    year: 2020,
    title: "Цифровая трансформация",
    description: "Переход в онлайн-формат во время пандемии, что позволило привлечь аудиторию со всей страны",
    stats: ["5,000 онлайн-зрителей", "3 дня прямых эфиров", "Международные спикеры"],
    image: "/about/2020.jpg",
    highlight: true
  },
  {
    year: 2022,
    title: "Возвращение в офлайн",
    description: "Масштабное возвращение в Тукаев-центр с рекордным количеством участников и зон",
    stats: ["3,500 посетителей", "40 экспонентов", "8 тематических зон"],
    image: "/about/2022.jpg",
    highlight: false
  },
  {
    year: 2024,
    title: "Международное признание",
    description: "Фестиваль вошел в топ-10 игровых событий Восточной Европы по версии Gaming Insider",
    stats: ["5,000+ участников", "100+ косплееров", "Призовой фонд 2M₽"],
    image: "/about/2024.jpg",
    highlight: true
  },
  {
    year: 2026,
    title: "Новая эра",
    description: "Самый масштабный фестиваль в истории с инновационными технологиями и мировыми премьерами",
    stats: ["8,000+ ожидается", "12 тематических зон", "Призовой фонд 5M₽"],
    image: "/about/2026.jpg",
    highlight: false
  }
];

export default function TimelineSection() {
  const [activeYear, setActiveYear] = useState<number>(2026);

  return (
    <section id="timeline" className="timeline-section">
      <h2>ЭВОЛЮЦИЯ ФЕСТИВАЛЯ</h2>
      <p className="section-subtitle">Нажмите на год, чтобы узнать подробности</p>
      
      <div className="timeline-container">
        <div className="timeline-track">
          {timelineEvents.map((event) => (
            <div 
              key={event.year}
              className={`timeline-marker ${activeYear === event.year ? 'active' : ''} ${event.highlight ? 'highlight' : ''}`}
              onClick={() => setActiveYear(event.year)}
            >
              <div className="marker-year">{event.year}</div>
              <div className="marker-dot"></div>
            </div>
          ))}
        </div>
        
        <div className="timeline-content">
          {timelineEvents
            .filter(event => event.year === activeYear)
            .map(event => (
              <div key={event.year} className="event-card">
                <div className="event-image">
                  <div className="image-placeholder">
                    {event.image ? (
                      <Image src={event.image} alt={event.title} width={400} height={250} />
                    ) : (
                      <div className="placeholder-text">{event.year}</div>
                    )}
                  </div>
                </div>
                <div className="event-details">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <div className="event-stats">
                    {event.stats.map((stat, idx) => (
                      <div key={idx} className="stat-badge">{stat}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}