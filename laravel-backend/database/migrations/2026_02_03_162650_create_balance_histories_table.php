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
        Schema::create('balance_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('amount');
            $table->enum('type', [
                'registration_bonus',        // Бонус за регистрацию
                'profile_completion',        // Заполнение профиля
                'bet_win',                   // Выигрыш по ставке
                'merch_purchase',            // Покупка мерча
                'bet_placement',             // Размещение ставки
                'card_bonus'                 // Бонус от карточки
            ]);
            $table->foreignId('related_order_id')->nullable()->constrained('orders')->onDelete('set null');
            $table->foreignId('related_bet_id')->nullable()->constrained('bets')->onDelete('set null');
            $table->unsignedBigInteger('related_user_card_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('balance_histories');
    }
};
