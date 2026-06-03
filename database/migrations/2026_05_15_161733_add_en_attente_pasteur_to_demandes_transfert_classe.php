<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `demandes_transfert_classe` MODIFY COLUMN `statut` ENUM(
            'SOUMISE',
            'EN_ATTENTE_SOURCE',
            'VALIDEE_SOURCE',
            'EN_ATTENTE_ACCUEIL',
            'VALIDEE_ACCUEIL',
            'EN_ATTENTE_PASTEUR',
            'TERMINEE',
            'REFUSEE'
        ) NOT NULL DEFAULT 'SOUMISE'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE `demandes_transfert_classe` MODIFY COLUMN `statut` ENUM(
            'SOUMISE',
            'EN_ATTENTE_SOURCE',
            'VALIDEE_SOURCE',
            'EN_ATTENTE_ACCUEIL',
            'VALIDEE_ACCUEIL',
            'TERMINEE',
            'REFUSEE'
        ) NOT NULL DEFAULT 'SOUMISE'");
    }
};
