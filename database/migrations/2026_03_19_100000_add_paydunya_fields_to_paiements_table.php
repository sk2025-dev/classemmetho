<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            // Année de la cotisation
            if (!Schema::hasColumn('paiements', 'year')) {
                $table->unsignedSmallInteger('year')->nullable()->after('montant');
            }

            // Fournisseur mobile (wave, orange, mtn)
            if (!Schema::hasColumn('paiements', 'provider')) {
                $table->string('provider')->nullable()->after('mode_paiement')
                    ->comment('wave, orange, mtn - nullable si especes/virement');
            }

            // ID transaction PayDunya
            if (!Schema::hasColumn('paiements', 'paydunya_transaction_id')) {
                $table->string('paydunya_transaction_id')->nullable()->unique()->after('reference_recu')
                    ->comment('ID unique de la transaction chez PayDunya');
            }

            // Référence PayDunya
            if (!Schema::hasColumn('paiements', 'paydunya_reference')) {
                $table->string('paydunya_reference')->nullable()->after('paydunya_transaction_id')
                    ->comment('Numéro de référence côté PayDunya');
            }

            // État détaillé pour traçage transactionnel
            if (!Schema::hasColumn('paiements', 'payment_status')) {
                $table->enum('payment_status', [
                    'INITIE',      // Juste créé, pas encore envoyé à PayDunya
                    'EN_ATTENTE',  // Envoyé à PayDunya, en cours
                    'PAYE',        // Confirmé payé
                    'ECHEC',       // Rejeté par PayDunya
                    'ANNULE',      // Annulé par utilisateur
                    'EXPIRE',      // Non finalisé dans le délai
                ])->default('INITIE')->after('statut')
                    ->comment('État transactionnel du paiement');
            }

            // URL de retour depuis PayDunya
            if (!Schema::hasColumn('paiements', 'return_url')) {
                $table->text('return_url')->nullable()->after('note')
                    ->comment('URL vers laquelle rediriger après PayDunya');
            }

            // Données PayDunya brutes (pour debug/audit)
            if (!Schema::hasColumn('paiements', 'paydunya_response')) {
                $table->longText('paydunya_response')->nullable()->after('return_url')
                    ->comment('Réponse complète JSON du dernier appel PayDunya');
            }

            // Index pour requêtes courantes
            if (!Schema::hasIndex('paiements', 'idx_paydunya_transaction')) {
                $table->index('paydunya_transaction_id');
            }
            if (!Schema::hasIndex('paiements', 'idx_payment_status')) {
                $table->index('payment_status');
            }
            if (!Schema::hasIndex('paiements', 'idx_year_cotisation')) {
                $table->index(['year', 'cotisation_id']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropIndexIfExists('idx_paydunya_transaction');
            $table->dropIndexIfExists('idx_payment_status');
            $table->dropIndexIfExists('idx_year_cotisation');
            $table->dropColumnIfExists('year');
            $table->dropColumnIfExists('provider');
            $table->dropColumnIfExists('paydunya_transaction_id');
            $table->dropColumnIfExists('paydunya_reference');
            $table->dropColumnIfExists('payment_status');
            $table->dropColumnIfExists('return_url');
            $table->dropColumnIfExists('paydunya_response');
        });
    }
};
