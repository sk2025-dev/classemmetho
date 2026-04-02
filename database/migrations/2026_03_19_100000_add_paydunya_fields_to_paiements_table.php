<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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
            if (!$this->indexExists('paiements', 'idx_paydunya_transaction')) {
                $table->index('paydunya_transaction_id', 'idx_paydunya_transaction');
            }
            if (!$this->indexExists('paiements', 'idx_payment_status')) {
                $table->index('payment_status', 'idx_payment_status');
            }
            if (!$this->indexExists('paiements', 'idx_year_cotisation')) {
                $table->index(['year', 'cotisation_id'], 'idx_year_cotisation');
            }
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            if ($this->indexExists('paiements', 'idx_paydunya_transaction')) {
                $table->dropIndex('idx_paydunya_transaction');
            }
            if ($this->indexExists('paiements', 'idx_payment_status')) {
                $table->dropIndex('idx_payment_status');
            }
            if ($this->indexExists('paiements', 'idx_year_cotisation')) {
                $table->dropIndex('idx_year_cotisation');
            }
            if ($this->indexExists('paiements', 'paiements_paydunya_transaction_id_unique')) {
                $table->dropUnique('paiements_paydunya_transaction_id_unique');
            }

            $columnsToDrop = array_values(array_filter([
                Schema::hasColumn('paiements', 'year') ? 'year' : null,
                Schema::hasColumn('paiements', 'provider') ? 'provider' : null,
                Schema::hasColumn('paiements', 'paydunya_transaction_id') ? 'paydunya_transaction_id' : null,
                Schema::hasColumn('paiements', 'paydunya_reference') ? 'paydunya_reference' : null,
                Schema::hasColumn('paiements', 'payment_status') ? 'payment_status' : null,
                Schema::hasColumn('paiements', 'return_url') ? 'return_url' : null,
                Schema::hasColumn('paiements', 'paydunya_response') ? 'paydunya_response' : null,
            ]));

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();
    }
};
