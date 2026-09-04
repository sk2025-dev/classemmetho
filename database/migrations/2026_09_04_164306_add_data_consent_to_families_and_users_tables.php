<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Consentement aux conditions d'utilisation des données personnelles
 * (fonctionnalité activable via SiteSetting::get('consentement_donnees_actif')).
 *
 * - Portée famille : le responsable de famille valide pour tout son foyer.
 * - Portée individuelle : les comptes sans famille (conducteur, pasteur, admin
 *   isolés...) valident pour eux-mêmes.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('families') && !Schema::hasColumn('families', 'consentement_donnees_valide_at')) {
            Schema::table('families', function (Blueprint $table) {
                $table->timestamp('consentement_donnees_valide_at')->nullable()->after('responsable_id');
                $table->foreignId('consentement_donnees_valide_par')
                    ->nullable()
                    ->after('consentement_donnees_valide_at')
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }

        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'consentement_donnees_valide_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('consentement_donnees_valide_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('families') && Schema::hasColumn('families', 'consentement_donnees_valide_at')) {
            Schema::table('families', function (Blueprint $table) {
                $table->dropConstrainedForeignId('consentement_donnees_valide_par');
                $table->dropColumn('consentement_donnees_valide_at');
            });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'consentement_donnees_valide_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('consentement_donnees_valide_at');
            });
        }
    }
};
