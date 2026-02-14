<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatchGame extends Model
{
    use HasFactory;

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
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'duration_minutes' => 'integer',
        'team1_score' => 'integer',
        'team2_score' => 'integer',
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
        return $this->status === 'live';
    }

    public function isFinished(): bool
    {
        return $this->status === 'finished';
    }

    public function finish(int $team1Score, int $team2Score, ?int $winnerId = null)
    {
        $this->update([
            'status' => 'finished',
            'end_time' => now(),
            'duration_minutes' => $this->start_time->diffInMinutes(now()),
            'team1_score' => $team1Score,
            'team2_score' => $team2Score,
            'winner_id' => $winnerId ?? ($team1Score > $team2Score ? $this->team1_id : 
                         ($team2Score > $team1Score ? $this->team2_id : null)),
        ]);
    }

    public function getWinnerAttribute()
    {
        if ($this->team1_score > $this->team2_score) {
            return $this->team1;
        } elseif ($this->team2_score > $this->team1_score) {
            return $this->team2;
        }
        return null; // ничья
    }
}