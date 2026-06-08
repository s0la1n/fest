<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'login',
        'ip_address',
        'locked_until',
        'attempts',
    ];

    protected $casts = [
        'locked_until' => 'datetime',
    ];

    const MAX_ATTEMPTS = 5;
    const LOCKOUT_MINUTES = 30; // Блокировка на 30 минут

    /**
     * Проверяет, заблокирован ли логин или IP
     */
    public static function isLocked(string $login, ?string $ip): bool
    {
        $attempt = self::where('login', $login)
            ->orWhere('ip_address', $ip)
            ->latest()
            ->first();

        if (!$attempt || !$attempt->locked_until) {
            return false;
        }

        // lt = less than = "меньше чем"
        return now()->lt($attempt->locked_until);
    }

    /**
     * Получает время разблокировки
     */
    public static function getLockedUntil(string $login, ?string $ip): ?string
    {
        $attempt = self::where('login', $login)
            ->orWhere('ip_address', $ip)
            ->latest()
            ->first();

        return $attempt?->locked_until?->toDateTimeString();
    }
}