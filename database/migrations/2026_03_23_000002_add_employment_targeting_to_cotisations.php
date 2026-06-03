<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cotisations', function (Blueprint $table) {
            // Ajouter ciblage par statut d'emploi
            if (!Schema::hasColumn('cotisations', 'target_employment_statuses')) {
                $table->json('target_employment_statuses')->nullable()->after('target_scope')->comment('Array of employment statuses: TRAVAILLEUR, RETRAITE, ETUDIANT, SANS_EMPLOI');
            }

            // Ajouter ciblage par genre
            if (!Schema::hasColumn('cotisations', 'target_genders')) {
                $table->json('target_genders')->nullable()->after('target_employment_statuses')->comment('Array of genders: M, F, Autre');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cotisations', function (Blueprint $table) {
            if (Schema::hasColumn('cotisations', 'target_employment_statuses')) {
                $table->dropColumn('target_employment_statuses');
            }
            if (Schema::hasColumn('cotisations', 'target_genders')) {
                $table->dropColumn('target_genders');
            }
        });
    }
};
