<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Query\Expression;

return new class extends Migration
{
    public function up(): void
    {
        // Modifier l'enum pour ajouter TRESORIER_RETRAIT
        Schema::table('notifications_financieres', function (Blueprint $table) {
            $table->enum('type', [
                'PAIEMENT_RECU',
                'RETARD_COTISATION',
                'CAMPAGNE_ACTIVE',
                'OBJECTIF_ATTEINT',
                'DON_RECU',
                'TRESORIER_RETRAIT',
                'RAPPEL_PAIEMENT',
            ])->change();
        });
    }

    public function down(): void
    {
        Schema::table('notifications_financieres', function (Blueprint $table) {
            $table->enum('type', [
                'PAIEMENT_RECU',
                'RETARD_COTISATION',
                'CAMPAGNE_ACTIVE',
                'OBJECTIF_ATTEINT',
                'DON_RECU',
                'TRESORIER_RETRAIT',
                'RAPPEL_PAIEMENT',
            ])->change();
        });
    }
};
