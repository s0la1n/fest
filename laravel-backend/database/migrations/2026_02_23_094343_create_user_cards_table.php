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
        Schema::create('user_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('card_id')->constrained();
            $table->enum('status', [
                'acquired',           // Получена, но ещё не активирована/не использована
                'active',              // Активна (можно использовать бонус)
                'bonus_used',          // Бонус использован
                'bonus_expired',       // Бонус истёк (не использован вовремя)
                'shared',              // Поделился в соцсетях (если есть такая механика)
                'transferred'          // Передана другому пользователю (если трейдинг разрешён)
            ])->default('acquired');
            $table->string('coupon_code_used')->nullable();
            $table->json('bonus_used_data')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            $table->timestamps();
        });

        Schema::table('balance_histories', function (Blueprint $table) {
            $table->foreign('related_user_card_id')->references('id')->on('user_cards')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('balance_histories', function (Blueprint $table) {
            $table->dropForeign(['related_user_card_id']);
        });
        Schema::dropIfExists('user_cards');
    }
};
