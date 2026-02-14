<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'nickname',
        'last_name',
        'login',
        'email',
        'phone',
        'email_verified_at',
        'password',
        'role',
        'is_banned',
        'balance',
        'remember_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_banned' => 'boolean',
    ];

    protected $appends = [
        'full_name',
    ];

    public function getFullNameAttribute(): string
    {
        return trim($this->name . ' ' . $this->last_name);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function cosplayApplications()
    {
        return $this->hasMany(CosplayApplication::class);
    }

    public function tournamentApplications()
    {
        return $this->hasMany(TournamentApplication::class, 'captain_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function bets()
    {
        return $this->hasMany(Bet::class);
    }

    public function balanceHistories()
    {
        return $this->hasMany(BalanceHistory::class);
    }

    public function teamPlayers()
    {
        return $this->hasMany(TeamPlayer::class);
    }

    public function sentInvitations()
    {
        return $this->hasMany(TeamInvation::class, 'invited_by');
    }

    public function receivedInvitations()
    {
        return $this->hasMany(TeamInvation::class, 'invited_user_id');
    }

    public function cosplayers()
    {
        return $this->hasOne(Cosplayer::class);
    }
}