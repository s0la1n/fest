'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Team {
  id: number;
  name: string;
  game: string;
  city: string;
  logo: string;
}

interface TeamsSectionProps {
  teams: Team[];
  games: Game[];
  selectedGame: string;
  onGameChange: (gameId: string) => void;
  twitchChannel?: string;
}

export default function TeamsSection({ 
  teams, 
  games, 
  selectedGame, 
  onGameChange,
  twitchChannel = "https://twitch.tv/cyberfest2026"
}: TeamsSectionProps) {
  const filteredTeams = selectedGame === 'all' 
    ? teams 
    : teams.filter(team => team.game === selectedGame);

  return (
    <section id="teams" className="teams-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">КОМАНДЫ-УЧАСТНИКИ</h2>
          <p className="section-subtitle">
            {selectedGame === 'all' 
              ? 'Лучшие коллективы СНГ' 
              : `Команды по ${games.find(g => g.id === selectedGame)?.name}`}
          </p>
        </div>
        
        <div className="teams-filters">
          <button
            className={`filter-btn ${selectedGame === 'all' ? 'active' : ''}`}
            onClick={() => onGameChange('all')}
          >
            ВСЕ
          </button>
          {games.map(game => (
            <button
              key={game.id}
              className={`filter-btn ${selectedGame === game.id ? 'active' : ''}`}
              onClick={() => onGameChange(game.id)}
              style={{ 
                color: selectedGame === game.id ? '#fff' : game.color,
                backgroundColor: selectedGame === game.id ? game.color : 'transparent',
                borderColor: game.color
              }}
            >
              {game.icon} {game.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Статистика фильтра */}
      <div className="filter-stats">
        <div className="stat">
          <span className="stat-value">{filteredTeams.length}</span>
          <span className="stat-label">команд</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {selectedGame === 'all' ? '3' : '1'}
          </span>
          <span className="stat-label">игр</span>
        </div>
        <div className="stat">
          <span className="stat-value">СНГ</span>
          <span className="stat-label">регион</span>
        </div>
      </div>
      
      {/* Кнопка смотреть матч */}
      <div className="live-match-section">
        <div className="live-badge">
          <span className="live-dot"></span>
          LIVE
        </div>
        <h3 className="live-title">ТРАНСЛЯЦИЯ ТУРНИРА</h3>
        <p className="live-description">
          Смотрите все матчи в прямом эфире на нашем официальном Twitch-канале
        </p>
        <Button 
          href={twitchChannel}
          size="lg"
          external
        >
          <span className="twitch-icon">📺</span>
          СМОТРЕТЬ МАТЧ НА TWITCH
        </Button>
      </div>
      
      {/* Сетка команд */}
      <div className="teams-grid">
        {filteredTeams.map(team => {
          const gameInfo = games.find(g => g.id === team.game)!;
          
          return (
            <div 
              key={team.id}
              className="team-card"
              style={{ borderColor: gameInfo.color }}
            >
              {/* Логотип команды */}
              <div className="team-logo">
                <div 
                  className="logo-placeholder"
                  style={{ 
                    backgroundColor: `${gameInfo.color}20`,
                    color: gameInfo.color
                  }}
                >
                  {team.name.split(' ').map(word => word[0]).join('')}
                </div>
              </div>
              
              {/* Информация о команде */}
              <div className="team-info">
                <h3 className="team-name">{team.name}</h3>
                
                <div className="team-meta">
                  <div 
                    className="team-game"
                    style={{ color: gameInfo.color }}
                  >
                    <span className="game-icon-small">{gameInfo.icon}</span>
                    <span>{gameInfo.name}</span>
                  </div>
                  
                  <div className="team-city">
                    <span className="city-icon">📍</span>
                    <span>{team.city}</span>
                  </div>
                </div>
              </div>
              
              {/* Действия */}
              <div className="team-actions">
                <div className="action-buttons">
                  <Button 
                    href="/register"
                    variant="primary"
                    size="sm"
                  >
                    🏆 СДЕЛАТЬ СТАВКУ
                  </Button>
                  <Button 
                    href={twitchChannel}
                    variant="secondary"
                    size="sm"
                    external
                  >
                    📺 СМОТРЕТЬ МАТЧ
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Сообщение если нет команд */}
      {filteredTeams.length === 0 && (
        <div className="no-teams">
          <div className="no-teams-icon">🤔</div>
          <h3>Нет команд для этой дисциплины</h3>
          <p>Выберите другую игру или посмотрите все команды</p>
          <button 
            className="reset-filter-btn"
            onClick={() => onGameChange('all')}
          >
            ПОКАЗАТЬ ВСЕ КОМАНДЫ
          </button>
        </div>
      )}
    </section>
  );
}