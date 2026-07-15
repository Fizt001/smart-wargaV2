<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cooperative_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['saving', 'loan', 'loan_repayment']);
            $table->decimal('amount', 12, 2);
            $table->integer('term_months')->nullable(); // Tenor dalam bulan (untuk pinjaman)
            $table->decimal('interest_rate', 5, 2)->nullable(); // Persentase bunga bulanan (untuk pinjaman)
            $table->enum('status', ['pending', 'approved', 'rejected', 'paid'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cooperative_transactions');
    }
};
