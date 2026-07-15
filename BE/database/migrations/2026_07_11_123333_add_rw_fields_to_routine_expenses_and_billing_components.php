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
        Schema::table('routine_expenses', function (Blueprint $table) {
            $table->decimal('target_amount', 15, 2)->nullable()->after('description');
            $table->decimal('per_kk_amount', 12, 2)->nullable()->after('target_amount');
            $table->integer('total_kk')->nullable()->after('per_kk_amount');
        });

        Schema::create('routine_expense_rt', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('routine_expense_id');
            $table->unsignedBigInteger('rt_id');
            $table->decimal('per_kk_amount', 12, 2)->nullable();
            $table->integer('total_kk')->nullable();
            $table->timestamps();

            $table->foreign('routine_expense_id')->references('id')->on('routine_expenses')->onDelete('cascade');
            $table->foreign('rt_id')->references('id')->on('rts')->onDelete('cascade');
        });

        Schema::table('billing_components', function (Blueprint $table) {
            $table->boolean('is_rw_mandated')->default(false)->after('is_active');
            $table->unsignedBigInteger('routine_expense_id')->nullable()->after('is_rw_mandated');
            
            $table->foreign('routine_expense_id')->references('id')->on('routine_expenses')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('billing_components', function (Blueprint $table) {
            $table->dropForeign(['routine_expense_id']);
            $table->dropColumn(['is_rw_mandated', 'routine_expense_id']);
        });

        Schema::dropIfExists('routine_expense_rt');

        Schema::table('routine_expenses', function (Blueprint $table) {
            $table->dropColumn(['target_amount', 'per_kk_amount', 'total_kk']);
        });
    }
};
