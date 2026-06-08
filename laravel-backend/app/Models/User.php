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

    public function userCards()
    {
        return $this->hasMany(UserCard::class);
    }

    public function isOrganizer(): bool
    {
        return $this->role === 'organizer';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}