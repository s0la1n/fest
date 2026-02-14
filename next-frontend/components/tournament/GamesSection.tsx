'use client';

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface Prize {
  place: number;
  amount: number;
  trophy: string;
  color: string;
}

interface GamesSectionProps {
  games: Game[];
  prizes: Prize[];
  onSelectGame: (gameId: string) => void;
}

export default function GamesSection({ games, prizes, onSelectGame }: GamesSectionProps) {
  return (
    <section className="games-section">
      <h2 className="section-title">ДИСЦИПЛИНЫ ТУРНИРА</h2>
      <p className="section-subtitle">3 культовые игры • 3 отдельных чемпиона</p>
      
      <div className="games-grid">
        {games.map(game => (
          <div 
            key={game.id}
            className="game-card"
            style={{ 
              borderColor: game.color,
              background: `linear-gradient(135deg, ${game.color}10, transparent)`
            }}
          >
            <div className="game-header">
              <div className="game-icon" style={{ color: game.color }}>
                {game.icon}
              </div>
              <h3>{game.name}</h3>
            </div>
            
            <p className="game-description">{game.description}</p>
            
            <div className="game-prizes">
              <h4>Призовой фонд:</h4>
              <div className="prize-list">
                {prizes.map(prize => (
                  <div key={prize.place} className="prize-item-small">
                    <span className="prize-trophy-small">{prize.trophy}</span>
                    <span className="prize-place-small">{prize.place} место</span>
                    <span className="prize-amount-small">{prize.amount.toLocaleString()}₽</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="game-actions">
              <button 
                className="select-game-btn"
                onClick={() => onSelectGame(game.id)}
                style={{ backgroundColor: game.color }}
              >
                СМОТРЕТЬ КОМАНДЫ
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}