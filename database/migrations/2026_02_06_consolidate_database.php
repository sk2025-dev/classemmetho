<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Consolidation complète de la base de données:
     * - Renomme church_roles → fonctions
     * - Supprime tables inutiles (commune_famille, audit_logs, etc)
     * - Nettoie les migrations redondantes
     * - Ajoute fonction_id sur users
     */
    public function up(): void
    {
        // 1. Renommer church_roles → fonctions (sauf si fonctions existe déjà)
        if (Schema::hasTable('church_roles') && !Schema::hasTable('fonctions')) {
            Schema::rename('church_roles', 'fonctions');
        }

        // 2. Ajouter fonction_id sur users (si absent)
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'fonction_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('fonction_id')
                    ->nullable()
                    ->constrained('fonctions')
                    ->nullOnDelete()
                    ->after('role');
            });
        }

        // 3. Supprimer tables inutiles
        $tablesToDrop = [
            'commune_famille',
            'audit_logs',
            'user_church_roles',  // Pivot table - remplacé par fonction_id direct
            'inscription_church_roles',  // Pivot table inutile
            'church_roles_old',  // Backup ancien
        ];

        foreach ($tablesToDrop as $table) {
            if (Schema::hasTable($table)) {
                Schema::dropIfExists($table);
            }
        }

        // 4. Nettoyer les colonnes inutiles de users
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                // Supprimer les colonnes redondantes ou inutiles
                $columns = Schema::getColumnListing('users');

                // Liste des colonnes à supprimer
                $toDelete = [
                    'adresse',  // Stockée dans families
                    'quartier',  // Stockée dans families
                    'fonction_professionnelle',  // Remplacé par fonction_id + name
                ];

                foreach ($toDelete as $col) {
                    if (in_array($col, $columns)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        // 5. Nettoyer les colonnes inutiles d'inscriptions
        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');

                // Supprimer les colonnes redondantes
                $toDelete = [
                    'nom',  // Peut être dans data JSON ou créé via approve
                    'prenom',
                    'adresse',  // Stockée dans family
                    'telephone2',  // Si présent
                ];

                foreach ($toDelete as $col) {
                    if (in_array($col, $columns)) {
                        try {
                            $table->dropColumn($col);
                        } catch (\Exception $e) {
                            // Colonne peut ne pas exister
                        }
                    }
                }
            });
        }

        // 6. Ajouter index pour performances
        if (Schema::hasTable('fonctions')) {
            Schema::table('fonctions', function (Blueprint $table) {
                if (!Schema::hasIndex('fonctions', 'fonctions_nom_index')) {
                    $table->index('nom');
                }
            });
        }
    }

    public function down(): void
    {
        // Rollback: Renommer fonctions → church_roles
        if (Schema::hasTable('fonctions')) {
            Schema::rename('fonctions', 'church_roles');
        }

        // Recréer les tables supprimées
        if (!Schema::hasTable('commune_famille')) {
            Schema::create('commune_famille', function (Blueprint $table) {
                $table->id();
                $table->timestamps();
            });
        }

        // Supprimer fonction_id de users - NE PLUS LE FAIRE
        // Car fonction_id est maintenant consolidé dans users et ne doitpas être supprimé
    }
};
