<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BalanceHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'type',
        'related_order_id',
        'related_cosplayer_id',
        'related_bet_id',
    ];

    protected $casts = [
        'amount' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'related_order_id');
    }

    public function cosplayer()
    {
        return $this->belongsTo(Cosplayer::class, 'related_cosplayer_id');
    }

    public function bet()
    {
        return $this->belongsTo(Bet::class, 'related_bet_id');
    }

    public function isPositive(): bool
    {
        return $this->amount > 0;
    }

    public function isNegative(): bool
    {
        return $this->amount < 0;
    }

    public function getFormattedAmountAttribute(): string
    {
        $sign = $this->amount > 0 ? '+' : '';
        return $sign . $this->amount . ' монет';
    }

    public function getDescriptionAttribute(): string
    {
        $descriptions = [
            'registration_bonus' => 'Бонус за регистрацию',
            'profile_completion' => 'Заполнение профиля',
            'daily_login' => 'Ежедневный вход',
            'tournament_win' => 'Победа в турнире',
            'bet_win' => 'Выигрыш ставки',
            'merch_purchase' => 'Покупка мерча',
            // Добавьте остальные типы
        ];

        return $descriptions[$this->type] ?? $this->type;
    }
}