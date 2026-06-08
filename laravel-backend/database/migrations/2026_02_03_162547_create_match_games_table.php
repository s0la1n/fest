<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->foreignId('team1_id')->nullable()->constrained('teams')->onDelete('cascade');
            $table->foreignId('team2_id')->nullable()->constrained('teams')->onDelete('cascade');
            $table->foreignId('winner_id')->nullable()->constrained('teams')->onDelete('cascade');
            $table->string('match_code')->unique();
            $table->enum('stage', [
                'quarterfinal',
                'semifinal',
                'final'
            ])->default('quarterfinal');
            $table->enum('status', [
                'pending',
                'scheduled',
                'live',
                'finished',
                'cancelled'
            ])->default('pending');
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->integer('team1_score')->default(0);
            $table->integer('team2_score')->default(0);
            $table->decimal('odds_team1', 5, 2)->nullable();
            $table->decimal('odds_team2', 5, 2)->nullable();
            $table->decimal('odds_draw', 5, 2)->nullable();
            
            $table->timestamps();
            $table->index(['game_id', 'stage']);
            $table->index(['game_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_games');
    }
};