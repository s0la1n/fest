<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeamPlayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'player_name',
        'nickname',
        'role',
    ];

    protected $appends = ['display_name'];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Имя для отображения.
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->nickname ?: $this->player_name ?: 'Игрок';
    }

    public function isCaptain(): bool
    {
        return $this->role === 'captain';
    }
}