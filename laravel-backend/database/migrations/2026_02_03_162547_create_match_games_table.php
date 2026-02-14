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
        Schema::create('match_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->foreignId('team1_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('team2_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('winner_id')->nullable()->constrained('teams')->onDelete('cascade');
            $table->string('match_code')->unique();
            $table->enum('stage', [
                'group',
                'round_of_16',
                'quarterfinal',
                'semifinal',
                'final',
                'third_place',
                'qualification'
            ])->default('group');
            $table->enum('status', [
                'scheduled',
                'live',
                'finished',
                'cancelled',
            ])->default('scheduled');
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->integer('team1_score')->default(0);
            $table->integer('team2_score')->default(0);
            $table->timestamps();
            $table->index(['game_id', 'status']);
            $table->index(['team1_id', 'team2_id']);
            $table->index(['start_time', 'stage']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_games');
    }
};