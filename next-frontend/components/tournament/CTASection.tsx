'use client';

import Button from '@/components/ui/Button';

interface CTASectionProps {
  totalPrize: number;
  teamCount: number;
  gameCount: number;
}

export default function CTASection({ totalPrize, teamCount, gameCount }: CTASectionProps) {
  return (
    <section className="tournament-cta">
      <div className="cta-content">
        <h2>ГОТОВЫ СДЕЛАТЬ СТАВКУ?</h2>
        <p>
          Выберите своего фаворита среди {teamCount} сильнейших команд мира, 
          сделайте ставку и поддержите их путь к чемпионству!
        </p>
        
        <div className="cta-stats">
          <div className="cta-stat">
            <div className="cta-stat-value">{totalPrize.toLocaleString()}₽</div>
            <div className="cta-stat-label">Призовой фонд</div>
          </div>
          <div className="cta-stat">
            <div className="cta-stat-value">{teamCount}</div>
            <div className="cta-stat-label">Команд</div>
          </div>
          <div className="cta-stat">
            <div className="cta-stat-value">{gameCount}</div>
            <div className="cta-stat-label">Игры</div>
          </div>
        </div>
        
        <div className="cta-actions">
          <Button 
            href="/register" 
            variant="primary" 
            size="xl"
          >
            🎮 СДЕЛАТЬ СТАВКУ
          </Button>
          <Button 
            href="/tickets" 
            variant="outline" 
            size="xl"
          >
            🎫 КУПИТЬ БИЛЕТ
          </Button>
          <Button 
            href="/tournament/rules" 
            variant="ghost" 
            size="xl"
          >
            📋 ПРАВИЛА
          </Button>
        </div>
      </div>
    </section>
  );
}