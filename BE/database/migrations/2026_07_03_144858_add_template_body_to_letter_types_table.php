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
        Schema::table('letter_types', function (Blueprint $table) {
            $table->longText('template_body')->nullable()->after('requires_rw_approval');
            $table->text('template_variables')->nullable()->after('template_body')
                  ->comment('JSON array of variable names used in template, e.g. ["nama_lengkap","nik"]');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('letter_types', function (Blueprint $table) {
            $table->dropColumn(['template_body', 'template_variables']);
        });
    }
};
