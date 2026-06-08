'use client';

import './teams.css';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';

type Player = {
  id: number;
  name: string;
  nickname: string;
  role: string;
};

type Team = {
  id: number;
  game_id: number;
  game_name: string;
  team_name: string;
  tag: string;
  city: string;
  status: string;
  players: Player[];
};

type Game = {
  id: number;
  name: string;
};

const MAX_TEAMS_PER_GAME = 8;

export default function OrganizerTournamentTeamsPage() {
  const { user, hasRole } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Фильтры и поиск
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Константа для количества игроков
  const REQUIRED_PLAYERS = 5;
  
  // Лимит команд для выбранной игры
  const [teamsCountForSelectedGame, setTeamsCountForSelectedGame] = useState(0);
  const [maxTeamsReached, setMaxTeamsReached] = useState(false);
  
  const [form, setForm] = useState({
    game_id: '',
    team_name: '',
    tag: '',
    city: '',
    players: Array(REQUIRED_PLAYERS).fill({ name: '', nickname: '', role: 'player' }) as { name: string; nickname: string; role: string }[],
  });

  useEffect(() => {
    if (user && (hasRole('organizer') || hasRole('admin'))) {
      loadTeams();
    } else {
      setLoading(false);
    }
  }, [user, hasRole]);

  const loadTeams = async () => {
    try {
      const data = await apiClient.get<{ teams: Team[]; games: Game[] }>('/organizer/tournament/teams');
      setTeams(data.teams || []);
      setGames(data.games || []);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось загрузить команды');
    } finally {
      setLoading(false);
    }
  };

  // Проверка лимита команд для выбранной игры
  const checkTeamLimit = (gameId: string) => {
    const count = teams.filter(t => t.game_id === parseInt(gameId)).length;
    setTeamsCountForSelectedGame(count);
    const isLimitReached = count >= MAX_TEAMS_PER_GAME;
    setMaxTeamsReached(isLimitReached);
    return !isLimitReached;
  };

  // При смене выбранной игры в форме
  const handleGameChange = (newGameId: string) => {
    setForm({ ...form, game_id: newGameId });
    const count = teams.filter(t => t.game_id === parseInt(newGameId)).length;
    setTeamsCountForSelectedGame(count);
    if (count >= MAX_TEAMS_PER_GAME) {
      setMaxTeamsReached(true);
      setError(`Для выбранной игры уже ${count} команд (максимум ${MAX_TEAMS_PER_GAME}). Создание новой команды невозможно.`);
    } else {
      setMaxTeamsReached(false);
      setError('');
    }
  };

  // Применение фильтров
  useEffect(() => {
    let result = [...teams];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(team => 
        team.team_name.toLowerCase().includes(query) ||
        team.tag.toLowerCase().includes(query)
      );
    }
    
    if (gameFilter !== 'all') {
      result = result.filter(team => team.game_id === parseInt(gameFilter));
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(team => team.status === statusFilter);
    }
    
    setFilteredTeams(result);
    setCurrentPage(1);
  }, [teams, searchQuery, gameFilter, statusFilter]);

  // Пагинация
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeams = filteredTeams.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту команду?')) return;
    
    try {
      await apiClient.delete(`/organizer/tournament/teams/${id}`);
      setSuccess('Команда удалена');
      loadTeams();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Ошибка удаления');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusChange = async (teamId: number, newStatus: string) => {
    try {
      await apiClient.put(`/organizer/tournament/teams/${teamId}`, { status: newStatus });
      setSuccess('Статус команды обновлен');
      loadTeams();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Ошибка обновления статуса');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (team: Team) => {
    const playersArray = Array(REQUIRED_PLAYERS).fill({ name: '', nickname: '', role: 'player' });
    
    team.players.forEach((player, index) => {
      if (index < REQUIRED_PLAYERS) {
        playersArray[index] = {
          name: player.name || '',
          nickname: player.nickname || '',
          role: player.role,
        };
      }
    });
    
    setEditingTeam(team);
    setForm({
      game_id: team.game_id.toString(),
      team_name: team.team_name,
      tag: team.tag,
      city: team.city,
      players: playersArray,
    });
    // Для редактирования проверяем лимит (кроме текущей команды)
    const otherTeamsCount = teams.filter(t => t.game_id === team.game_id && t.id !== team.id).length;
    setTeamsCountForSelectedGame(otherTeamsCount + 1);
    setMaxTeamsReached(false);
    setError('');
    setShowModal(true);
  };

  const handleAdd = () => {
    const defaultGameId = games[0]?.id.toString() || '';
    const count = teams.filter(t => t.game_id === parseInt(defaultGameId)).length;
    
    if (count >= MAX_TEAMS_PER_GAME) {
      setError(`Для игры "${games[0]?.name}" уже достигнут лимит команд (${MAX_TEAMS_PER_GAME}). Создание новой команды невозможно.`);
      return;
    }
    
    setEditingTeam(null);
    setForm({
      game_id: defaultGameId,
      team_name: '',
      tag: '',
      city: '',
      players: Array(REQUIRED_PLAYERS).fill({ name: '', nickname: '', role: 'player' }),
    });
    setTeamsCountForSelectedGame(count);
    setMaxTeamsReached(count >= MAX_TEAMS_PER_GAME);
    setError('');
    setShowModal(true);
  };

  const updatePlayer = (index: number, field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      players: prev.players.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const getDuplicateNicknames = (): string[] => {
    const nicknames = form.players
      .map(p => p.nickname.trim())
      .filter(n => n !== '');
    
    const duplicates = nicknames.filter((nick, index) => nicknames.indexOf(nick) !== index);
    return [...new Set(duplicates)];
  };

  const getCaptainCount = (): number => {
    return form.players.filter(p => p.role === 'captain').length;
  };

  const areAllPlayersFilled = (): boolean => {
    return form.players.every(p => p.nickname.trim() !== '');
  };

  const validateForm = (): string | null => {
    if (!form.game_id) return 'Выберите игру';
    if (!form.team_name.trim()) return 'Введите название команды';
    if (!form.tag.trim()) return 'Введите тег команды';
    if (form.tag.length < 3 || form.tag.length > 10) return 'Тег должен содержать 3-10 символов';
    if (!form.city.trim()) return 'Введите город';
    if (!areAllPlayersFilled()) return 'Заполните никнеймы всех 5 игроков';
    
    const duplicates = getDuplicateNicknames();
    if (duplicates.length > 0) {
      return `Обнаружены повторяющиеся никнеймы: ${duplicates.join(', ')}`;
    }
    
    const captainCount = getCaptainCount();
    if (captainCount === 0) return 'Выберите капитана команды (должен быть один капитан)';
    if (captainCount > 1) return 'Может быть только один капитан команды';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка лимита команд при создании новой
    if (!editingTeam) {
      const currentCount = teams.filter(t => t.game_id === parseInt(form.game_id)).length;
      if (currentCount >= MAX_TEAMS_PER_GAME) {
        setError(`Для выбранной игры уже ${currentCount} команд (максимум ${MAX_TEAMS_PER_GAME}). Создание новой команды невозможно.`);
        return;
      }
    }
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    const submitData = {
      game_id: parseInt(form.game_id),
      team_name: form.team_name.trim(),
      tag: form.tag.trim().toUpperCase(),
      city: form.city.trim(),
      players: form.players.map(p => ({
        name: p.name.trim() || null,
        nickname: p.nickname.trim(),
        role: p.role,
      })),
    };
    
    try {
      if (editingTeam) {
        await apiClient.put(`/organizer/tournament/teams/${editingTeam.id}`, {
          game_id: submitData.game_id,
          team_name: submitData.team_name,
          tag: submitData.tag,
          city: submitData.city,
        });
        setSuccess('Команда обновлена');
      } else {
        await apiClient.post('/organizer/tournament/teams', submitData);
        setSuccess('Команда создана');
      }
      setShowModal(false);
      loadTeams();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка сохранения');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setGameFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Получение количества команд для конкретной игры
  const getTeamsCountForGame = (gameId: number) => {
    return teams.filter(t => t.game_id === gameId).length;
  };

  if (!user || (!hasRole('organizer') && !hasRole('admin'))) {
    return (
      <div className="access-denied">
        <p className="access-denied-text">Доступ только для организатора.</p>
      </div>
    );
  }

  const hasErrors = validateForm() !== null;
  const duplicateNicknames = getDuplicateNicknames();
  const captainCount = getCaptainCount();
  const allPlayersFilled = areAllPlayersFilled();
  const isSubmitDisabled = submitting || hasErrors || (!editingTeam && maxTeamsReached);

  return (
    <div className="organizer-teams-page">
      <div className="organizer-teams-container">
        <div className="organizer-teams-header">
          <div className="organizer-teams-title-section">
            <h1 className="organizer-teams-title">Управление командами</h1>
            <p className="organizer-teams-description">
              Создание, редактирование и удаление команд (максимум {MAX_TEAMS_PER_GAME} команд на игру, 
              в команде обязательно 5 игроков, 1 капитан)
            </p>
          </div>
          <button onClick={handleAdd} className="btn-primary">
            + Добавить команду
          </button>
        </div>

        {error && <div className="message-error">{error}</div>}
        {success && <div className="message-success">{success}</div>}

        <div className="teams-filters">
          <div className="filter-row">
            <div className="filter-group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или тегу..."
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <select
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Все игры</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>
                    {game.name} ({getTeamsCountForGame(game.id)}/{MAX_TEAMS_PER_GAME})
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>
            </div>
            <button onClick={resetFilters} className="filter-reset-btn">
              Сбросить
            </button>
          </div>
          <div className="filter-stats">
            Найдено команд: {filteredTeams.length} из {teams.length}
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : filteredTeams.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Команд не найдено.</p>
            <button onClick={handleAdd} className="empty-state-link">
              Добавить первую команду
            </button>
          </div>
        ) : (
          <>
            <div className="teams-stats">
              <span className="teams-stats-count">ВСЕГО КОМАНД: {filteredTeams.length}</span>
              <span className="teams-stats-page">
                СТРАНИЦА {currentPage} ИЗ {totalPages} (ПОКАЗАНО: {currentTeams.length})
              </span>
            </div>

            <div className="teams-table-wrapper">
              <table className="teams-table">
                <thead>
                  <tr>
                    <th>Команда</th>
                    <th>Тег</th>
                    <th>Игра</th>
                    <th>Город</th>
                    <th>Игроки</th>
                    <th>Статус</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {currentTeams.map((team) => (
                    <tr key={team.id}>
                      <td>
                        <div className="team-info">
                          <span className="team-name">{team.team_name}</span>
                        </div>
                      </td>
                      <td><span className="team-tag">{team.tag}</span></td>
                      <td><span className="team-game">{team.game_name}</span></td>
                      <td><span className="team-city">{team.city}</span></td>
                      <td>
                        <div className="players-list">
                          {team.players.slice(0, 3).map((player) => (
                            <span key={player.id} className="player-badge">
                              {player.nickname || player.name || 'Игрок'}
                              {player.role === 'captain' && <span className="player-captain"> 👑</span>}
                            </span>
                          ))}
                          {team.players.length > 3 && (
                            <span className="player-more">+{team.players.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          value={team.status}
                          onChange={(e) => handleStatusChange(team.id, e.target.value)}
                          className={`status-select ${team.status === 'active' ? 'status-active' : 'status-inactive'}`}
                        >
                          <option value="active">Активна</option>
                          <option value="inactive">Неактивна</option>
                        </select>
                      </td>
                      <td className="actions-cell">
                        <div className="actions-group">
                          <button onClick={() => handleEdit(team)} className="btn-edit">
                            ✎
                          </button>
                          <button onClick={() => handleDelete(team.id)} className="btn-delete">
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="teams-pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← НАЗАД
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (totalPages <= 7) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      );
                    }
                    
                    if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      );
                    }
                    
                    if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={page} className="pagination-dots">...</span>;
                    }
                    
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  ВПЕРЁД →
                </button>
              </div>
            )}
          </>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <h2 className="modal-title">
                {editingTeam ? 'Редактировать команду' : 'Добавить команду'}
              </h2>
              <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                  <label className="form-label">Игра *</label>
                  <select
                    value={form.game_id}
                    onChange={(e) => handleGameChange(e.target.value)}
                    required
                    className="form-select"
                    disabled={!!editingTeam}
                  >
                    {games.map((game) => {
                      const teamsCount = teams.filter(t => t.game_id === game.id).length;
                      const isFull = teamsCount >= MAX_TEAMS_PER_GAME;
                      const isCurrentGame = editingTeam && editingTeam.game_id === game.id;
                      return (
                        <option 
                          key={game.id} 
                          value={game.id}
                          disabled={!editingTeam && isFull}
                        >
                          {game.name} ({teamsCount}/{MAX_TEAMS_PER_GAME}) {!editingTeam && isFull && ' - ЛИМИТ'}
                        </option>
                      );
                    })}
                  </select>
                  {!editingTeam && maxTeamsReached && (
                    <div className="limit-warning">
                      ⚠️ Для выбранной игры уже {teamsCountForSelectedGame} команд (максимум {MAX_TEAMS_PER_GAME})
                    </div>
                  )}
                  {editingTeam && (
                    <div className="limit-hint">
                      ℹ️ Игру нельзя изменить при редактировании. При необходимости удалите команду и создайте заново.
                    </div>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Название команды *</label>
                    <input
                      type="text"
                      value={form.team_name}
                      onChange={(e) => setForm({ ...form, team_name: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Тег (3-10 символов) *</label>
                    <input
                      type="text"
                      value={form.tag}
                      onChange={(e) => setForm({ ...form, tag: e.target.value.toUpperCase() })}
                      required
                      placeholder="DRGN"
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Город *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <div className="players-header">
                    <label className="form-label">Состав команды (ровно {REQUIRED_PLAYERS} игроков, 1 капитан) *</label>
                    <div className="players-status">
                      {!allPlayersFilled && (
                        <span className="status-warning">⚠️ Заполните всех {REQUIRED_PLAYERS} игроков</span>
                      )}
                      {captainCount === 0 && allPlayersFilled && (
                        <span className="status-warning">⚠️ Выберите капитана</span>
                      )}
                      {captainCount > 1 && (
                        <span className="status-error">❌ Может быть только один капитан</span>
                      )}
                      {duplicateNicknames.length > 0 && (
                        <span className="status-error">❌ Повторяющиеся никнеймы: {duplicateNicknames.join(', ')}</span>
                      )}
                      {allPlayersFilled && captainCount === 1 && duplicateNicknames.length === 0 && (
                        <span className="status-success">✓ Все поля заполнены корректно</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="players-editor">
                    {form.players.map((player, index) => (
                      <div key={index} className="player-row">
                        <div className="player-number">{index + 1}</div>
                        <input
                          type="text"
                          placeholder="Никнейм *"
                          value={player.nickname}
                          onChange={(e) => updatePlayer(index, 'nickname', e.target.value)}
                          className={`player-input nickname-input ${!player.nickname.trim() && 'input-error'}`}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Настоящее имя"
                          value={player.name}
                          onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                          className="player-input name-input"
                        />
                        <label className="player-role-label">
                          <input
                            type="radio"
                            name="captain"
                            checked={player.role === 'captain'}
                            onChange={() => {
                              const newPlayers = form.players.map(p => ({ ...p, role: 'player' }));
                              newPlayers[index].role = 'captain';
                              setForm(prev => ({ ...prev, players: newPlayers }));
                            }}
                            className="captain-radio"
                          />
                          <span className="captain-label">Капитан</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    disabled={isSubmitDisabled} 
                    className="btn-save"
                  >
                    {submitting ? 'Сохранение...' : (editingTeam ? 'Сохранить' : 'Добавить')}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}