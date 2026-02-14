'use client';

import { useState } from 'react';
import { Trophy, Award, Star, Calendar } from 'lucide-react';

interface Winner {
  id: number;
  year: number;
  name: string;
  character: string;
  game: string;
  photo: string;
  prize: string;
  quote: string;
}

const WINNERS: Winner[] = [
  {
    id: 1,
    year: 2025,
    name: 'Александра "Lunar" Волкова',
    character: 'Мона',
    game: 'Genshin Impact',
    photo: '/winners/mona.jpg',
    prize: '300 000 ₽',
    quote: 'Косплей - это не просто костюм, это возможность прожить жизнь другого персонажа.'
  },
  {
    id: 2,
    year: 2024,
    name: 'Иван "Samurai" Комаров',
    character: 'Джин Сакай',
    game: 'Ghost of Tsushima',
    photo: '/winners/jin.jpg',
    prize: '250 000 ₽',
    quote: 'Каждый стежок в костюме - это шаг к совершенству.'
  },
  {
    id: 3,
    year: 2023,
    name: 'Елена "Starlight" Петрова',
    character: 'Ахри',
    game: 'League of Legends',
    photo: '/winners/ahri-2023.jpg',
    prize: '200 000 ₽',
    quote: 'Победа в конкурсе - это начало нового пути в мире косплея.'
  },
  {
    id: 4,
    year: 2022,
    name: 'Михаил "Ironhide" Соколов',
    character: 'Геральт из Ривии',
    game: 'The Witcher 3',
    photo: '/winners/geralt.jpg',
    prize: '150 000 ₽',
    quote: 'Настоящий косплей - это когда ты не просто выглядишь как персонаж, а чувствуешь себя им.'
  }
];

export default function CosplayWinners() {
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  const selectedWinner = WINNERS.find(winner => winner.year === selectedYear);

  return (
    <section className="cosplay-winners">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">👑 ПОБЕДИТЕЛИ</div>
          <h2 className="section-title">ЛЕГЕНДЫ ПРОШЛЫХ ЛЕТ</h2>
          <p className="section-subtitle">
            Вдохновитесь работами победителей предыдущих конкурсов
          </p>
        </div>
        
        <div className="winners-content">
          <div className="winners-timeline">
            {WINNERS.map(winner => (
              <button
                key={winner.id}
                className={`timeline-year ${selectedYear === winner.year ? 'active' : ''}`}
                onClick={() => setSelectedYear(winner.year)}
              >
                <div className="year-number">{winner.year}</div>
                <div className="year-trophy">
                  {selectedYear === winner.year ? '🏆' : '⭐'}
                </div>
              </button>
            ))}
          </div>
          
          {selectedWinner && (
            <div className="winner-showcase">
              <div className="winner-card">
                <div className="winner-image">
                  <div className="winner-badge">
                    <Trophy size={24} />
                    Победитель {selectedWinner.year}
                  </div>
                  <img 
                    src={selectedWinner.photo} 
                    alt={`${selectedWinner.character} - ${selectedWinner.name}`}
                  />
                </div>
                
                <div className="winner-info">
                  <div className="winner-header">
                    <div className="winner-title">
                      <h3>{selectedWinner.character}</h3>
                      <p className="winner-game">из {selectedWinner.game}</p>
                    </div>
                    <div className="winner-prize">
                      <Award size={24} />
                      <div>
                        <div className="prize-amount">{selectedWinner.prize}</div>
                        <div className="prize-label">Главный приз</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="winner-author">
                    <h4>Автор: {selectedWinner.name}</h4>
                    <div className="winner-quote">
                      <Star size={16} />
                      <p>"{selectedWinner.quote}"</p>
                    </div>
                  </div>
                  
                  <div className="winner-stats">
                    <div className="stat">
                      <Calendar size={18} />
                      <div>
                        <div className="stat-value">{selectedWinner.year} год</div>
                        <div className="stat-label">Год победы</div>
                      </div>
                    </div>
                    <div className="stat">
                      <Trophy size={18} />
                      <div>
                        <div className="stat-value">1 место</div>
                        <div className="stat-label">В номинации</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="winner-gallery">
                    <h4>Работы победителя</h4>
                    <div className="mini-gallery">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="mini-photo">
                          <div className="photo-placeholder">
                            {i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="winner-advice">
                <h4>Советы от победителя:</h4>
                <ul className="advice-list">
                  <li>💡 Внимание к деталям - ключ к успеху</li>
                  <li>🎭 Продумайте характер и позу для фото</li>
                  <li>📸 Найдите хорошего фотографа</li>
                  <li>⏰ Начинайте подготовку заранее</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <div className="winner-message">
          <div className="message-icon">🌟</div>
          <div className="message-content">
            <h3>Станьте следующим легендарным победителем!</h3>
            <p>
              Каждый год мы находим новые таланты. Возможно, именно ваша работа 
              станет следующей легендой косплей-конкурса.
            </p>
            <button className="inspiration-btn">
              ВДОХНОВИТЬСЯ ИСТОРИЯМИ ПОБЕД
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}