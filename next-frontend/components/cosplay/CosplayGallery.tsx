'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { Heart, Share2, Eye, Trophy } from 'lucide-react';

interface Cosplayer {
  id: number;
  name: string;
  character: string;
  game: string;
  category: string;
  photo: string;
  votes: number;
  views: number;
  isLiked?: boolean;
}

interface CosplayGalleryProps {
  cosplayers: Cosplayer[];
  loading: boolean;
  activeCategory: string;
}

export default function CosplayGallery({ 
  cosplayers, 
  loading, 
  activeCategory 
}: CosplayGalleryProps) {
  const [selectedCosplayer, setSelectedCosplayer] = useState<Cosplayer | null>(null);
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'votes' | 'newest'>('votes');

  // Фильтрация по категории
  const filteredCosplayers = activeCategory === 'all' 
    ? cosplayers 
    : cosplayers.filter(cosplayer => cosplayer.category === activeCategory);

  // Сортировка
  const sortedCosplayers = [...filteredCosplayers].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.votes - a.votes;
    }
    return b.id - a.id;
  });

  const handleVote = async (id: number) => {
    try {
      // API call к Laravel
      const response = await fetch('/api/cosplay/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cosplayerId: id }),
      });
      
      if (response.ok) {
        setLikedIds(prev => [...prev, id]);
        // Обновляем локальные данные
        cosplayers.forEach(cosplayer => {
          if (cosplayer.id === id) {
            cosplayer.votes += 1;
          }
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleShare = async (cosplayer: Cosplayer) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Косплей ${cosplayer.character} от ${cosplayer.name}`,
          text: `Посмотрите этот потрясающий косплей на ${cosplayer.character} из ${cosplayer.game}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Sharing cancelled');
      }
    }
  };

  if (loading) {
    return (
      <section className="cosplay-gallery loading">
        <div className="container">
          <h2 className="section-title">Загрузка работ...</h2>
          <div className="loading-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="loading-card">
                <div className="loading-image" />
                <div className="loading-text" />
                <div className="loading-text short" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="vote" className="cosplay-gallery">
      <div className="container">
        <div className="gallery-header">
          <div>
            <div className="section-badge">🎨 ГАЛЕРЕЯ РАБОТ</div>
            <h2 className="section-title">РАБОТЫ УЧАСТНИКОВ</h2>
            <p className="section-subtitle">
              {sortedCosplayers.length} работ в категории "{activeCategory === 'all' ? 'Все' : activeCategory}"
            </p>
          </div>
          
          <div className="gallery-controls">
            <div className="sort-controls">
              <button
                className={`sort-btn ${sortBy === 'votes' ? 'active' : ''}`}
                onClick={() => setSortBy('votes')}
              >
                <Trophy size={16} />
                ПО ПОПУЛЯРНОСТИ
              </button>
              <button
                className={`sort-btn ${sortBy === 'newest' ? 'active' : ''}`}
                onClick={() => setSortBy('newest')}
              >
                ПО ДАТЕ ДОБАВЛЕНИЯ
              </button>
            </div>
            
            <div className="total-votes">
              <div className="total-icon">❤️</div>
              <div className="total-content">
                <div className="total-number">
                  {sortedCosplayers.reduce((sum, c) => sum + c.votes, 0).toLocaleString()}
                </div>
                <div className="total-label">всего голосов</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="gallery-grid">
          {sortedCosplayers.map(cosplayer => (
            <div 
              key={cosplayer.id} 
              className="cosplay-card"
              onClick={() => setSelectedCosplayer(cosplayer)}
            >
              <div className="cosplay-image-container">
                <div className="cosplay-image">
                  {/* В реальном проекте используйте next/image */}
                  <img 
                    src={cosplayer.photo} 
                    alt={`${cosplayer.character} косплей от ${cosplayer.name}`}
                    loading="lazy"
                  />
                  <div className="image-overlay">
                    <div className="overlay-content">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(cosplayer.id);
                        }}
                        className="vote-btn-overlay"
                      >
                        <Heart 
                          size={20} 
                          fill={likedIds.includes(cosplayer.id) ? "#EC4899" : "none"} 
                          color={likedIds.includes(cosplayer.id) ? "#EC4899" : "white"} 
                        />
                        {cosplayer.votes}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="cosplay-badges">
                  <span className="category-badge" style={{ 
                    background: `linear-gradient(135deg, ${getCategoryColor(cosplayer.category)}, transparent)`
                  }}>
                    {cosplayer.category}
                  </span>
                  {cosplayer.votes > 1000 && (
                    <span className="popular-badge">
                      🔥 ТОП
                    </span>
                  )}
                </div>
              </div>
              
              <div className="cosplay-info">
                <div className="cosplay-header">
                  <h3 className="character-name">{cosplayer.character}</h3>
                  <p className="game-name">из {cosplayer.game}</p>
                </div>
                
                <div className="cosplay-author">
                  <div className="author-avatar">
                    {cosplayer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="author-info">
                    <div className="author-name">{cosplayer.name}</div>
                    <div className="author-status">Участник конкурса</div>
                  </div>
                </div>
                
                <div className="cosplay-stats">
                  <div className="stat">
                    <Heart size={16} />
                    <span>{cosplayer.votes.toLocaleString()}</span>
                  </div>
                  <div className="stat">
                    <Eye size={16} />
                    <span>{cosplayer.views.toLocaleString()}</span>
                  </div>
                  <button 
                    className="share-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(cosplayer);
                    }}
                  >
                    <Share2 size={16} />
                  </button>
                </div>
                
                <div className="cosplay-actions">
                  <Button 
                    variant="primary" 
                    size="sm"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(cosplayer.id);
                    }}
                    disabled={likedIds.includes(cosplayer.id)}
                  >
                    {likedIds.includes(cosplayer.id) ? '❤️ ГОЛОС ОТДАН' : '❤️ ПРОГОЛОСОВАТЬ'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {sortedCosplayers.length === 0 && (
          <div className="empty-gallery">
            <div className="empty-icon">🎭</div>
            <h3>Пока нет работ в этой категории</h3>
            <p>Будьте первым, кто добавит свою работу!</p>
            <Button href="/cosplay/register" variant="outline">
              ДОБАВИТЬ СВОЮ РАБОТУ
            </Button>
          </div>
        )}
      </div>
      
      {/* Модальное окно с деталями */}
      {selectedCosplayer && (
        <div className="cosplay-modal">
          <div className="modal-content">
            <button 
              className="modal-close"
              onClick={() => setSelectedCosplayer(null)}
            >
              ✕
            </button>
            <div className="modal-grid">
              <div className="modal-image">
                <img src={selectedCosplayer.photo} alt={selectedCosplayer.character} />
              </div>
              <div className="modal-info">
                <h2>{selectedCosplayer.character}</h2>
                <p className="modal-game">Из игры: {selectedCosplayer.game}</p>
                
                <div className="modal-author">
                  <h3>Автор косплея</h3>
                  <div className="author-details">
                    <div className="author-avatar large">
                      {selectedCosplayer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="author-name">{selectedCosplayer.name}</div>
                      <div className="author-bio">
                        Участник косплей конкурса 2026
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-stats">
                  <div className="stat-card">
                    <div className="stat-number">{selectedCosplayer.votes.toLocaleString()}</div>
                    <div className="stat-label">Голосов</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{selectedCosplayer.views.toLocaleString()}</div>
                    <div className="stat-label">Просмотров</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">#{(sortedCosplayers.findIndex(c => c.id === selectedCosplayer.id) + 1)}</div>
                    <div className="stat-label">Место в рейтинге</div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => handleVote(selectedCosplayer.id)}
                    disabled={likedIds.includes(selectedCosplayer.id)}
                  >
                    {likedIds.includes(selectedCosplayer.id) ? 'ГОЛОС ОТДАН' : 'ПРОГОЛОСОВАТЬ ЗА ЭТУ РАБОТУ'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedCosplayer(null)} />
        </div>
      )}
    </section>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'gaming': '#10B981',
    'anime': '#EC4899',
    'fantasy': '#F59E0B',
    'handmade': '#8B5CF6',
    'performance': '#3B82F6',
  };
  return colors[category] || '#6366F1';
}