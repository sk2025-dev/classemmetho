<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Supprimer les colonnes de sacrements de users
     * Ces données doivent être gérées uniquement par user_sacrements
     *
     * Colonnes supprimées:
     * - relation: lien de parenté (pas vraiment un sacrement)
     * - statut_marital: géré par user_sacrements.est_marie, est_veuf, est_divorce
     * - date_mariage: géré par user_sacraments.mariage_civil_date
     * - lieu_mariage: géré par user_sacrements.mariage_civil_lieu
     * - date_dot: géré par user_sacrements.dot_date
     * - lieu_dot: géré par user_sacrements.dot_lieu
     */
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = Schema::getColumnListing('users');

                $toDelete = [
                    'statut_marital',
                    'date_mariage',
                    'lieu_mariage',
                    'date_dot',
                    'lieu_dot',
                ];

                foreach ($toDelete as $col) {
                    if (in_array($col, $columns)) {
                        $table->dropColumn($col);
                    }
                }

                // 'relation' peut rester car c'est le lien familial (parent, enfant, etc.)
                // et non un sacrement religieux
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = Schema::getColumnListing('users');

                if (!in_array('statut_marital', $columns)) {
                    $table->string('statut_marital')->nullable()->after('relation');
                }
                if (!in_array('date_mariage', $columns)) {
                    $table->date('date_mariage')->nullable();
                }
                if (!in_array('lieu_mariage', $columns)) {
                    $table->string('lieu_mariage')->nullable();
                }
                if (!in_array('date_dot', $columns)) {
                    $table->date('date_dot')->nullable();
                }
                if (!in_array('lieu_dot', $columns)) {
                    $table->string('lieu_dot')->nullable();
                }
            });
        }
    }
};
