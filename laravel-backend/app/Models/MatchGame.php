<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatchGame extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_LIVE = 'live';
    public const STATUS_FINISHED = 'finished';
    public const STATUS_CANCELLED = 'cancelled';

    public const STAGE_ORDER = [
        'quarterfinal',
        'semifinal',
        'final',
    ];

    protected $fillable = [
        'game_id',
        'team1_id',
        'team2_id',
        'winner_id',
        'match_code',
        'stage',
        'status',
        'start_time',
        'end_time',
        'duration_minutes',
        'team1_score',
        'team2_score',
        'odds_team1',
        'odds_team2',
        'odds_draw',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'duration_minutes' => 'integer',
        'team1_score' => 'integer',
        'team2_score' => 'integer',
        'odds_team1' => 'decimal:2',
        'odds_team2' => 'decimal:2',
        'odds_draw' => 'decimal:2',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function team1()
    {
        return $this->belongsTo(Team::class, 'team1_id');
    }

    public function team2()
    {
        return $this->belongsTo(Team::class, 'team2_id');
    }

    public function winner()
    {
        return $this->belongsTo(Team::class, 'winner_id');
    }

    public function bets()
    {
        return $this->hasMany(Bet::class);
    }

    public function isLive(): bool
    {
        return $this->status === self::STATUS_LIVE;
    }

    public function isFinished(): bool
    {
        return $this->status === self::STATUS_FINISHED;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function canTransitionTo(string $nextStatus): bool
    {
        $allowed = [
            self::STATUS_PENDING => [self::STATUS_PENDING, self::STATUS_SCHEDULED, self::STATUS_CANCELLED],
            self::STATUS_SCHEDULED => [self::STATUS_SCHEDULED, self::STATUS_LIVE, self::STATUS_CANCELLED],
            self::STATUS_CANCELLED => [self::STATUS_CANCELLED, self::STATUS_SCHEDULED],
            self::STATUS_LIVE => [self::STATUS_FINISHED],
            self::STATUS_FINISHED => [],
        ];

        return in_array($nextStatus, $allowed[$this->status] ?? [], true);
    }

    public function finish(int $team1Score, int $team2Score, ?int $winnerId = null): void
    {
        $winner = $winnerId ?? ($team1Score > $team2Score
            ? $this->team1_id
            : ($team2Score > $team1Score ? $this->team2_id : null));

        $this->update([
            'status' => self::STATUS_FINISHED,
            'end_time' => now(),
            'duration_minutes' => $this->start_time ? $this->start_time->diffInMinutes(now()) : null,
            'team1_score' => $team1Score,
            'team2_score' => $team2Score,
            'winner_id' => $winner,
        ]);
    }
}