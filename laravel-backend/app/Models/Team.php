<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id',
        'team_name',
        'tag',
        'city',
        'logo',
        'description',
        'awards',
        'status',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Капитан команды (участник с ролью captain).
     */
    public function captainPlayer()
    {
        return $this->hasOne(TeamPlayer::class)->where('role', 'captain');
    }

    public function players()
    {
        return $this->hasMany(TeamPlayer::class);
    }

    public function matchGamesAsTeam1()
    {
        return $this->hasMany(MatchGame::class, 'team1_id');
    }

    public function matchGamesAsTeam2()
    {
        return $this->hasMany(MatchGame::class, 'team2_id');
    }

    public function wonMatches()
    {
        return $this->hasMany(MatchGame::class, 'winner_id');
    }

    public function getMatchGamesAttribute()
    {
        return $this->matchGamesAsTeam1->merge($this->matchGamesAsTeam2);
    }

    public function isFull(): bool
    {
        $game = $this->game;
        return $game && $this->players()->count() >= $game->max_players;
    }

    /**
     * Добавить участника в команду (имя/ник).
     */
    public function addPlayer(?string $playerName, ?string $nickname, string $role = 'player')
    {
        if (!$this->isFull()) {
            return TeamPlayer::create([
                'team_id' => $this->id,
                'player_name' => $playerName,
                'nickname' => $nickname,
                'role' => $role,
            ]);
        }
        return null;
    }
}
