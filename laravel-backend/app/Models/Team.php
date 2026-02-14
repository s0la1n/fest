<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'tournament_application_id',
        'captain_id',
        'status',
    ];

    public function tournamentApplication()
    {
        return $this->belongsTo(TournamentApplication::class);
    }

    public function captain()
    {
        return $this->belongsTo(User::class, 'captain_id');
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

    public function invitations()
    {
        return $this->hasMany(TeamInvation::class);
    }

    public function getMatchGamesAttribute()
    {
        return $this->matchGamesAsTeam1->merge($this->matchGamesAsTeam2);
    }

    public function isFull(): bool
    {
        $game = $this->tournamentApplication->game;
        return $this->players()->count() >= $game->max_players;
    }

    public function addPlayer(User $user, string $role = 'player')
    {
        if (!$this->isFull()) {
            return TeamPlayer::create([
                'team_id' => $this->id,
                'user_id' => $user->id,
                'role' => $role,
            ]);
        }
        return null;
    }
}