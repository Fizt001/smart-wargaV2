<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_member_id')->constrained()->cascadeOnDelete();
            $table->date('record_date');
            $table->decimal('weight', 5, 2); // dalam kg
            $table->decimal('height', 5, 2); // dalam cm
            $table->decimal('head_circumference', 5, 2)->nullable(); // untuk balita
            $table->string('blood_pressure')->nullable(); // untuk lansia
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_records');
    }
};
