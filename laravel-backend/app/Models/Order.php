<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'merch_id',
        'quantity',
        'total_amount',
        'shipping_address',
        'status',
        'tracking_number',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'total_amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function merch()
    {
        return $this->belongsTo(Merch::class);
    }

    public function balanceHistories()
    {
        return $this->hasMany(BalanceHistory::class, 'related_order_id');
    }

    public function confirm()
    {
        $this->update(['status' => 'confirmed']);
    }

    public function ship(string $trackingNumber = null)
    {
        $this->update([
            'status' => 'shipped',
            'tracking_number' => $trackingNumber,
        ]);
    }

    public function cancel()
    {
        $this->update(['status' => 'cancelled']);
        // Возвращаем товар на склад
        if ($this->merch) {
            $this->merch->increment('stock_quantity', $this->quantity);
            $this->merch->decrement('sold_quantity', $this->quantity);
        }
    }
}