<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Card extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'image',
        'rarity',
        'stock_quantity',
        'used_quantity',
        'qr_code_get',
        'qr_code_get_hash',
        'type_bonus',
        'bonus_value',
        'coupon_code',
        'status',
    ];

    protected $casts = [
        'stock_quantity' => 'integer',
        'used_quantity' => 'integer',
        'bonus_value' => 'integer',
    ];

    // Аксессор для получения полного URL изображения
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }
        
        // Если уже полный URL, возвращаем как есть
        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }
        
        // Иначе возвращаем URL из storage
        return Storage::url($this->image);
    }

    public function userCards()
    {
        return $this->hasMany(UserCard::class);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')
                    ->whereRaw('used_quantity < stock_quantity');
    }

    public function isInStock(): bool
    {
        return $this->used_quantity < $this->stock_quantity;
    }

    public function canBeAcquiredByUser(int $userId): bool
    {
        return $this->isInStock() 
            && $this->status === 'available'
            && !$this->userCards()->where('user_id', $userId)->exists();
    }
}