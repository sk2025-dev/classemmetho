<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Nettoie la table users en supprimant les colonnes liées aux sacrements
     * Ces informations iront dans user_sacrements
     */
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                // Supprimer les colonnes à archiver dans user_sacrements
                $columns = Schema::getColumnListing('users');

                $toDelete = [
                    'statut_marital',
                    'date_mariage',
                    'lieu_mariage',
                    'date_divorce',
                    'baptise',
                    'date_bapteme',
                    'lieu_bapteme',
                    'premiere_communion',
                    'date_premiere_communion',
                    'lieu_premiere_communion',
                    'mariage_religieux',
                    'date_mariage_religieux',
                    'lieu_mariage_religieux',
                    'date_dot',
                    'lieu_dot',
                    'date_deces',
                    'fonction_professionnelle',
                ];

                foreach ($toDelete as $col) {
                    if (in_array($col, $columns)) {
                        $table->dropColumn($col);
                    }
                }

                // Ajouter les colonnes manquantes si nécessaire
                if (!in_array('classe_id', $columns)) {
                    $table->foreignId('classe_id')->nullable()->constrained('classes')->nullOnDelete();
                }

                if (!in_array('fonction_id', $columns)) {
                    $table->foreignId('fonction_id')->nullable()->constrained('fonctions')->nullOnDelete();
                }

                if (!in_array('is_family_responsible', $columns)) {
                    $table->boolean('is_family_responsible')->default(false);
                }

                if (!in_array('last_login_at', $columns)) {
                    $table->timestamp('last_login_at')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                // Restaurer les colonnes si rollback (seulement si elles n'existent pas)
                if (!Schema::hasColumn('users', 'statut_marital')) {
                    $table->string('statut_marital')->nullable();
                }
                if (!Schema::hasColumn('users', 'date_mariage')) {
                    $table->date('date_mariage')->nullable();
                }
                if (!Schema::hasColumn('users', 'lieu_mariage')) {
                    $table->string('lieu_mariage')->nullable();
                }
                if (!Schema::hasColumn('users', 'date_divorce')) {
                    $table->date('date_divorce')->nullable();
                }
                if (!Schema::hasColumn('users', 'baptise')) {
                    $table->boolean('baptise')->nullable();
                }
                if (!Schema::hasColumn('users', 'date_bapteme')) {
                    $table->date('date_bapteme')->nullable();
                }
                if (!Schema::hasColumn('users', 'lieu_bapteme')) {
                    $table->string('lieu_bapteme')->nullable();
                }
                if (!Schema::hasColumn('users', 'premiere_communion')) {
                    $table->boolean('premiere_communion')->nullable();
                }
                if (!Schema::hasColumn('users', 'date_premiere_communion')) {
                    $table->date('date_premiere_communion')->nullable();
                }
                if (!Schema::hasColumn('users', 'lieu_premiere_communion')) {
                    $table->string('lieu_premiere_communion')->nullable();
                }
                if (!Schema::hasColumn('users', 'mariage_religieux')) {
                    $table->boolean('mariage_religieux')->nullable();
                }
                if (!Schema::hasColumn('users', 'date_mariage_religieux')) {
                    $table->date('date_mariage_religieux')->nullable();
                }
                if (!Schema::hasColumn('users', 'lieu_mariage_religieux')) {
                    $table->string('lieu_mariage_religieux')->nullable();
                }
                if (!Schema::hasColumn('users', 'date_dot')) {
                    $table->date('date_dot')->nullable();
                }
                if (!Schema::hasColumn('users', 'lieu_dot')) {
                    $table->string('lieu_dot')->nullable();
                }
                if (!Schema::hasColumn('users', 'date_deces')) {
                    $table->date('date_deces')->nullable();
                }
                if (!Schema::hasColumn('users', 'fonction_professionnelle')) {
                    $table->string('fonction_professionnelle')->nullable();
                }

                // Supprimer les colonnes ajoutées en up()
                $columns = Schema::getColumnListing('users');
                $toDelete = ['is_family_responsible', 'last_login_at'];
                // NOTE: classe_id et fonction_id NE sont pas supprimées ici
                // Elles sont gérées par 2026_02_03_add_foreign_keys_to_users pour les FKs

                foreach ($toDelete as $col) {
                    if (in_array($col, $columns)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
