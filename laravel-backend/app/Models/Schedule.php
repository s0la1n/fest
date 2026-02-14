<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'short_name',
        'description',
        'start_time',
        'day',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'day' => 'integer',
    ];

    public function getDayNameAttribute(): string
    {
        $days = [
            1 => 'Понедельник',
            2 => 'Вторник', 
            3 => 'Среда',
            4 => 'Четверг',
            5 => 'Пятница',
            6 => 'Суббота',
            7 => 'Воскресенье',
        ];

        return $days[$this->day] ?? "День {$this->day}";
    }

    public function getFormattedTimeAttribute(): string
    {
        return $this->start_time->format('H:i');
    }

    public function scopeForDay($query, int $day)
    {
        return $query->where('day', $day)->orderBy('start_time');
    }

    public function scopeToday($query)
    {
        $today = now()->dayOfWeekIso; // 1-понедельник, 7-воскресенье
        return $query->where('day', $today)->orderBy('start_time');
    }

    public function scopeUpcoming($query)
    {
        $now = now();
        $currentTime = $now->format('H:i');
        $currentDay = $now->dayOfWeekIso;
        
        return $query->where(function($q) use ($currentDay, $currentTime) {
            $q->where('day', '>', $currentDay)
              ->orWhere(function($q2) use ($currentDay, $currentTime) {
                  $q2->where('day', $currentDay)
                     ->where('start_time', '>', $currentTime);
              });
        })->orderBy('day')->orderBy('start_time');
    }
}