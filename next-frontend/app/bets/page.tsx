'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import './bets.css';

type Match = {
  id: number;
  game_name: string;
  team1: { id: number; name: string };
  team2: { id: number; name: string };
  start_time: string;
  status: string;
  stage: string;
};

type Odds = {
  match_id: number;
  team1: { id: number; name: string; odds: number };
  team2: { id: number; name: string; odds: number };
  draw: { odds: number };
};

type Bet = {
  id: number;
  match: {
    id: number;
    game_name: string;
    team1_name: string;
    team2_name: string;
    start_time: string;
  };
  bet_on_text: string;
  coins_amount: number;
  odds: number;
  potential_win: number;
  actual_win: number | null;
  status_text: string;
  status_color: string;
  created_at: string;
};

type BetStats = {
  total_bets: number;
  total_wagered: number;
  total_won: number;
  wins_count: number;
  losses_count: number;
};

export default function BetsPage() {
  const { user, refreshUserData } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingBet, setPlacingBet] = useState<number | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [odds, setOdds] = useState<Odds | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [selectedBetOn, setSelectedBetOn] = useState<'team1_win' | 'team2_win' | 'draw'>('team1_win');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'matches' | 'my-bets'>('matches');

  const loadMatches = async () => {
    try {
      const data = await apiClient.get<{ matches: Match[] }>('/bets/matches');
      setMatches(data.matches || []);
    } catch (err) {
      console.error('Ошибка загрузки матчей:', err);
    }
  };

  const loadMyBets = async () => {
    try {
      const data = await apiClient.get<{ bets: Bet[]; stats: BetStats }>('/bets/my-bets');
      setMyBets(data.bets || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Ошибка загрузки ставок:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOdds = async (matchId: number) => {
    try {
      const data = await apiClient.get<Odds>(`/bets/odds/${matchId}`);
      setOdds(data);
    } catch (err) {
      console.error('Ошибка загрузки коэффициентов:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadMatches();
      loadMyBets();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setError('');
    setSuccess('');
    setBetAmount(100);
    setSelectedBetOn('team1_win');
    loadOdds(match.id);
  };

  const handlePlaceBet = async () => {
    if (!selectedMatch || !odds) return;
    
    if (betAmount < 10) {
      setError('Минимальная ставка - 10 монет');
      return;
    }
    
    if (betAmount > (user?.balance || 0)) {
      setError(`Недостаточно средств. Ваш баланс: ${user?.balance || 0} монет`);
      return;
    }

    const currentOdds = selectedBetOn === 'team1_win' ? odds.team1.odds :
                        selectedBetOn === 'team2_win' ? odds.team2.odds :
                        odds.draw.odds;

    setPlacingBet(selectedMatch.id);
    setError('');
    setSuccess('');

    try {
      const res = await apiClient.post<{ success: boolean; message: string; potential_win: number; new_balance: number }>(
        '/bets/place',
        {
          match_id: selectedMatch.id,
          bet_on: selectedBetOn,
          coins_amount: betAmount,
          odds: currentOdds,
        }
      );

      if (res.success) {
        setSuccess(`${res.message}. Потенциальный выигрыш: ${res.potential_win} монет`);
        setSelectedMatch(null);
        setOdds(null);
        loadMyBets();
        refreshUserData?.();
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Ошибка при оформлении ставки';
      setError(message);
    } finally {
      setPlacingBet(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="bets-page">
        <div className="bets-container">
          <div className="bets-empty">
            <p className="bets-empty-text">ВОЙДИТЕ, ЧТОБЫ ДЕЛАТЬ СТАВКИ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bets-page">
      <div className="bets-container">
        <div className="bets-header">
          <h1 className="bets-title">СТАВКИ НА МАТЧИ</h1>
          <p className="bets-description">ДЕЛАЙТЕ СТАВКИ И ВЫИГРЫВАЙТЕ МОНЕТЫ</p>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="bets-stats">
            <div className="bets-stat-card">
              <p className="bets-stat-label">ВСЕГО СТАВОК</p>
              <p className="bets-stat-value primary">{stats.total_bets}</p>
            </div>
            <div className="bets-stat-card">
              <p className="bets-stat-label">ПОСТАВЛЕНО</p>
              <p className="bets-stat-value yellow">{stats.total_wagered}</p>
            </div>
            <div className="bets-stat-card">
              <p className="bets-stat-label">ВЫИГРАНО</p>
              <p className="bets-stat-value green">{stats.total_won}</p>
            </div>
            <div className="bets-stat-card">
              <p className="bets-stat-label">ПОБЕД</p>
              <p className="bets-stat-value green">{stats.wins_count}</p>
            </div>
            <div className="bets-stat-card">
              <p className="bets-stat-label">ПОРАЖЕНИЙ</p>
              <p className="bets-stat-value red">{stats.losses_count}</p>
            </div>
          </div>
        )}

        {/* Табы */}
        <div className="bets-tabs">
          <button
            onClick={() => setActiveTab('matches')}
            className={`bets-tab ${activeTab === 'matches' ? 'active' : ''}`}
          >
            ДОСТУПНЫЕ МАТЧИ
          </button>
          <button
            onClick={() => setActiveTab('my-bets')}
            className={`bets-tab ${activeTab === 'my-bets' ? 'active' : ''}`}
          >
            МОИ СТАВКИ
          </button>
        </div>

        {/* Доступные матчи */}
        {activeTab === 'matches' && (
          <>
            {loading ? (
              <PageLoader text="ЗАГРУЗКА МАТЧЕЙ..." className="bets-loader" />
            ) : matches.length === 0 ? (
              <div className="bets-empty">
                <p className="bets-empty-text">НЕТ ДОСТУПНЫХ МАТЧЕЙ</p>
              </div>
            ) : (
              <div className="bets-matches-grid">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bets-match-card"
                    onClick={() => handleSelectMatch(match)}
                  >
                    <div className="bets-match-header">
                      <span className="bets-match-game">{match.game_name}</span>
                      <span className="bets-match-stage">{match.stage}</span>
                    </div>
                    <div className="bets-match-teams">
                      <p className="bets-match-team">{match.team1.name}</p>
                      <p className="bets-match-vs">VS</p>
                      <p className="bets-match-team">{match.team2.name}</p>
                    </div>
                    <div className="bets-match-footer">
                      <span className="bets-match-time">{formatDate(match.start_time)}</span>
                      <span className="bets-match-bet">СДЕЛАТЬ СТАВКУ →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Мои ставки */}
        {activeTab === 'my-bets' && (
          <>
            {loading ? (
              <PageLoader text="ЗАГРУЗКА СТАВОК..." className="bets-loader" />
            ) : myBets.length === 0 ? (
              <div className="bets-empty">
                <p className="bets-empty-text">У ВАС ПОКА НЕТ СТАВОК</p>
              </div>
            ) : (
              <div className="bets-list">
                {myBets.map((bet) => (
                  <div key={bet.id} className="bets-item">
                    <div className="bets-item-header">
                      <span className="bets-item-game">{bet.match.game_name}</span>
                      <span className={`bets-item-status ${bet.status_text === 'Выиграла' ? 'won' : bet.status_text === 'Проиграла' ? 'lost' : 'active'}`}>
                        {bet.status_text}
                      </span>
                    </div>
                    <p className="bets-item-teams">
                      {bet.match.team1_name} vs {bet.match.team2_name}
                    </p>
                    <div className="bets-item-details">
                      <p className="bets-item-detail">
                        СТАВКА НА: <span>{bet.bet_on_text}</span>
                      </p>
                      <p className="bets-item-detail">
                        СУММА: <span>{bet.coins_amount}</span> МОНЕТ × {bet.odds} ={' '}
                        <span className="bets-stat-value yellow">{bet.potential_win}</span>
                      </p>
                      {bet.actual_win && (
                        <p className="bets-item-win">
                          ВЫИГРЫШ: +{bet.actual_win} МОНЕТ
                        </p>
                      )}
                    </div>
                    <p className="bets-item-date">
                      {formatDate(bet.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Модальное окно для ставки */}
        {selectedMatch && odds && (
          <div className="bets-modal-overlay">
            <div className="bets-modal">
              <h2 className="bets-modal-title">СДЕЛАТЬ СТАВКУ</h2>
              <p className="bets-modal-match">{selectedMatch.team1.name} vs {selectedMatch.team2.name}</p>
              <p className="bets-modal-game">{selectedMatch.game_name}</p>

              {/* Выбор исхода */}
              <div className="bets-outcomes">
                <button
                  onClick={() => setSelectedBetOn('team1_win')}
                  className={`bets-outcome-btn ${selectedBetOn === 'team1_win' ? 'active' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="bets-outcome-name">{selectedMatch.team1.name}</span>
                    <span className="bets-outcome-odds">x{odds.team1.odds}</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedBetOn('draw')}
                  className={`bets-outcome-btn ${selectedBetOn === 'draw' ? 'active' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="bets-outcome-name">НИЧЬЯ</span>
                    <span className="bets-outcome-odds">x{odds.draw.odds}</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedBetOn('team2_win')}
                  className={`bets-outcome-btn ${selectedBetOn === 'team2_win' ? 'active' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="bets-outcome-name">{selectedMatch.team2.name}</span>
                    <span className="bets-outcome-odds">x{odds.team2.odds}</span>
                  </div>
                </button>
              </div>

              {/* Сумма ставки */}
              <div className="bets-amount">
                <label className="bets-amount-label">СУММА СТАВКИ (МОНЕТ)</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min={10}
                  max={user?.balance || 0}
                  className="bets-amount-input"
                />
                <div className="bets-amount-presets">
                  {[100, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      className="bets-preset"
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Потенциальный выигрыш */}
              <div className="bets-potential">
                <div className="bets-potential-row">
                  <span className="bets-potential-label">ПОТЕНЦИАЛЬНЫЙ ВЫИГРЫШ:</span>
                  <span className="bets-potential-value">
                    {Math.floor(betAmount * (
                      selectedBetOn === 'team1_win' ? odds.team1.odds :
                      selectedBetOn === 'team2_win' ? odds.team2.odds :
                      odds.draw.odds
                    ))} МОНЕТ
                  </span>
                </div>
                <div className="bets-potential-row">
                  <span className="bets-potential-label">ВАШ БАЛАНС:</span>
                  <span className="bets-potential-value white">{user?.balance || 0} МОНЕТ</span>
                </div>
              </div>

              {error && <div className="bets-error">{error}</div>}
              {success && <div className="bets-success">{success}</div>}

              <div className="bets-modal-buttons">
                <button
                  onClick={() => {
                    setSelectedMatch(null);
                    setOdds(null);
                    setError('');
                    setSuccess('');
                  }}
                  className="bets-modal-cancel"
                >
                  ОТМЕНА
                </button>
                <button
                  onClick={handlePlaceBet}
                  disabled={placingBet !== null}
                  className="bets-modal-submit"
                >
                  {placingBet === selectedMatch.id ? 'ОФОРМЛЕНИЕ...' : 'СДЕЛАТЬ СТАВКУ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}