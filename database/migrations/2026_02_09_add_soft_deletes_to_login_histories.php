<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ajoute la colonne deleted_at pour le soft delete sur la table login_histories
     */
    public function up(): void
    {
        if (Schema::hasTable('login_histories')) {
            Schema::table('login_histories', function (Blueprint $table) {
                if (!Schema::hasColumn('login_histories', 'deleted_at')) {
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
        if (Schema::hasTable('login_histories')) {
            Schema::table('login_histories', function (Blueprint $table) {
                if (Schema::hasColumn('login_histories', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }
    }
};
