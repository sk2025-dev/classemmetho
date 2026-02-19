<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ajoute les clés étrangères à users
     * FKs pour classe_id, fonction_id, ville_id, family_id
     * Ces colonnes existent déjà via consolidate_users_columns
     */
    public function up(): void
    {
        if (Schema::hasTable('users') && Schema::hasTable('classes')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    // Vérifier si la FK existe déjà
                    $fks = DB::select("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                        WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'classe_id' AND REFERENCED_TABLE_NAME IS NOT NULL");
                    if (empty($fks)) {
                        $table->foreign('classe_id')
                            ->references('id')
                            ->on('classes')
                            ->nullOnDelete();
                    }
                });
            } catch (\Exception $e) {
                // FK might already exist
            }
        }

        if (Schema::hasTable('users') && Schema::hasTable('fonctions')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $fks = DB::select("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                        WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'fonction_id' AND REFERENCED_TABLE_NAME IS NOT NULL");
                    if (empty($fks)) {
                        $table->foreign('fonction_id')
                            ->references('id')
                            ->on('fonctions')
                            ->nullOnDelete();
                    }
                });
            } catch (\Exception $e) {
                // FK might already exist
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropForeign(['classe_id']);
                });
            } catch (\Exception $e) {
                // FK might not exist
            }

            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropForeign(['fonction_id']);
                });
            } catch (\Exception $e) {
                // FK might not exist
            }
        }
    }
};
