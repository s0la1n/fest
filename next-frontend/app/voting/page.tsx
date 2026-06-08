'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import './voting.css';

interface Participant {
  id: number;
  character_name?: string;
  origin?: string;
  photo?: string;
  display_name?: string;
  votes_count?: number;
  has_voted?: boolean;
}

export default function VotingPage() {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    if (user) fetchParticipants();
  }, [user]);

  const fetchParticipants = async () => {
    try {
      const data = await apiClient.get<{ participants?: Participant[] }>('/voting/participants');
      setParticipants(data.participants ?? []);
    } catch {
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (participantId: number) => {
    if (!user) return;
    setVoting(participantId);
    setVoteError(null);
    try {
      await apiClient.post('/voting/vote', { participant_id: participantId });
      await fetchParticipants();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const msg = err?.response?.data?.message || err?.message || 'Не удалось проголосовать';
      setVoteError(msg);
    } finally {
      setVoting(null);
    }
  };

  const hasVotedAny = participants.some((p) => p.has_voted);

  // Пагинация
  const totalPages = Math.ceil(participants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParticipants = participants.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return (
      <div className="voting-page">
        <div className="voting-container">
          <div className="voting-unauth">
            <div className="voting-unauth-icon">⚠️</div>
            <h2 className="voting-unauth-title">ДОСТУП ЗАПРЕЩЁН</h2>
            <p className="voting-unauth-text">ВОЙДИТЕ В АККАУНТ, ЧТОБЫ УЧАСТВОВАТЬ В ГОЛОСОВАНИИ</p>
            <Link href="/signin" className="voting-unauth-link">ВОЙТИ</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-page">
      <div className="voting-container">
        <div className="voting-header">
          <h1 className="voting-title">ГОЛОСОВАНИЕ</h1>
          <p className="voting-description">ВЫБЕРИТЕ ЛУЧШЕГО КОСПЛЕЕРА</p>
        </div>

        {voteError && <div className="voting-error">{voteError}</div>}

        {loading ? (
          <PageLoader text="ЗАГРУЗКА УЧАСТНИКОВ..." className="voting-loader" />
        ) : participants.length === 0 ? (
          <div className="voting-empty">
            <p className="voting-empty-text">НЕТ УЧАСТНИКОВ ДЛЯ ГОЛОСОВАНИЯ</p>
            <p className="voting-empty-subtext">УЧАСТНИКОВ ДОБАВЛЯЕТ ОРГАНИЗАТОР КОНКУРСА</p>
          </div>
        ) : (
          <>
            <div className="voting-stats">
              <span className="voting-stats-count">ВСЕГО УЧАСТНИКОВ: {participants.length}</span>
              <span className="voting-stats-page">СТРАНИЦА {currentPage} ИЗ {totalPages}</span>
            </div>

            <div className="voting-grid">
              {currentParticipants.map((p) => {
                const isVoted = p.has_voted || hasVotedAny;
                const isVotingNow = voting === p.id;
                
                return (
                  <div key={p.id} className="voting-card">
                    <div className="voting-card-image">
                      {p.photo ? (
                        <img src={p.photo} alt={p.character_name || 'Участник'} />
                      ) : (
                        <div className="voting-card-placeholder">🎭</div>
                      )}
                    </div>
                    <div className="voting-card-info">
                      <h3 className="voting-card-name">
                        {p.character_name || `УЧАСТНИК #${p.id}`}
                      </h3>
                      {p.origin && (
                        <p className="voting-card-origin">{p.origin}</p>
                      )}
                      <p className="voting-card-votes">
                        ГОЛОСОВ: {p.votes_count ?? 0}
                      </p>
                      
                      {p.has_voted ? (
                        <button disabled className="voting-btn-disabled">
                          <span>ВЫ ПРОГОЛОСОВАЛИ</span>
                        </button>
                      ) : hasVotedAny ? (
                        <button disabled className="voting-btn-disabled">
                          <span>ГОЛОС УЖЕ УЧТЁН</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVote(p.id)}
                          disabled={isVotingNow}
                          className="btn-pink"
                        >
                          <span>{isVotingNow ? 'ОТПРАВКА...' : 'ГОЛОСОВАТЬ'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="voting-pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← НАЗАД
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
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
      </div>
    </div>
  );
}