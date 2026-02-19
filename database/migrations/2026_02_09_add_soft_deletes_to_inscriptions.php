<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ajoute la colonne deleted_at pour le soft delete sur la table inscriptions
     */
    public function up(): void
    {
        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                if (!Schema::hasColumn('inscriptions', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                if (Schema::hasColumn('inscriptions', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }
    }
};
