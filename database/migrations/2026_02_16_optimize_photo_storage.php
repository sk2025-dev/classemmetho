<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Optimise le stockage des photos:
     * - Supprime les données redondantes/inutiles des colonnes photo
     * - Standardise sur 'photo_path' pour le chemin fichier
     * - Garde 'profile_photo_url' pour l'URL générée uniquement
     * - Données réelles dans storage/app/public/ (pas en base de données)
     */
    public function up(): void
    {
        // === USERS: Nettoyer les colonnes inutiles ===
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = Schema::getColumnListing('users');

                // Supprimer photo_url (jamais utilisée, redondante avec profile_photo_url)
                if (in_array('photo_url', $columns)) {
                    $table->dropColumn('photo_url');
                }
            });
        }

        // === INSCRIPTIONS: Ajouter photo_path et supprimer colonnes inutiles ===
        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');

                // Ajouter photo_path (chemin du fichier stocké) pour cohérence avec users
                if (!in_array('photo_path', $columns)) {
                    $table->string('photo_path')->nullable()->after('photo_data');
                }
            });

            // Supprimer photo_data (pas de base64 en base de données)
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');

                if (in_array('photo_data', $columns)) {
                    $table->dropColumn('photo_data');
                }
            });

            // Supprimer profile_photo (jamais utilisée, redondante avec profile_photo_url)
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');

                if (in_array('profile_photo', $columns)) {
                    $table->dropColumn('profile_photo');
                }
            });
        }
    }

    public function down(): void
    {
        // === USERS: Restaurer photo_url ===
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = Schema::getColumnListing('users');

                if (!in_array('photo_url', $columns)) {
                    $table->string('photo_url')->nullable();
                }
            });
        }

        // === INSCRIPTIONS: Restaurer colonnes supprimées ===
        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');

                // Restaurer photo_data
                if (!in_array('photo_data', $columns)) {
                    $table->longText('photo_data')->nullable();
                }

                // Restaurer profile_photo
                if (!in_array('profile_photo', $columns)) {
                    $table->string('profile_photo')->nullable();
                }
            });

            // Supprimer photo_path
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');

                if (in_array('photo_path', $columns)) {
                    $table->dropColumn('photo_path');
                }
            });
        }
    }
};
