<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image');
            $table->enum('rarity', ['common', 'rare', 'epic', 'legendary', 'secret'])->default('common'); // редкость карточки
            $table->integer('stock_quantity');
            $table->integer('used_quantity');
            $table->string('qr_code_get')->nullable()->unique();
            $table->string('qr_code_get_hash')->nullable()->unique();
            $table->string('code_get')->nullable()->unique();
            $table->enum('type_bonus', [
                'discount',           // Скидка в процентах или фиксированная
                'coupon',              // Промокод для магазина
                'virtual_currency',    // Виртуальная валюта фестиваля
                'physical_gift',       // Физический подарок (мерч, еда, напитки)
                'digital_gift',        // Цифровой подарок (стикеры, обои, арты)
                'experience',          // Опыт/впечатления (backstage, fast-track)
            ])->default('discount');
             $table->enum('status', [
                'available',           // Доступна для получения
                'active',              // Активна, в игре
                'inactive',            // Неактивна, временно не доступна
                'expired',             // Истек срок действия
                'out_of_stock',        // Закончились (все использованы)
            ])->default('available');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cards');
    }
};
