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
        Schema::create('cosplay_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('character_name');
            $table->string('origin');
            $table->string('photo');
            $table->text('biography')->nullable();
            $table->text('character_description')->nullable();
            $table->string('portfolio_link');
            $table->text('awards')->nullable();
            $table->enum('status', [
                'under_review',
                'approved',
                'rejected',
            ])->default('under_review');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cosplay_applications');
    }
};
