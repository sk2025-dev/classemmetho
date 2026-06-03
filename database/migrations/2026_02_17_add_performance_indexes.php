<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ajoute les index critiques pour optimiser les performances:
     * - Approbations d'inscriptions (status, dates)
     * - Authentification (email, identifier)
     * - Recherches courantes (email, classe, famille)
     */
    public function up(): void
    {
        $this->addIndex('inscriptions', 'status');
        $this->addCompositeIndex('inscriptions', ['status', 'created_at']);
        $this->addIndex('inscriptions', 'email');
        $this->addIndex('inscriptions', 'admin_approved');
        $this->addIndex('inscriptions', 'conducteur_approved');
        $this->addIndex('inscriptions', 'user_id');
        $this->addIndex('inscriptions', 'family_id');
        $this->addIndex('inscriptions', 'classe_id');

        $this->addCompositeIndex('users', ['identifier', 'is_active']);
        $this->addCompositeIndex('users', ['email', 'is_active']);
        $this->addIndex('users', 'family_id');
        $this->addIndex('users', 'classe_id');

        $this->addIndex('families', 'classe_id');
        $this->addIndex('families', 'ville_id');
        $this->addIndex('families', 'responsable_id');
    }

    private function addIndex(string $table, string $column): void
    {
        try {
            DB::statement("
                ALTER TABLE `{$table}`
                ADD INDEX `{$table}_{$column}_index` ({$column})
            ");
        } catch (\Exception $e) {
            // Index might already exist, ignore error
        }
    }

    private function addCompositeIndex(string $table, array $columns): void
    {
        $columnsList = implode('`, `', $columns);
        $indexName = $table . '_' . implode('_', $columns) . '_index';

        try {
            DB::statement("
                ALTER TABLE `{$table}`
                ADD INDEX `{$indexName}` (`{$columnsList}`)
            ");
        } catch (\Exception $e) {
            // Index might already exist, ignore error
        }
    }

    public function down(): void
    {
        // Ne pas supprimer les index pour éviter de nuire à la performance
    }
};
