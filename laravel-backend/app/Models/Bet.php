<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'match_id',
        'bet_on',
        'coins_amount',
        'odds',
        'potential_win',
        'status',
        'actual_win',
    ];

    protected $casts = [
        'coins_amount' => 'integer',
        'odds' => 'decimal:2',
        'potential_win' => 'integer',
        'actual_win' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function match()
    {
        return $this->belongsTo(MatchGame::class, 'match_id');
    }

    public function balanceHistories()
    {
        return $this->hasMany(BalanceHistory::class, 'related_bet_id');
    }

    public function isWon(): bool
    {
        if (!$this->match->isFinished() || !$this->match->winner) {
            return false;
        }

        $betResult = match($this->bet_on) {
            'team1_win' => $this->match->winner_id === $this->match->team1_id,
            'team2_win' => $this->match->winner_id === $this->match->team2_id,
            'draw' => $this->match->winner_id === null,
            default => false,
        };

        return $betResult;
    }

    public function calculateResult()
    {
        if ($this->match->isFinished()) {
            if ($this->isWon()) {
                $this->update([
                    'status' => 'won',
                    'actual_win' => $this->potential_win,
                ]);
            } else {
                $this->update(['status' => 'lost']);
            }
        }
    }
}