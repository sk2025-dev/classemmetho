<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute le statut d'emploi à la table users
     * Permet de cibler les cotisations par catégorie d'emploi
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'employment_status')) {
                $table->enum('employment_status', [
                    'TRAVAILLEUR',
                    'RETRAITE',
                    'ETUDIANT',
                    'SANS_EMPLOI',
                ])->nullable()->after('profession')
                    ->comment('Statut d\'emploi pour ciblage des cotisations');
            }

            if (!Schema::hasColumn('users', 'profession_detail')) {
                $table->string('profession_detail')->nullable()->after('employment_status')
                    ->comment('Description détaillée de la profession (ex: Infirmier, Commerçant)');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'employment_status')) {
                $table->dropColumn('employment_status');
            }
            if (Schema::hasColumn('users', 'profession_detail')) {
                $table->dropColumn('profession_detail');
            }
        });
    }
};
