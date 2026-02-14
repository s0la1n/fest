'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const DAYS = ['29 марта', '30 марта', '31 марта', '1 апреля', '2 апреля'];
const DAY_KEYS = ['2026-03-29', '2026-03-30', '2026-03-31', '2026-04-01', '2026-04-02'];

interface ScheduleEvent {
  id: number;
  short_name: string;
  description?: string;
  start_time?: string;
  end_time?: string | null;
  day: number;
}

function teamName(t: any) {
  return t?.tournament_application?.team_name || t?.display_name || t?.name || 'TBD';
}

interface ScheduleData {
  matches: any[];
  games: any[];
  by_day: Record<string, any[]>;
  schedules: any[];
}

interface BracketMatch {
  id: number;
  stage?: string;
  team1?: { display_name?: string; name?: string };
  team2?: { display_name?: string; name?: string };
  team1_score?: number;
  team2_score?: number;
  status?: string;
}

export default function SchedulePage() {
  const { user, hasRole } = useAuth();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [data, setData] = useState<ScheduleData>({
    matches: [],
    games: [],
    by_day: {},
    schedules: [],
  });
  const [bracket, setBracket] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [form, setForm] = useState({ short_name: '', description: '', start_time: '10:00', day: 1 });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user && hasRole('admin');

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<ScheduleData>('/schedule');
      setData({
        matches: result.matches ?? [],
        games: result.games ?? [],
        by_day: result.by_day ?? {},
        schedules: result.schedules ?? [],
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Ошибка загрузки расписания.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      const fetchBracket = async () => {
        try {
          const result = await apiClient.get<BracketMatch[]>(`/schedule/bracket/${selectedGame}`);
          setBracket(Array.isArray(result) ? result : []);
        } catch (err) {
          console.error('Ошибка загрузки турнирной сетки:', err);
          setBracket([]);
        }
      };
      fetchBracket();
    } else {
      setBracket([]);
    }
  }, [selectedGame]);

  const matchesForDay = data.by_day?.[DAY_KEYS[selectedDay]] ?? [];
  const schedulesForDay = (data.schedules || []).filter((s: any) => s.day === selectedDay + 1);
  const gameNames: Record<number, string> = {};
  (data.games || []).forEach((g: any) => { 
    if (g.id && g.name) {
      gameNames[g.id] = g.name;
    }
  });

  const bracketRows = (() => {
    if (bracket.length === 0) return [];
    const byStage: Record<string, any[]> = {};
    bracket.forEach((m) => {
      const s = m.stage || 'group';
      if (!byStage[s]) byStage[s] = [];
      byStage[s].push(m);
    });
    const order = ['group', 'quarterfinal', 'semifinal', 'final'];
    return order.filter((s) => byStage[s]?.length).map((s) => ({ stage: s, matches: byStage[s] }));
  })();

  const stageLabels: Record<string, string> = {
    group: 'Группы',
    quarterfinal: '1/4 финала',
    semifinal: '1/2 финала',
    final: 'Финал',
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setForm({ short_name: '', description: '', start_time: '10:00', day: selectedDay + 1 });
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEditModal = (s: ScheduleEvent) => {
    setEditingEvent(s);
    setForm({
      short_name: s.short_name || '',
      description: s.description || '',
      start_time: s.start_time || '10:00',
      day: s.day,
    });
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    setSubmitError(null);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingEvent) {
        await apiClient.put(`/admin/schedule/events/${editingEvent.id}`, {
          short_name: form.short_name.trim(),
          description: form.description.trim() || null,
          start_time: form.start_time,
          day: form.day,
        });
      } else {
        await apiClient.post('/admin/schedule/events', {
          short_name: form.short_name.trim(),
          description: form.description.trim() || null,
          start_time: form.start_time,
          day: form.day,
        });
      }
      closeModal();
      await fetchSchedule();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setSubmitError(e?.message || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Удалить это событие?')) return;
    try {
      await apiClient.delete(`/admin/schedule/events/${id}`);
      await fetchSchedule();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-200 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Расписание фестиваля</h1>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00f5ff]"></div>
            <p className="mt-4 text-slate-400">Загрузка расписания...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-200 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Расписание фестиваля</h1>
          <div className="bg-[#ff006e]/10 border border-[#ff006e]/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Ошибка загрузки</h2>
            <p className="text-[#ff006e]">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Расписание фестиваля</h1>

        <div className="flex flex-wrap gap-2 mb-8">
          {DAYS.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedDay === i 
                  ? 'bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc]' 
                  : 'bg-[#12121a] hover:bg-[#16161f] border border-[#1a1a24]'
              }`}
            >
              День {i + 1} ({d})
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Левая колонка - события дня */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">События дня</h2>
              {isAdmin && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-4 py-2 rounded-lg bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] text-sm font-medium transition"
                >
                  + Добавить событие
                </button>
              )}
            </div>

            {schedulesForDay.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="text-lg font-medium text-[#00f5ff]">Расписание</h3>
                {schedulesForDay.map((s: ScheduleEvent) => (
                  <div key={s.id} className="bg-[#12121a] rounded-lg p-4 border border-slate-600 hover:border-[#00f5ff]/50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{s.short_name || 'Событие'}</p>
                        <p className="text-slate-400 text-sm">{s.description || 'Описание отсутствует'}</p>
                        <p className="text-[#00f5ff] text-sm mt-1">
                          {s.start_time || 'Время не указано'}
                          {s.end_time && ` - ${s.end_time}`}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(s)}
                            className="px-2 py-1 rounded bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs"
                          >
                            Изменить
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(s.id)}
                            className="px-2 py-1 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300 text-xs"
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {matchesForDay.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#00f5ff]">Матчи</h3>
                {matchesForDay.map((m: any) => (
                  <div key={m.id} className="bg-[#12121a] rounded-lg p-4 border border-slate-600 hover:border-[#00f5ff]/50 transition-colors">
                    <p className="text-[#00f5ff] text-sm mb-1">
                      {gameNames[m.game_id] || 'Игра'}
                    </p>
                    <p className="font-medium text-white">
                      {teamName(m.team1)} vs {teamName(m.team2)}
                    </p>
                    {m.start_time && (
                      <p className="text-slate-500 text-sm">
                        {new Date(m.start_time).toLocaleTimeString('ru-RU', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    )}
                    {m.status && (
                      <p className={`text-xs font-medium mt-1 ${
                        m.status === 'completed' ? 'text-green-400' :
                        m.status === 'live' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {m.status === 'completed' ? 'Завершен' :
                         m.status === 'live' ? 'В прямом эфире' :
                         m.status === 'upcoming' ? 'Предстоящий' : m.status}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {schedulesForDay.length === 0 && matchesForDay.length === 0 && (
              <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
                <p className="text-slate-500">Нет событий на этот день</p>
                <p className="text-slate-600 text-sm mt-2">Выберите другой день</p>
              </div>
            )}
          </div>

          {/* Правая колонка - турнирная сетка */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Турнирная сетка</h2>
            
            {data.games && data.games.length > 0 ? (
              <>
                <div className="space-y-2 mb-6">
                  <p className="text-slate-400 text-sm mb-2">Выберите игру:</p>
                  {data.games.map((g: any) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGame(selectedGame === g.id ? null : g.id)}
                      className={`w-full py-3 px-4 rounded-lg text-left transition-colors ${
                        selectedGame === g.id 
                          ? 'bg-cyan-600 hover:bg-cyan-700' 
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{g.name || `Игра ${g.id}`}</span>
                        {selectedGame === g.id && (
                          <span className="text-xs bg-cyan-800 px-2 py-1 rounded">Открыть сетку</span>
                        )}
                      </div>
                      {g.description && (
                        <p className="text-slate-400 text-xs mt-1 truncate">{g.description}</p>
                      )}
                    </button>
                  ))}
                </div>

                {selectedGame && (
                  <div className="bg-slate-800 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-medium text-white mb-4">
                      Турнирная сетка: {gameNames[selectedGame] || `Игра ${selectedGame}`}
                    </h3>
                    
                    {bracket.length > 0 ? (
                      <div className="overflow-x-auto">
                        <div className="flex gap-6 min-w-max">
                          {bracketRows.map((row, ri) => (
                            <div key={ri} className="flex flex-col gap-4">
                              <p className="text-[#00f5ff] text-sm font-medium">
                                {stageLabels[row.stage] || row.stage}
                              </p>
                              {row.matches.map((m: any) => (
                                <div key={m.id} className="relative">
                                  <div className={`border rounded-lg overflow-hidden min-w-[180px] ${
                                    m.status === 'completed' ? 'border-green-600 bg-green-900/20' :
                                    m.status === 'live' ? 'border-red-600 bg-red-900/20' :
                                    'border-slate-600 bg-slate-700'
                                  }`}>
                                    <div className="px-3 py-2 border-b border-slate-600 text-sm text-white truncate max-w-[180px]">
                                      {teamName(m.team1)}
                                      {m.team1_score !== undefined && ` (${m.team1_score})`}
                                    </div>
                                    <div className="px-3 py-2 text-sm text-white truncate max-w-[180px]">
                                      {teamName(m.team2)}
                                      {m.team2_score !== undefined && ` (${m.team2_score})`}
                                    </div>
                                  </div>
                                  {ri < bracketRows.length - 1 && (
                                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-px bg-slate-500" />
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500">Данные турнирной сетки отсутствуют</p>
                        <p className="text-slate-600 text-sm mt-2">
                          Сетка будет доступна после начала турнира
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
                <p className="text-slate-500">Нет доступных игр</p>
                <p className="text-slate-600 text-sm mt-2">
                  Игры будут добавлены организаторами
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Модальное окно: добавление / редактирование события (только админ) */}
        {modalOpen && isAdmin && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#12121a] border border-[#1a1a24] rounded-xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingEvent ? 'Редактировать событие' : 'Новое событие'}
              </h3>
              <form onSubmit={handleSubmitEvent} className="space-y-4">
                {submitError && (
                  <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{submitError}</p>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Название *</label>
                  <input
                    type="text"
                    required
                    value={form.short_name}
                    onChange={(e) => setForm((f) => ({ ...f, short_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:border-[#00f5ff]"
                    placeholder="Например: Открытие"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Описание</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:border-[#00f5ff]"
                    rows={3}
                    placeholder="Краткое описание события"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Время начала *</label>
                  <input
                    type="time"
                    required
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:border-[#00f5ff]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">День фестиваля *</label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm((f) => ({ ...f, day: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:border-[#00f5ff]"
                  >
                    {DAYS.map((d, i) => (
                      <option key={i} value={i + 1}>День {i + 1} ({d})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 rounded-lg bg-[#00f5ff] text-[#0a0a0f] font-medium hover:bg-[#00c4cc] disabled:opacity-50"
                  >
                    {submitting ? 'Сохранение...' : editingEvent ? 'Сохранить' : 'Добавить'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg border border-[#1a1a24] text-slate-300 hover:bg-[#1a1a24]"
                  >
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