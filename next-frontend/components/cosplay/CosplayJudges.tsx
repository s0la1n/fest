'use client';

import { Instagram, Youtube, Twitch } from 'lucide-react';

interface Judge {
  id: number;
  name: string;
  role: string;
  specialty: string;
  photo: string;
  bio: string;
  social: {
    instagram?: string;
    youtube?: string;
    twitch?: string;
  };
}

const JUDGES: Judge[] = [
  {
    id: 1,
    name: 'Анна "CosplayQueen" Смирнова',
    role: 'Главный судья',
    specialty: 'Профессиональный косплеер',
    photo: '/judges/anna.jpg',
    bio: '10 лет в косплее, победитель международных конкурсов, автор мастер-классов по созданию костюмов.',
    social: {
      instagram: '@cosplayqueen',
      youtube: '/cosplayqueen',
      twitch: 'cosplayqueen'
    }
  },
  {
    id: 2,
    name: 'Дмитрий "ArtMaster" Ковалев',
    role: 'Судья по реквизиту',
    specialty: 'Мастер по изготовлению реквизита',
    photo: '/judges/dmitry.jpg',
    bio: 'Специалист по 3D-печати и литью, создатель реквизита для кино и игровой индустрии.',
    social: {
      instagram: '@artmaster_props',
      youtube: '/artmaster'
    }
  },
  {
    id: 3,
    name: 'Екатерина "PhotoMagic" Новикова',
    role: 'Судья по фотографии',
    specialty: 'Фотограф косплея',
    photo: '/judges/ekaterina.jpg',
    bio: 'Профессиональный фотограф, специализирующийся на косплее и фэнтези-фотографии.',
    social: {
      instagram: '@photomagic_cosplay',
      twitch: 'photomagic'
    }
  },
  {
    id: 4,
    name: 'Максим "GamePro" Иванов',
    role: 'Судья по играм',
    specialty: 'Гейм-дизайнер',
    photo: '/judges/maxim.jpg',
    bio: 'Ведущий гейм-дизайнер крупной студии, эксперт по игровым персонажам и лору.',
    social: {
      youtube: '/gamepro',
      twitch: 'gamepro'
    }
  }
];

export default function CosplayJudges() {
  return (
    <section className="cosplay-judges">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">⚖️ ЖЮРИ</div>
          <h2 className="section-title">НАШИ ЭКСПЕРТЫ</h2>
          <p className="section-subtitle">
            Профессионалы, которые будут оценивать ваши работы
          </p>
        </div>
        
        <div className="judges-grid">
          {JUDGES.map(judge => (
            <div key={judge.id} className="judge-card">
              <div className="judge-image">
                <div className="judge-badge">
                  <span className="badge-text">{judge.role}</span>
                </div>
                <img src={judge.photo} alt={judge.name} />
                
                <div className="judge-specialty">
                  <span className="specialty-text">{judge.specialty}</span>
                </div>
              </div>
              
              <div className="judge-info">
                <h3 className="judge-name">{judge.name}</h3>
                <p className="judge-bio">{judge.bio}</p>
                
                <div className="judge-criteria">
                  <h4>Критерии оценки:</h4>
                  <ul className="criteria-list">
                    {getJudgeCriteria(judge.role).map((criterion, i) => (
                      <li key={i}>{criterion}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="judge-social">
                  <h4>Соцсети:</h4>
                  <div className="social-links">
                    {judge.social.instagram && (
                      <a href="#" className="social-link">
                        <Instagram size={18} />
                        <span>{judge.social.instagram}</span>
                      </a>
                    )}
                    {judge.social.youtube && (
                      <a href="#" className="social-link">
                        <Youtube size={18} />
                        <span>{judge.social.youtube}</span>
                      </a>
                    )}
                    {judge.social.twitch && (
                      <a href="#" className="social-link">
                        <Twitch size={18} />
                        <span>{judge.social.twitch}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="judging-process">
          <h3 className="process-title">Как проходит судейство:</h3>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Предварительный отбор</h4>
                <p>Все работы проверяются на соответствие правилам конкурса</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Оценка по критериям</h4>
                <p>Каждый судья оценивает работы по своей специализации</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Совместное обсуждение</h4>
                <p>Жюри собирается для финального выбора победителей</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Объявление результатов</h4>
                <p>Прямая трансляция церемонии награждения</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getJudgeCriteria(role: string): string[] {
  switch (role) {
    case 'Главный судья':
      return ['Общее впечатление', 'Соответствие персонажу', 'Артистизм', 'Качество исполнения'];
    case 'Судья по реквизиту':
      return ['Качество материалов', 'Сложность изготовления', 'Детализация', 'Прочность'];
    case 'Судья по фотографии':
      return ['Качество фото', 'Композиция', 'Освещение', 'Эмоциональность кадра'];
    case 'Судья по играм':
      return ['Точность образа', 'Знание персонажа', 'Детали из игры', 'Творческий подход'];
    default:
      return ['Качество', 'Креативность', 'Детализация', 'Общее впечатление'];
  }
}