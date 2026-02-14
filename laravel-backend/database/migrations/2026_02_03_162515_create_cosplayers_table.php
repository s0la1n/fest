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
        Schema::create('cosplayers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cosplay_application_id')->constrained()->onDelete('cascade')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('votes_count')->default(0);
            $table->json('voted_users')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cosplayers');
    }
};
