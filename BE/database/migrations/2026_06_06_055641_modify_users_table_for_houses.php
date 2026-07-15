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
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('house_number');
            $table->foreignId('house_id')->nullable()->constrained('houses')->onDelete('set null');
            $table->boolean('is_approved')->default(true); // Default true untuk user existing/seed, nanti register set false
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('house_number', 10)->nullable();
            $table->dropForeign(['house_id']);
            $table->dropColumn('house_id');
            $table->dropColumn('is_approved');
        });
    }
};
