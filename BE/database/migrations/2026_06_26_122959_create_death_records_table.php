<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('death_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->string('deceased_name');
            $table->string('nik')->nullable();
            $table->date('date_of_death');
            $table->string('cause_of_death')->nullable();
            $table->string('burial_location')->nullable();
            $table->decimal('compensation_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'disbursed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('death_records');
    }
};
