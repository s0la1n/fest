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
        Schema::create('tournament_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('captain_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->string('team_name');
            $table->string('tag')->unique();
            $table->string('city');
            $table->string('logo')->nullable();
            $table->text('description')->nullable();
            $table->text('awards')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'waiting_list'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_applications');
    }
};
