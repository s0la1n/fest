<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Cosplayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'last_name',
        'character_name',
        'origin',
        'photo',
        'portfolio_link',
        'votes_count',
        'voted_users',
        'biography', // добавим biography
    ];

    protected $casts = [
        'votes_count' => 'integer',
        'voted_users' => 'array',
    ];

    public function balanceHistories()
    {
        return $this->hasMany(BalanceHistory::class, 'related_cosplayer_id');
    }

    public function vote(User $user)
    {
        $votedUsers = $this->voted_users ?? [];

        if (!in_array($user->id, $votedUsers)) {
            $votedUsers[] = $user->id;
            $this->update([
                'votes_count' => $this->votes_count + 1,
                'voted_users' => $votedUsers,
            ]);
            return true;
        }

        return false;
    }

    public function hasVoted(User $user): bool
    {
        return in_array($user->id, $this->voted_users ?? []);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if (!$this->photo) {
            return null;
        }
        
        if (filter_var($this->photo, FILTER_VALIDATE_URL)) {
            return $this->photo;
        }
        
        // Просто возвращаем URL через Storage
        return Storage::url($this->photo);
    }
}