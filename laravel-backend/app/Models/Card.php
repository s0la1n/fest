<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

    public function userCards()
    {
        return $this->hasMany(UserCard::class);
    }
}
