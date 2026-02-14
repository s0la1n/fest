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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('ticket_number')->unique();
            $table->enum('type', [
                'standard',
                'vip',
                'premium',
            ])->default('standard');
            $table->decimal('price', 10, 2);
            $table->enum('payment_status', [
                'pending',
                'paid',
                'cancelled',
                'refunded',
            ])->default('pending');
            $table->string('transaction_id')->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamp('payment_date')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->string('qr_code')->nullable()->unique();
            $table->string('qr_code_hash')->nullable()->unique();
            $table->integer('check_in_count')->default(0);
            $table->timestamp('last_check_in')->nullable();
            $table->index(['user_id', 'payment_status']);
            $table->index(['ticket_number', 'qr_code_hash']);
            $table->index(['type', 'payment_status']);
            $table->index(['payment_status', 'expires_at']);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};