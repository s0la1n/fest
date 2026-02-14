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
        Schema::create('bets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('match_id')->constrained('match_games')->onDelete('cascade');
            $table->enum('bet_on', [
                'team1_win',
                'team2_win',
                'draw',
            ]);
            $table->integer('coins_amount');
            $table->decimal('odds', 5, 2);
            $table->integer('potential_win');
            $table->enum('status', [
                'pending',
                'active',
                'won',
                'lost',
                'returned',
                'cancelled'
            ])->default('pending');
            $table->integer('actual_win')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bets');
    }
};
