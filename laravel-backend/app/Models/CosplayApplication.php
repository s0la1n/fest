<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CosplayApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'character_name',
        'origin',
        'photo',
        'biography',
        'character_description',
        'portfolio_link',
        'awards',
        'status',
    ];

    protected $casts = [
        'awards' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cosplayer()
    {
        return $this->hasOne(Cosplayer::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'under_review');
    }
}