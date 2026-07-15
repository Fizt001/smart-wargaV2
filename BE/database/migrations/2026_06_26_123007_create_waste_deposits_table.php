<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waste_deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('waste_type'); // Kardus, Plastik, Logam, Minyak Jelantah
            $table->decimal('weight_kg', 8, 2);
            $table->decimal('price_per_kg', 10, 2);
            $table->decimal('total_amount', 12, 2);
            $table->enum('payment_method', ['wallet', 'cash'])->default('wallet');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waste_deposits');
    }
};
