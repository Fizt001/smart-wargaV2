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
        Schema::create('house_move_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['out', 'cross_rt', 'within_rt']);
            $table->foreignId('old_rt_id')->nullable()->constrained('rts')->onDelete('set null');
            $table->foreignId('old_house_id')->nullable()->constrained('houses')->onDelete('set null');
            $table->foreignId('new_rt_id')->nullable()->constrained('rts')->onDelete('set null');
            $table->foreignId('new_block_id')->nullable()->constrained('blocks')->onDelete('set null');
            $table->string('new_house_number', 10)->nullable();
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('house_move_requests');
    }
};
