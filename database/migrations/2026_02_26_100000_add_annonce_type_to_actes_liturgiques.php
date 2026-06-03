<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ajouter les types annonce à l'enum type_acte
        Schema::table('actes_liturgiques', function (Blueprint $table) {
            // Créer une table temporaire pour la nouvelle enum
            $table->enum('type_acte', [
                'bapteme',
                'premiere_communion',
                'mariage',
                'naissance',
                'deces',
                'annonce',
                'annonce_liturgique',
            ])->change();
        });

        // Ajouter les nouveaux statuts pour les annonces
        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->enum('statut', [
                'SOUMISE',
                'EN_ATTENTE_CONDUCTEUR',
                'TRANSMISE_AU_PASTEUR',
                'VALIDEE',
                'REFUSEE_PAR_CONDUCTEUR',
                'REFUSEE_PAR_PASTEUR',
                'CELEBRE',
                'TERMINE',
                'ARCHIVEE',
                'PUBLIEE', // Pour les annonces publiées
            ])->change();
        });

        // Ajouter les champs spécifiques aux annonces
        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->dateTime('date_publication')->nullable()->after('date_souhaitee');
            $table->dateTime('date_expiration')->nullable()->after('date_publication');
            $table->boolean('est_principale')->default(false)->after('date_expiration');
            $table->foreignId('family_id')->nullable()->constrained()->nullOnDelete()->after('conducteur_id');
            $table->foreignId('publiee_par')->nullable()->constrained('users')->nullOnDelete()->after('pasteur_id');
        });
    }

    public function down(): void
    {
        DB::table('actes_liturgiques')
            ->whereNotIn('statut', [
                'SOUMISE',
                'EN_ATTENTE_CONDUCTEUR',
                'TRANSMISE_AU_PASTEUR',
                'VALIDEE',
                'REFUSEE_PAR_CONDUCTEUR',
                'REFUSEE_PAR_PASTEUR',
                'ARCHIVEE',
            ])
            ->delete();

        DB::table('actes_liturgiques')
            ->whereNotIn('type_acte', [
                'bapteme',
                'premiere_communion',
                'mariage',
                'naissance',
                'deces',
                'annonce',
                'annonce_liturgique',
            ])
            ->delete();

        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->dropForeign(['family_id']);
            $table->dropForeign(['publiee_par']);
            $table->dropColumn(['date_publication', 'date_expiration', 'est_principale', 'family_id', 'publiee_par']);

            // Restaurer l'enum originale
            $table->enum('statut', [
                'SOUMISE',
                'EN_ATTENTE_CONDUCTEUR',
                'TRANSMISE_AU_PASTEUR',
                'VALIDEE',
                'REFUSEE_PAR_CONDUCTEUR',
                'REFUSEE_PAR_PASTEUR',
                'ARCHIVEE',
            ])->change();

            $table->enum('type_acte', [
                'bapteme',
                'premiere_communion',
                'mariage',
                'naissance',
                'deces',
            ])->change();
        });
    }
};
