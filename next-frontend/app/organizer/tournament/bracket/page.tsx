'use client';

import './bracket.css';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';

type Game = {
  id: number;
  name: string;
};

type Team = {
  id: number;
  name: string;
  team_name: string;
  tag: string;
};

type Match = {
  id: number;
  game_id: number;
  game_name: string;
  team1_id: number | null;
  team2_id: number | null;
  team1: { id: number; name: string; tag: string } | null;
  team2: { id: number; name: string; tag: string } | null;
  team1_score: number;
  team2_score: number;
  winner_id: number | null;
  stage: string;
  status: string;
  start_time: string;
  odds_team1: number | null;
  odds_team2: number | null;
  odds_draw: number | null;
};

type MatchStatus = 'pending' | 'scheduled' | 'live' | 'finished' | 'cancelled';

const STAGE_ORDER = ['qualification', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final'];
const STAGE_LABELS: Record<string, string> = {
  qualification: 'КВАЛИФИКАЦИЯ',
  round_of_16: '1/8 ФИНАЛА',
  quarterfinal: 'ЧЕТВЕРТЬФИНАЛ',
  semifinal: 'ПОЛУФИНАЛ',
  third_place: 'МАТЧ ЗА 3 МЕСТО',
  final: 'ФИНАЛ',
};

// Даты фестиваля (5 дней: 29, 30, 31 июля, 1, 2 августа 2026)
const FESTIVAL_START_DATE = new Date(2026, 6, 29);
const FESTIVAL_END_DATE = new Date(2026, 7, 2);

// Доступные часы для матчей
const AVAILABLE_HOURS = [10, 12, 14, 16, 18, 20, 22];

const formatDateForInput = (date: Date, hour?: number): string => {
  const newDate = new Date(date);
  if (hour !== undefined) {
    newDate.setHours(hour, 0, 0, 0);
  }
  return newDate.toISOString().slice(0, 16);
};

const isDateWithinFestival = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date >= FESTIVAL_START_DATE && date <= FESTIVAL_END_DATE;
};

const getAvailableDateTimes = (): { value: string; label: string }[] => {
  const dateTimes: { value: string; label: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(FESTIVAL_START_DATE);
    date.setDate(FESTIVAL_START_DATE.getDate() + i);
    const dayStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    for (const hour of AVAILABLE_HOURS) {
      const datetime = formatDateForInput(date, hour);
      dateTimes.push({ value: datetime, label: `${dayStr} ${hour.toString().padStart(2, '0')}:00` });
    }
  }
  return dateTimes;
};

// Правила редактирования в зависимости от статуса
const canEditTeams = (status: string): boolean => {
  return status === 'pending';
};

const canEditDateTimeAndOdds = (status: string): boolean => {
  return status === 'pending';
};

const canEditScore = (status: string): boolean => {
  return status === 'finished';
};

