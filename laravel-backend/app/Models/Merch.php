<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Merch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'stock_quantity',
        'sold_quantity',
        'main_image',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'sold_quantity' => 'integer',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function isInStock(): bool
    {
        return $this->stock_quantity > 0;
    }

    public function reduceStock(int $quantity): bool
    {
        if ($this->stock_quantity >= $quantity) {
            $this->decrement('stock_quantity', $quantity);
            $this->increment('sold_quantity', $quantity);
            return true;
        }
        return false;
    }

    public function getRevenueAttribute()
    {
        return $this->price * $this->sold_quantity;
    }
}