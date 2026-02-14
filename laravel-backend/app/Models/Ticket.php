<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ticket_number',
        'type',
        'price',
        'payment_status',
        'transaction_id',
        'payment_method',
        'payment_date',
        'activated_at',
        'expires_at',
        'used_at',
        'qr_code',
        'qr_code_hash',
        'check_in_count',
        'last_check_in',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'check_in_count' => 'integer',
        'payment_date' => 'datetime',
        'activated_at' => 'datetime',
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'last_check_in' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('payment_status', 'paid')
                     ->where(function ($q) {
                         $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                     });
    }

    public function scopeExpired($query)
    {
        return $query->whereNotNull('expires_at')->where('expires_at', '<', now());
    }

    public function markAsUsed()
    {
        $this->update([
            'used_at' => now(),
            'check_in_count' => $this->check_in_count + 1,
            'last_check_in' => now(),
        ]);
    }
}