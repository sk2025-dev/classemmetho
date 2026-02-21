<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Supprime les colonnes inutiles:
     * - "name" dans users (remplacé par nom + prenom)
     */
    public function up(): void
    {
        // Supprimer la colonne "name" dans users
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = Schema::getColumnListing('users');
                if (in_array('name', $columns)) {
                    $table->dropColumn('name');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = Schema::getColumnListing('users');
                if (!in_array('name', $columns)) {
                    $table->string('name')->after('id');
                }
            });
        }
    }
};