export default function OrganizerTournamentBracketPage() {
  const { user, isOrganizer, isAdmin } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamStats, setTeamStats] = useState({ active: 0, inactive: 0, total: 0, has_bracket: false });
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [scoreForm, setScoreForm] = useState({ team1_score: 0, team2_score: 0 });
  const [creatingBracket, setCreatingBracket] = useState(false);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [metaMatch, setMetaMatch] = useState<Match | null>(null);
  const [dateError, setDateError] = useState('');
  const availableDateTimes = getAvailableDateTimes();
  
  const [metaForm, setMetaForm] = useState({
    status: 'scheduled',
    start_time: '',
    odds_team1: '',
    odds_team2: '',
    odds_draw: '',
  });

  useEffect(() => {
    if (user && (isOrganizer() || isAdmin())) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, isOrganizer, isAdmin]);

  const loadData = async () => {
    try {
      const [gamesRes, matchesRes] = await Promise.all([
        apiClient.get<Game[]>('/games'),
        apiClient.get<{ matches: Match[] }>('/organizer/tournament/matches'),
      ]);
      setGames(gamesRes || []);
      setMatches(matchesRes.matches || []);
      
      if (selectedGame) {
        await loadTeamsByGame(selectedGame);
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось загрузить данные');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamsByGame = async (gameId: number) => {
    try {
      const data = await apiClient.get<{
        teams: { id: number; team_name: string; tag: string }[];
        stats?: { active: number; inactive: number; total: number; has_bracket: boolean };
      }>(`/organizer/tournament/teams-by-game/${gameId}`);
      const adaptedTeams = (data.teams || []).map(team => ({
        id: team.id,
        name: team.team_name,
        team_name: team.team_name,
        tag: team.tag,
      }));
      setTeams(adaptedTeams);
      if (data.stats) {
        setTeamStats(data.stats);
      }
    } catch (err) {
      console.error('Ошибка загрузки команд:', err);
    }
  };

  const handleGameSelect = async (gameId: number) => {
    if (!Number.isFinite(gameId) || gameId <= 0) {
      setSelectedGame(null);
      setTeams([]);
      return;
    }
    setSelectedGame(gameId);
    await loadTeamsByGame(gameId);
  };

  const updateMatchTeam = async (matchId: number, teamId: number | null, position: 'team1' | 'team2') => {
    const match = matches.find(m => m.id === matchId);
    if (!canEditTeams(match?.status || '')) {
      setError('Команды можно менять только в статусе "В ожидании"');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setSubmitting(true);
    try {
      const updateData = position === 'team1' 
        ? { team1_id: teamId }
        : { team2_id: teamId };

      await apiClient.put(`/organizer/tournament/matches/${matchId}/team`, updateData);
      setSuccess('Матч обновлен');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
    } catch (err: any) {
      console.error('Ошибка:', err);
      setError(err?.response?.data?.message || 'Ошибка обновления');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const createBracket = async () => {
    if (!selectedGame) return;
    setCreatingBracket(true);
    setError('');
    try {
      const res = await apiClient.post<{ message?: string }>('/organizer/tournament/full-bracket', { game_id: selectedGame });
      setSuccess(res.message || 'Сетка сформирована');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Не удалось сформировать сетку');
      setTimeout(() => setError(''), 3500);
    } finally {
      setCreatingBracket(false);
    }
  };

  const updateMatchResult = async () => {
    if (!editingMatch) return;
    
    setSubmitting(true);
    try {
      await apiClient.put(`/organizer/tournament/matches/${editingMatch.id}/winner`, {
        team1_score: scoreForm.team1_score,
        team2_score: scoreForm.team2_score,
      });
      setSuccess('Результат матча обновлен');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
      setEditingMatch(null);
      setScoreForm({ team1_score: 0, team2_score: 0 });
    } catch (err: any) {
      console.error('Ошибка:', err);
      setError(err?.response?.data?.message || 'Ошибка обновления результата');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const openMetaModal = (match: Match) => {
    setDateError('');
    setMetaMatch(match);
    
    let startTime = '';
    if (match.start_time) {
      const date = new Date(match.start_time);
      // Проверяем, что дата валидна
      if (!isNaN(date.getTime())) {
        const hour = date.getHours();
        const closestHour = AVAILABLE_HOURS.reduce((prev, curr) => 
          Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev
        );
        date.setHours(closestHour, 0, 0, 0);
        startTime = formatDateForInput(date, closestHour);
      }
    }
    
    setMetaForm({
      status: match.status,
      start_time: startTime,
      odds_team1: match.odds_team1 !== null ? String(match.odds_team1) : '',
      odds_team2: match.odds_team2 !== null ? String(match.odds_team2) : '',
      odds_draw: match.odds_draw !== null ? String(match.odds_draw) : '',
    });
    setShowMetaModal(true);
  };

  const validateDate = (dateString: string): boolean => {
    if (!dateString) return true;
    if (!isDateWithinFestival(dateString)) {
      const startStr = FESTIVAL_START_DATE.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const endStr = FESTIVAL_END_DATE.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      setDateError(`Дата должна быть в пределах фестиваля (${startStr} - ${endStr} 2026)`);
      return false;
    }
    setDateError('');
    return true;
  };

  const handleDateTimeChange = (value: string) => {
    setMetaForm({ ...metaForm, start_time: value });
    validateDate(value);
  };

  const saveMatchMeta = async () => {
    if (!metaMatch) return;
    
    if (metaForm.start_time && !validateDate(metaForm.start_time)) {
      return;
    }
    
    setSubmitting(true);
    try {
      await apiClient.put(`/organizer/tournament/matches/${metaMatch.id}/meta`, {
        status: metaForm.status,
        start_time: metaForm.start_time ? new Date(metaForm.start_time).toISOString() : undefined,
        odds_team1: metaForm.odds_team1 === '' ? null : Number(metaForm.odds_team1),
        odds_team2: metaForm.odds_team2 === '' ? null : Number(metaForm.odds_team2),
        odds_draw: metaForm.odds_draw === '' ? null : Number(metaForm.odds_draw),
      });
      setSuccess('Параметры матча обновлены');
      setTimeout(() => setSuccess(''), 2500);
      await loadData();
      setShowMetaModal(false);
      setMetaMatch(null);
      setDateError('');
    } catch (err: any) {
      console.error('Ошибка:', err);
      setError(err?.response?.data?.message || 'Не удалось обновить матч');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const openScoreModal = (match: Match) => {
    // Кнопка ввода счета доступна только если статус 'finished'
    if (match.status !== 'finished') {
      setError('Ввести счет можно только для завершенных матчей');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setEditingMatch(match);
    setScoreForm({
      team1_score: match.team1_score,
      team2_score: match.team2_score,
    });
  };

  const getMatchesByStage = (stage: string): Match[] => {
    if (!selectedGame) return [];
    const filtered = matches.filter(m => m.game_id === selectedGame && m.stage === stage);
    return filtered.sort((a, b) => {
      const dateA = a.start_time ? new Date(a.start_time).getTime() : 0;
      const dateB = b.start_time ? new Date(b.start_time).getTime() : 0;
      return dateA - dateB;
    });
  };

  const getWinner = (match: Match): { id: number; name: string; tag: string } | null => {
    if (match.winner_id && match.team1?.id === match.winner_id) return match.team1;
    if (match.winner_id && match.team2?.id === match.winner_id) return match.team2;
    return null;
  };

  const getAvailableTeams = (currentMatch: Match, position: 'team1' | 'team2'): Team[] => {
    let availableTeams = [...teams];
    const stageMatches = getMatchesByStage(currentMatch.stage);
    const usedTeamIds = new Set<number>();

    stageMatches.forEach(m => {
      if (m.id !== currentMatch.id) {
        if (m.team1_id) usedTeamIds.add(m.team1_id);
        if (m.team2_id) usedTeamIds.add(m.team2_id);
      }
    });

    if (position === 'team1' && currentMatch.team2_id) {
      usedTeamIds.add(currentMatch.team2_id);
    }
    if (position === 'team2' && currentMatch.team1_id) {
      usedTeamIds.add(currentMatch.team1_id);
    }
    return availableTeams.filter(team => !usedTeamIds.has(team.id));
  };

  const getVisibleStages = (): string[] => {
    if (!selectedGame) return [];
    const stageSet = new Set(matches.filter(m => m.game_id === selectedGame).map(m => m.stage));
    return STAGE_ORDER.filter((stage) => stageSet.has(stage));
  };

  const getStatusChangeWarning = (oldStatus: string, newStatus: string): string | null => {
    if (oldStatus === 'finished' && newStatus !== 'finished') {
      return 'При изменении статуса завершенного матча будут сброшены результаты и победитель. Продолжить?';
    }
    if (oldStatus === 'live' && newStatus === 'finished') {
      return 'Матч будет завершен. Убедитесь, что счет введен корректно. Продолжить?';
    }
    if (oldStatus === 'scheduled' && newStatus === 'live') {
      return 'Матч перейдет в статус "В эфире". В этом статусе нельзя будет менять команды, дату и коэффициенты. Продолжить?';
    }
    return null;
  };

  const renderMatchCard = (match: Match, stageIndex: number) => {
    const winner = getWinner(match);
    const isFinished = match.status === 'finished';
    const isLive = match.status === 'live';
    const isPending = !match.team1 && !match.team2;
    const canEditTeam = canEditTeams(match.status);
    
    return (
      <div key={match.id} className="bracket-match">
        {stageIndex > 0 && (
          <div className="bracket-connector">
            <div className="connector-line horizontal" />
            <div className="connector-line vertical" />
          </div>
        )}
        
        <div className={`bracket-match-card ${isFinished ? 'finished' : ''} ${isLive ? 'live' : ''} ${isPending ? 'pending' : ''}`}>
          {isPending ? (
            <div className="bracket-match-pending">
              <span className="pending-text">ОЖИДАЕТ КОМАНДЫ</span>
            </div>
          ) : (
            <>
              <div className={`bracket-team ${winner?.id === match.team1?.id ? 'winner' : ''}`}>
                <div className="team-info">
                  {canEditTeam ? (
                    <select
                      value={match.team1_id || ''}
                      onChange={(e) => updateMatchTeam(match.id, parseInt(e.target.value) || null, 'team1')}
                      className="team-select"
                      disabled={submitting}
                    >
                      <option value="">— Выбрать команду —</option>
                      {getAvailableTeams(match, 'team1').map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name} [{team.tag}]
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="team-name">{match.team1?.name || '—'}</span>
                  )}
                  <span className="team-tag">{match.team1?.tag || ''}</span>
                </div>
                <span className="team-score">{match.team1_score}</span>
              </div>
              
              <div className={`bracket-team ${winner?.id === match.team2?.id ? 'winner' : ''}`}>
                <div className="team-info">
                  {canEditTeam ? (
                    <select
                      value={match.team2_id || ''}
                      onChange={(e) => updateMatchTeam(match.id, parseInt(e.target.value) || null, 'team2')}
                      className="team-select"
                      disabled={submitting}
                    >
                      <option value="">— Выбрать команду —</option>
                      {getAvailableTeams(match, 'team2').map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name} [{team.tag}]
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="team-name">{match.team2?.name || '—'}</span>
                  )}
                  <span className="team-tag">{match.team2?.tag || ''}</span>
                </div>
                <span className="team-score">{match.team2_score}</span>
              </div>
            </>
          )}
          
          <div className="bracket-match-footer">
            <div className="match-info-row">
              {match.start_time && !isNaN(new Date(match.start_time).getTime()) && (
                <span className="match-time">
                  {new Date(match.start_time).toLocaleString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              )}
              <span className={`match-status-badge status-${match.status}`}>
                {match.status === 'pending' ? 'В ожидании' :
                 match.status === 'scheduled' ? 'Запланирован' : 
                 match.status === 'live' ? 'В эфире' : 
                 match.status === 'finished' ? 'Завершен' : 'Отменен'}
              </span>
            </div>
            
            <div className="odds-preview">
              <span className="odds-item">Кф1: {match.odds_team1 || '—'}</span>
              <span className="odds-item">Кф2: {match.odds_team2 || '—'}</span>
              <span className="odds-item">Ничья: {match.odds_draw || '—'}</span>
            </div>
            
            <div className="match-actions">
              {canEditScore(match.status) && match.team1 && match.team2 && (
                <button 
                  onClick={() => openScoreModal(match)} 
                  className="btn-score"
                  disabled={submitting}
                >
                  Ввести счет
                </button>
              )}
              <button 
                onClick={() => openMetaModal(match)} 
                className="btn-meta"
                disabled={submitting}
              >
                Настройки
              </button>
            </div>
            
            {isFinished && winner && (
              <span className="match-winner-badge">{winner.name}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!user || (!isOrganizer() && !isAdmin())) {
    return (
      <div className="access-denied">
        <p className="access-denied-text">Доступ только для организатора.</p>
      </div>
    );
  }

  return (
    <div className="organizer-tournament-page">
      <div className="organizer-tournament-container">
        <div className="organizer-tournament-header">
          <div className="organizer-tournament-title-section">
            <h1 className="organizer-tournament-title">ТУРНИРНАЯ СЕТКА</h1>
            <p className="organizer-tournament-description">
              Управление турнирной сеткой: назначение команд, ввод результатов
            </p>
          </div>
        </div>

        {error && <div className="message-error">{error}</div>}
        {success && <div className="message-success">{success}</div>}

        <div className="game-selector">
          <label className="game-selector-label">ВЫБЕРИТЕ ИГРУ:</label>
          <select
            value={selectedGame || ''}
            onChange={(e) => {
              const value = e.target.value;
              handleGameSelect(value ? Number(value) : NaN);
            }}
            className="game-select"
          >
            <option value="">-- ВЫБЕРИТЕ ИГРУ --</option>
            {games.map(game => (
              <option key={game.id} value={game.id}>{game.name}</option>
            ))}
          </select>
          {selectedGame && (
            <button
              type="button"
              onClick={createBracket}
              className="btn-primary"
              disabled={creatingBracket || submitting}
            >
              {creatingBracket ? 'ФОРМИРУЕМ...' : `СФОРМИРОВАТЬ СЕТКУ (${teams.length} КОМАНД)`}
            </button>
          )}
        </div>

        {loading ? (
          <PageLoader />
        ) : !selectedGame ? (
          <div className="empty-state">
            <p className="empty-state-text">ВЫБЕРИТЕ ИГРУ ДЛЯ ПРОСМОТРА ТУРНИРНОЙ СЕТКИ</p>
          </div>
        ) : (
          <div className="bracket-container">
            <div className="bracket-wrapper">
              {getVisibleStages().map((stageValue, stageIndex) => {
                const stageMatches = getMatchesByStage(stageValue);
                if (stageMatches.length === 0) return null;
                
                return (
                  <div key={stageValue} className="bracket-stage">
                    <h3 className="bracket-stage-title">{STAGE_LABELS[stageValue] || stageValue}</h3>
                    <div className="bracket-matches">
                      {stageMatches.map((match) => renderMatchCard(match, stageIndex))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно ввода результата */}
      {editingMatch && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">ВВОД РЕЗУЛЬТАТА</h2>
              <button onClick={() => setEditingMatch(null)} className="btn-close">×</button>
            </div>
            
            <div className="modal-body">
              <div className="match-teams">
                <div className="match-team-name">{editingMatch.team1?.name || 'Команда 1'}</div>
                <div className="match-vs">VS</div>
                <div className="match-team-name">{editingMatch.team2?.name || 'Команда 2'}</div>
              </div>
              
              <div className="score-input-group">
                <div className="score-field">
                  <label className="score-label">{editingMatch.team1?.name || 'Команда 1'}</label>
                  <input
                    type="number"
                    value={scoreForm.team1_score}
                    onChange={(e) => setScoreForm({ ...scoreForm, team1_score: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="score-input"
                  />
                </div>
                <div className="score-field">
                  <label className="score-label">{editingMatch.team2?.name || 'Команда 2'}</label>
                  <input
                    type="number"
                    value={scoreForm.team2_score}
                    onChange={(e) => setScoreForm({ ...scoreForm, team2_score: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="score-input"
                  />
                </div>
              </div>
              
              {scoreForm.team1_score !== scoreForm.team2_score && (
                <div className="winner-preview">
                  <p className="winner-preview-text">
                    Победитель: {scoreForm.team1_score > scoreForm.team2_score 
                      ? editingMatch.team1?.name 
                      : editingMatch.team2?.name}
                  </p>
                </div>
              )}
              
              <div className="form-actions">
                <button
                  onClick={updateMatchResult}
                  disabled={submitting}
                  className="btn-save"
                >
                  {submitting ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ РЕЗУЛЬТАТ'}
                </button>
                <button onClick={() => setEditingMatch(null)} className="btn-cancel">
                  ОТМЕНА
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно настроек матча */}
      {showMetaModal && metaMatch && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">НАСТРОЙКИ МАТЧА</h2>
              <button onClick={() => setShowMetaModal(false)} className="btn-close">×</button>
            </div>
            
            <div className="modal-body">
              <div className="match-teams small">
                <div className="match-team-name">{metaMatch.team1?.name || 'Команда 1'}</div>
                <div className="match-vs">VS</div>
                <div className="match-team-name">{metaMatch.team2?.name || 'Команда 2'}</div>
              </div>
              
              <div className="meta-form">
                <div className="form-group">
                  <label className="form-label">СТАТУС МАТЧА</label>
                  <select
                    value={metaForm.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as MatchStatus;
                      const oldStatus = metaMatch.status;
                      const warning = getStatusChangeWarning(oldStatus, newStatus);
                      if (warning && !confirm(warning)) {
                        return;
                      }
                      setMetaForm({ ...metaForm, status: newStatus });
                    }}
                    className="form-select"
                  >
                    <option value="pending">В ожидании</option>
                    <option value="scheduled">Запланирован</option>
                    <option value="live">В прямом эфире</option>
                    <option value="finished">Завершен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                  <div className="status-hint">
                    {metaForm.status === 'pending' && 'Матч в черновике: можно менять команды, дату и коэффициенты.'}
                    {metaForm.status === 'finished' && 'При изменении статуса результаты будут сброшены'}
                    {metaForm.status === 'live' && 'Матч в прямом эфире. Команды, дата и коэффициенты недоступны для изменения.'}
                    {metaForm.status === 'scheduled' && 'Матч запланирован'}
                    {metaForm.status === 'cancelled' && 'Матч отменен'}
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">ДАТА И ВРЕМЯ</label>
                  <select
                    value={metaForm.start_time}
                    onChange={(e) => handleDateTimeChange(e.target.value)}
                    className={`form-select ${dateError ? 'input-error' : ''}`}
                    disabled={!canEditDateTimeAndOdds(metaForm.status)}
                  >
                    <option value="">— Выберите дату и время —</option>
                    {availableDateTimes.map(dt => (
                      <option key={dt.value} value={dt.value}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                  {!canEditDateTimeAndOdds(metaForm.status) && (
                    <div className="status-hint warning">
                      Дата и время недоступны для изменения при статусе "{metaForm.status === 'live' ? 'В эфире' : metaForm.status === 'finished' ? 'Завершен' : ''}"
                    </div>
                  )}
                  {dateError && (
                    <div className="date-error-message">{dateError}</div>
                  )}
                  <div className="date-hint">
                    Доступные дни: 29, 30, 31 июля и 1, 2 августа 2026
                  </div>
                  <div className="date-hint">
                    Доступное время: 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">КОЭФФИЦИЕНТЫ</label>
                  <div className="odds-input-group">
                    <div className="odds-field">
                      <span className="odds-team">{metaMatch.team1?.name || 'Team 1'}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        max="99.99"
                        value={metaForm.odds_team1}
                        onChange={(e) => setMetaForm({ ...metaForm, odds_team1: e.target.value })}
                        className="form-input"
                        placeholder="1.90"
                        disabled={!canEditDateTimeAndOdds(metaForm.status)}
                      />
                    </div>
                    <div className="odds-field">
                      <span className="odds-team">{metaMatch.team2?.name || 'Team 2'}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        max="99.99"
                        value={metaForm.odds_team2}
                        onChange={(e) => setMetaForm({ ...metaForm, odds_team2: e.target.value })}
                        className="form-input"
                        placeholder="1.90"
                        disabled={!canEditDateTimeAndOdds(metaForm.status)}
                      />
                    </div>
                    <div className="odds-field">
                      <span className="odds-team">Ничья</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        max="99.99"
                        value={metaForm.odds_draw}
                        onChange={(e) => setMetaForm({ ...metaForm, odds_draw: e.target.value })}
                        className="form-input"
                        placeholder="3.20"
                        disabled={!canEditDateTimeAndOdds(metaForm.status)}
                      />
                    </div>
                  </div>
                  {!canEditDateTimeAndOdds(metaForm.status) && (
                    <div className="status-hint warning">
                      Коэффициенты недоступны для изменения при статусе "{metaForm.status === 'live' ? 'В эфире' : metaForm.status === 'finished' ? 'Завершен' : ''}"
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  onClick={saveMatchMeta}
                  disabled={submitting || !!dateError}
                  className="btn-save"
                >
                  {submitting ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ НАСТРОЙКИ'}
                </button>
                <button onClick={() => setShowMetaModal(false)} className="btn-cancel">
                  ОТМЕНА
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}