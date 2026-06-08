'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import FAQ from '@/components/FAQ';
import './tournament.css';

const GAMES_FALLBACK = [
  { id: 1, slug: 'cs2', name: 'Counter-Strike 2', description: 'Командный тактический шутер от Valve. Проверь свою реакцию и командную работу.', official_url: 'https://www.counter-strike.net', logoClass: 'cs2' },
  { id: 2, slug: 'dota2', name: 'Dota 2', description: 'Многопользовательская командная игра в жанре MOBA. Стратегия и тактика.', official_url: 'https://www.dota2.com', logoClass: 'dota2' },
  { id: 3, slug: 'valorant', name: 'Valorant', description: 'Тактический шутер 5 на 5 от Riot Games. Точные выстрелы и умения.', official_url: 'https://playvalorant.com', logoClass: 'valorant' },
];

const REGISTRATION_RULES = [
  'Для подачи заявки необходимо написать письмо на официальную почту фестиваля: tournament@gamelabirint.ru',
  'Письмо должно быть оформлено строго по прикреплённому ниже шаблону. Заявки в свободной форме не рассматриваются.',
  'Организатор рассматривает заявку в течение 3 рабочих дней и отправляет ответ с решением: одобрение или отказ с указанием причины.',
  'В случае отказа команда может подать повторную заявку после устранения замечаний.',
  'Количество команд ограничено. Заявки принимаются до 20 июля 2026 года.',
];

const tournamentFaqItems = [
  { q: 'Как посмотреть команды турнира?', a: 'На этой странице выберите игру в табах выше и посмотрите зарегистрированные команды. Нажмите на карточку команды, чтобы увидеть полный состав.' },
  { q: 'Сколько человек в команде?', a: 'В каждой команде может быть до 5 игроков включая капитана. Запасные игроки не предусмотрены, но можно заменять игроков между матчами при условии уведомления организатора.' },
  { q: 'Какие призы?', a: 'Призовой фонд турнира составляет 500 000 рублей, который распределяется между победителями и призёрами. Также предусмотрены ценные подарки от партнёров.' },
  { q: 'Нужна ли предварительная регистрация?', a: 'Да, регистрация команд обязательна. Заявки принимаются до 20 июля 2026 года. Количество мест ограничено.' },
  { q: 'Можно ли участвовать онлайн?', a: 'Нет, все матчи проводятся очно на фестивале.' },
  { q: 'Есть ли возрастные ограничения?', a: 'Участники турнира должны быть не младше 14 лет. Для участников 14-18 лет требуется письменное согласие родителей.' },
  { q: 'Что нужно иметь для участия?', a: 'Для участия на фестивале нужен билет на мероприятие и подать заявку на турнир.' },
];

const TEMPLATE = `Тема письма: ЗАЯВКА НА ТУРНИР | [НАЗВАНИЕ КОМАНДЫ]

Тело письма:

=== ЗАЯВКА НА УЧАСТИЕ В ТУРНИРЕ "ИГРОВОЙ ЛАБИРИНТ 2026" ===

1. Название команды: ________________
2. Дисциплина: [CS2 / Dota 2 / Valorant]
3. Капитан команды (ФИО полностью): ________________
4. Контактный телефон: ________________
5. VK/MAX капитана: ________________
6. Город/регион: ________________

=== СОСТАВ КОМАНДЫ ===

| № | Никнейм | ФИО (полностью) | Роль |
|---|---------|-----------------|------|
| 1 | _______ | _______________ | Капитан |
| 2 | _______ | _______________ | Игрок |
| 3 | _______ | _______________ | Игрок |
| 4 | _______ | _______________ | Игрок |
| 5 | _______ | _______________ | Игрок |

=== ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ ===

• Есть ли опыт участия в турнирах? (да/нет, если да — указать какие): ________________
• Нужна ли помощь с проживанием? (да/нет): ________________
• Согласны ли с правилами турнира? (да/нет): ________________`;

