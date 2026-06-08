'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PageLoader from '@/components/ui/PageLoader';
import './schedule.css';

const DAYS = ['29 июля', '30 июля', '31 июля', '1 августа', '2 августа'];
const DAY_KEYS = ['2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02'];

interface ScheduleEvent {
  id: number;
  short_name: string;
  description?: string;
  start_time?: string;
  end_time?: string | null;
  day: number;
}

function teamName(t: any) {
  return t?.team_name || t?.display_name || t?.name || 'TBD';
}

interface ScheduleData {
  matches: any[];
  games: any[];
  by_day: Record<string, any[]>;
  schedules: any[];
}

export default function SchedulePage() {
  const { user, hasRole } = useAuth();
  const [selectedDay, setSelectedDay] = useState(0);
  const [data, setData] = useState<ScheduleData>({
    matches: [],
    games: [],
    by_day: {},
    schedules: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [form, setForm] = useState({ short_name: '', description: '', start_time: '10:00', day: 1 });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeConflict, setTimeConflict] = useState<string | null>(null);

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

  const checkTimeConflict = (day: number, startTime: string, excludeEventId?: number): boolean => {
    const eventsForDay = (data.schedules || []).filter((s: ScheduleEvent) => s.day === day);
    
    for (const event of eventsForDay) {
      if (excludeEventId && event.id === excludeEventId) continue;
      
      if (event.start_time === startTime) {
        setTimeConflict(`Событие "${event.short_name}" уже запланировано на ${event.start_time}`);
        return true;
      }
    }
    
    setTimeConflict(null);
    return false;
  };

  const validateForm = (): boolean => {
    if (!form.short_name.trim()) {
      setSubmitError('Название события обязательно');
      return false;
    }
    
    if (!form.start_time) {
      setSubmitError('Время начала обязательно');
      return false;
    }
    
    if (checkTimeConflict(form.day, form.start_time, editingEvent?.id)) {
      setSubmitError('В это время уже запланировано другое событие');
      return false;
    }
    
    return true;
  };

  const matchesForDay = data.by_day?.[DAY_KEYS[selectedDay]] ?? [];
  const schedulesForDay = (data.schedules || []).filter((s: any) => s.day === selectedDay + 1);
  const gameNames: Record<number, string> = {};
  (data.games || []).forEach((g: any) => { 
    if (g.id && g.name) {
      gameNames[g.id] = g.name;
    }
  });

  const dayEvents = [
    ...schedulesForDay.map((s: ScheduleEvent) => ({
      type: 'schedule' as const,
      sortTime: s.start_time || '99:99',
      id: `schedule-${s.id}`,
      payload: s,
    })),
    ...matchesForDay.map((m: any) => {
      const localTime = m.start_time
        ? new Date(m.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        : '99:99';
      return {
        type: 'match' as const,
        sortTime: localTime,
        id: `match-${m.id}`,
        payload: m,
      };
    }),
  ].sort((a, b) => a.sortTime.localeCompare(b.sortTime));

  const openAddModal = () => {
    setEditingEvent(null);
    setForm({ short_name: '', description: '', start_time: '10:00', day: selectedDay + 1 });
    setSubmitError(null);
    setTimeConflict(null);
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
    setTimeConflict(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    setSubmitError(null);
    setTimeConflict(null);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
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
      const e = err as { message?: string; response?: { data?: { message?: string } } };
      const errorMessage = e?.response?.data?.message || e?.message || 'Ошибка сохранения';
      
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        setSubmitError('В это время уже запланировано другое событие');
      } else {
        setSubmitError(errorMessage);
      }
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

  const timeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute of ['00', '30']) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  if (loading) {
    return (
      <PageLoader text="ЗАГРУЗКА РАСПИСАНИЯ..." className="loader-container" />
    );
  }

  if (error) {
    return (
      <div className="schedule-page">
        <div className="schedule-container">
          <div className="schedule-header">
            <h1 className="schedule-title">РАСПИСАНИЕ ФЕСТИВАЛЯ</h1>
            <p className="schedule-description">РАСПИСАНИЕ МЕРОПРИЯТИЙ И МАТЧЕЙ</p>
          </div>
          <div className="empty-state">
            <p className="empty-text">ОШИБКА ЗАГРУЗКИ</p>
            <p className="empty-subtext">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="add-event-btn"
            >
              ПОВТОРИТЬ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <div className="schedule-container">
        <div className="schedule-header">
          <h1 className="schedule-title">РАСПИСАНИЕ ФЕСТИВАЛЯ</h1>
          <p className="schedule-description">РАСПИСАНИЕ МЕРОПРИЯТИЙ И МАТЧЕЙ</p>
        </div>

        <div className="days-tabs">
          {DAYS.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`day-tab ${selectedDay === i ? 'active' : ''}`}
            >
              ДЕНЬ {i + 1}<span className="day-date">{d}</span>
            </button>
          ))}
        </div>

        <div className="schedule-content">
          {/* События дня */}
          <div className="events-section">
            <div className="events-header">
              <h2 className="events-title">СОБЫТИЯ ДНЯ</h2>
              {isAdmin && (
                <button type="button" onClick={openAddModal} className="add-event-btn">
                  + ДОБАВИТЬ
                </button>
              )}
            </div>

            {dayEvents.length > 0 ? (
              <div className="schedule-list">
                {dayEvents.map((event) => {
                  if (event.type === 'schedule') {
                    const s = event.payload as ScheduleEvent;
                    return (
                      <div key={event.id} className="schedule-item">
                        <div className="schedule-time">{s.start_time || '--:--'}</div>
                        <div className="schedule-content-block">
                          <div className="schedule-item-header">
                            <h4 className="schedule-item-title">{s.short_name || 'СОБЫТИЕ'}</h4>
                            {isAdmin && (
                              <div className="schedule-item-actions">
                                <button type="button" onClick={() => openEditModal(s)} className="edit-btn">
                                  ✎
                                </button>
                                <button type="button" onClick={() => handleDeleteEvent(s.id)} className="delete-btn">
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                          {s.description && <p className="schedule-item-desc">{s.description}</p>}
                        </div>
                      </div>
                    );
                  }

                  const m = event.payload as any;
                  return (
                    <div key={event.id} className="schedule-item match-item">
                      <div className="schedule-time">
                        {m.start_time
                          ? new Date(m.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </div>
                      <div className="schedule-content-block">
                        <div className="schedule-item-header">
                          <h4 className="schedule-item-title">
                            {teamName(m.team1)} <span className="match-vs">VS</span> {teamName(m.team2)}
                          </h4>
                          <span className={`match-status-badge ${m.status}`}>
                            {m.status === 'completed' ? 'ЗАВЕРШЕН' :
                             m.status === 'live' ? 'В ЭФИРЕ' :
                             m.status === 'upcoming' ? 'ПРЕДСТОЯЩИЙ' : m.status}
                          </span>
                        </div>
                        <p className="schedule-item-desc">{gameNames[m.game_id] || 'МАТЧ'}</p>
                        {m.stage && <p className="match-stage">Этап: {m.stage}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p className="empty-text">НЕТ СОБЫТИЙ НА ЭТОТ ДЕНЬ</p>
                <p className="empty-subtext">ВЫБЕРИТЕ ДРУГОЙ ДЕНЬ</p>
              </div>
            )}
          </div>
        </div>

        {/* Модальное окно */}
        {modalOpen && isAdmin && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">
                {editingEvent ? 'РЕДАКТИРОВАТЬ СОБЫТИЕ' : 'НОВОЕ СОБЫТИЕ'}
              </h3>
              <form onSubmit={handleSubmitEvent} className="modal-form">
                {submitError && <div className="error-message">{submitError}</div>}
                {timeConflict && <div className="warning-message">⚠️ {timeConflict}</div>}
                
                <div className="form-group">
                  <label className="form-label">НАЗВАНИЕ *</label>
                  <input
                    type="text"
                    required
                    value={form.short_name}
                    onChange={(e) => setForm((f) => ({ ...f, short_name: e.target.value }))}
                    className="form-input"
                    placeholder="НАПРИМЕР: ОТКРЫТИЕ ФЕСТИВАЛЯ"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">ОПИСАНИЕ</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="form-textarea"
                    placeholder="КРАТКОЕ ОПИСАНИЕ СОБЫТИЯ"
                    rows={3}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ВРЕМЯ *</label>
                    <select
                      required
                      value={form.start_time}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, start_time: e.target.value }));
                        if (form.day && e.target.value) {
                          checkTimeConflict(form.day, e.target.value, editingEvent?.id);
                        }
                      }}
                      className="form-select"
                    >
                      {timeOptions().map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">ДЕНЬ *</label>
                    <select
                      value={form.day}
                      onChange={(e) => {
                        const newDay = Number(e.target.value);
                        setForm((f) => ({ ...f, day: newDay }));
                        if (newDay && form.start_time) {
                          checkTimeConflict(newDay, form.start_time, editingEvent?.id);
                        }
                      }}
                      className="form-select"
                    >
                      {DAYS.map((d, i) => (
                        <option key={i} value={i + 1}>ДЕНЬ {i + 1} ({d})</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-hint-info">
                  <span>🕐 ДОСТУПНОЕ ВРЕМЯ: 08:00 - 22:00 (ИНТЕРВАЛ 30 МИНУТ)</span>
                </div>
                
                <div className="modal-buttons">
                  <button
                    type="submit"
                    disabled={submitting || !!timeConflict}
                    className="modal-submit"
                  >
                    {submitting ? 'СОХРАНЕНИЕ...' : editingEvent ? 'СОХРАНИТЬ' : 'ДОБАВИТЬ'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="modal-cancel"
                  >
                    ОТМЕНА
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