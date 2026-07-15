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
            $table->foreignId('religion_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('marital_status_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('profession_category_id')->nullable()->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['religion_id']);
            $table->dropForeign(['marital_status_id']);
            $table->dropForeign(['profession_category_id']);
            $table->dropColumn(['religion_id', 'marital_status_id', 'profession_category_id']);
        });
    }
};
