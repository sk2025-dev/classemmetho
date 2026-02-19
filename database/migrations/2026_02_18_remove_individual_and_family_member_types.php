<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Supprime les types 'individuel' et 'membre_famille' de l'enum inscriptions.type
     * Garde seulement: 'famille', 'conducteur'
     * Note: 'pasteur' est créé manuellement par admin seulement
     */
    public function up(): void
    {
        // Supprimer les enregistrements des types 'individuel' et 'membre_famille'
        DB::table('inscriptions')
            ->whereIn('type', ['individuel', 'membre_famille'])
            ->delete();

        // MySQL: Modifier l'enum pour supprimer les types inutilisés
        if (DB::getDriverName() === 'mysql' || DB::getDriverName() === 'mariadb') {
            DB::statement("
                ALTER TABLE inscriptions
                MODIFY COLUMN type ENUM('famille', 'conducteur') NOT NULL DEFAULT 'famille'
            ");
        }
    }

    public function down(): void
    {
        // Restaurer l'enum complet en cas de rollback
        if (DB::getDriverName() === 'mysql' || DB::getDriverName() === 'mariadb') {
            DB::statement("
                ALTER TABLE inscriptions
                MODIFY COLUMN type ENUM('membre_famille', 'individuel', 'famille', 'conducteur') NOT NULL DEFAULT 'individuel'
            ");
        }
    }
};
