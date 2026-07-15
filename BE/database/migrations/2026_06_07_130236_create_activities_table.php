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
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rt_id')->nullable()->constrained('rts')->cascadeOnDelete();
            $table->string('level')->default('RT'); // RT or RW
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('activity_date');
            $table->decimal('budget_proposed', 15, 2)->default(0);
            $table->decimal('actual_expense', 15, 2)->default(0);
            $table->string('status')->default('planned'); // planned, executed
            $table->string('receipt_proof')->nullable(); // path to nota
            $table->string('photo_proof')->nullable(); // path to photo
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
