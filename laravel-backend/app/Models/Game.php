<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'icon_path',
        'description',
        'max_players',
    ];

    protected $casts = [
        'max_players' => 'integer',
    ];

    public function tournamentApplications()
    {
        return $this->hasMany(TournamentApplication::class);
    }

    public function matchGames()
    {
        return $this->hasMany(MatchGame::class);
    }
}