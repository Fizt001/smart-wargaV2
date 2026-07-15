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
            $table->string('nik')->unique()->nullable()->after('id');
            $table->string('phone_number')->nullable()->after('name');
            $table->foreignId('role_id')->nullable()->after('phone_number')->constrained()->nullOnDelete();
            $table->foreignId('block_id')->nullable()->after('role_id')->constrained()->nullOnDelete();
            $table->string('house_number')->nullable()->after('block_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['block_id']);
            $table->dropColumn(['nik', 'phone_number', 'role_id', 'block_id', 'house_number']);
        });
    }
};