export default function TournamentPage() {
  const [games, setGames] = useState<typeof GAMES_FALLBACK>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [modalTeam, setModalTeam] = useState<any | null>(null);

  useEffect(() => {
    apiClient.get<typeof GAMES_FALLBACK>('/games').then(setGames).catch(() => setGames(GAMES_FALLBACK));
  }, []);

  useEffect(() => {
    const gid = selectedGameId ?? games[0]?.id;
    if (gid) {
      apiClient.get<any[]>(`/teams/${gid}`).then((d) => (Array.isArray(d) ? d : [])).catch(() => []).then(setTeams);
    } else {
      setTeams([]);
    }
  }, [selectedGameId, games]);

  const displayGames = games.length ? games : GAMES_FALLBACK;
  const currentGameId = selectedGameId ?? displayGames[0]?.id ?? 1;
  const currentGame = displayGames.find(g => g.id === currentGameId);

  return (
    <div className="tournament-page">
      {/* Hero-блок */}
      <section className="hero-tournament-section">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <div className="hero-image">
            <div className="console-image"></div>
          </div>
          <div className="hero-text">
            <h1 className="hero-title">КИБЕРСПОРТИВНЫЙ<br />ТУРНИР</h1>
            <div className='hero-description-back'>
              <p className="hero-description">
                CS2, Dota 2, Valorant — выбери свою арену и докажи, что ты лучший.
              </p>
            </div>
            <Link href="/schedule" className="btn-pink">
              РАСПИСАНИЕ
            </Link>
          </div>
        </div>
      </section>

      {/* Игры турнира */}
      <section className="section-pixel">
        <div className="container-pixel">
          <h2 className="section-title">ИГРЫ ТУРНИРА</h2>
          <p className="section-subtitle">Выбери свою дисциплину</p>
          <div className="games-grid">
            {displayGames.map((g) => (
              <div key={g.id} className="game-card">
                <h3 className="game-name">{g.name}</h3>
                <p className="game-desc">{g.description}</p>
                <a href={g.official_url} target="_blank" rel="noopener noreferrer" className="game-link">
                  Официальный сайт →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Правила регистрации */}
      <section className="section-pixel">
        <div className="container-pixel">
          <h2 className="section-title">ПРАВИЛА РЕГИСТРАЦИИ</h2>
          <p className="section-subtitle">Как стать участником турнира</p>
          <div className="rules-grid">
            {REGISTRATION_RULES.map((rule, i) => (
              <div key={i} className="rule-item">
                <div className="rule-number">{i + 1}</div>
                <div className="rule-text">{rule}</div>
              </div>
            ))}
            <div className="template-block">
              <div className="template-title">✧ ШАБЛОН ЗАЯВКИ ✧</div>
              <p style={{ fontSize: '12px', marginBottom: '8px' }}>Скопируйте и заполните этот шаблон:</p>
              <pre className="template-code">{TEMPLATE}</pre>
              <p style={{ fontSize: '11px', marginTop: '12px', color: '#64748b' }}>
                Отправьте заполненную заявку на почту: <a href="mailto:festival2026.test@gmail.com?subject=Заявка%20на%20турнир" style={{ textDecoration: 'none'}}><strong style={{ color: '#54FEDD'}}>festival2026.test@gmail.com</strong></a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Команды */}
      <section className="section-pixel">
        <div className="container-pixel">
          <h2 className="section-title">КОМАНДЫ</h2>
          <p className="section-subtitle">Зарегистрированные участники</p>
          
          <div className="tabs-container">
            {displayGames.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGameId(g.id)}
                className={`tab-btn ${currentGameId === g.id ? 'active' : ''}`}
              >
                {g.name}
              </button>
            ))}
          </div>
          
          <div className="teams-grid">
            {teams.length > 0 ? teams.map((t) => (
              <button key={t.id} onClick={() => setModalTeam(t)} className="team-card">
                <div className="team-name">{t.team_name || t.display_name || 'Команда'}</div>
                <div className="team-meta">Состав: {t.players?.length || 0} игроков</div>
              </button>
            )) : (
              <div className="text-center" style={{ gridColumn: '1/-1', padding: '40px', color: '#64748b' }}>
                Нет зарегистрированных команд для {currentGame?.name}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ 
        items={tournamentFaqItems} 
        title="ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ" 
        subtitle="Всё, что нужно знать перед посещением"
        color="magenta"
      />

      {/* Модальное окно */}
      {modalTeam && (
        <div className="modal-overlay" onClick={() => setModalTeam(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{modalTeam.team_name || 'Состав команды'}</h2>
            {modalTeam.players?.length > 0 ? (
              <ul className="modal-players">
                {modalTeam.players.map((p: any) => (
                  <li key={p.id} className="modal-player">
                    <span>{p.display_name || p.name || 'Игрок'}</span>
                    <span className="modal-role">{p.role === 'captain' ? 'Капитан' : 'Игрок'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="modal-empty">Состав не указан</div>
            )}
            <button onClick={() => setModalTeam(null)} className="modal-close">
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}