<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TournamentApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'captain_id',
        'game_id',
        'team_name',
        'tag',
        'city',
        'logo',
        'description',
        'awards',
        'status',
    ];

    protected $casts = [
        'awards' => 'array',
    ];

    public function captain()
    {
        return $this->belongsTo(User::class, 'captain_id');
    }

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function team()
    {
        return $this->hasOne(Team::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function approve()
    {
        $this->update(['status' => 'approved']);
    }

    public function reject()
    {
        $this->update(['status' => 'rejected']);
    }
}