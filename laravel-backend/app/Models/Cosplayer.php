<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cosplayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'cosplay_application_id',
        'user_id',
        'votes_count',
        'voted_users',
    ];

    protected $casts = [
        'votes_count' => 'integer',
        'voted_users' => 'array',
    ];

    public function cosplayApplication()
    {
        return $this->belongsTo(CosplayApplication::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

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
}