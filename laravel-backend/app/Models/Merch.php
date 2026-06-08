<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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

    // Добавьте этот аксессор
    public function getMainImageUrlAttribute(): ?string
    {
        if (!$this->main_image) {
            return null;
        }
        
        if (filter_var($this->main_image, FILTER_VALIDATE_URL)) {
            return $this->main_image;
        }
        
        // Очищаем путь от лишних /storage/
        $cleanPath = preg_replace('#^/?(storage/)+#', '', $this->main_image);
        
        return Storage::url($cleanPath);
    }

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