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
            $table->string('name');
            $table->string('last_name');
            $table->string('character_name');
            $table->string('origin');
            $table->string('photo');
            $table->text('biography')->nullable();
            $table->string('portfolio_link')->nullable();
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
