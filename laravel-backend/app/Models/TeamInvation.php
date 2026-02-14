<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeamInvation extends Model
{
    use HasFactory;

    protected $fillable = [
        'invited_by',
        'team_id',
        'invited_user_id',
        'status',
    ];

    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function invitedUser()
    {
        return $this->belongsTo(User::class, 'invited_user_id');
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function accept()
    {
        $this->update(['status' => 'accepted']);
        $this->team->addPlayer($this->invitedUser, 'player');
    }

    public function reject()
    {
        $this->update(['status' => 'rejected']);
    }

    public function cancel()
    {
        $this->update(['status' => 'cancelled']);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }
}