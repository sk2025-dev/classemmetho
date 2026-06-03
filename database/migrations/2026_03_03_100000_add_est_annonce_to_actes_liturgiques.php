<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->boolean('est_annonce')->default(false)->after('date_expiration');
        });
    }

    public function down(): void
    {
        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->dropColumn('est_annonce');
        });
    }
};
