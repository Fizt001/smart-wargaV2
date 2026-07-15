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
        Schema::create('routine_expense_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('routine_expense_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // Who paid it
            $table->integer('month');
            $table->integer('year');
            $table->decimal('actual_expense', 15, 2)->default(0);
            $table->string('status')->default('paid');
            $table->string('receipt_proof')->nullable();
            $table->string('photo_proof')->nullable();
            $table->timestamps();

            // Ensure unique record per month/year for a routine expense
            $table->unique(['routine_expense_id', 'month', 'year'], 'routine_expense_period_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('routine_expense_records');
    }
};
