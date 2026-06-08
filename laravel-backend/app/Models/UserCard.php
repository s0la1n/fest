<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'card_id',
        'status',
        'expires_at',
        'coupon_code_used',
        'bonus_used_data',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'bonus_used_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function card()
    {
        return $this->belongsTo(Card::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function canUseBonus(): bool
    {
        return $this->status === 'acquired' && !$this->isExpired();
    }
}