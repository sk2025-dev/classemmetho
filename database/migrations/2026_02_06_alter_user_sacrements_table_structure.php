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
        // Vérifier si la table existe et supprimer les colonnes existantes
        if (Schema::hasTable('user_sacrements')) {
            Schema::table('user_sacrements', function (Blueprint $table) {
                // Supprimer les colonnes de l'ancien modèle si elles existent
                if (Schema::hasColumn('user_sacrements', 'type')) {
                    $table->dropColumn('type');
                }
                if (Schema::hasColumn('user_sacrements', 'date')) {
                    $table->dropColumn('date');
                }
                if (Schema::hasColumn('user_sacrements', 'lieu')) {
                    $table->dropColumn('lieu');
                }
                if (Schema::hasColumn('user_sacrements', 'commentaire')) {
                    $table->dropColumn('commentaire');
                }
            });

            // Ajouter les nouvelles colonnes
            Schema::table('user_sacrements', function (Blueprint $table) {
                // Rendre la contrainte unique sur user_id
                if (!Schema::hasColumn('user_sacrements', 'est_marie')) {
                    /* ====== STATUT MATRIMONIAL CIVIL ====== */
                    // Mariage civil
                    $table->boolean('est_marie')->default(false);
                    $table->date('mariage_civil_date')->nullable();
                    $table->string('mariage_civil_lieu', 255)->nullable();

                    // Dot
                    $table->boolean('dot_effectue')->default(false);
                    $table->date('dot_date')->nullable();
                    $table->string('dot_lieu', 255)->nullable();

                    // Veuvage
                    $table->boolean('est_veuf')->default(false);
                    $table->date('deces_conjoint_date')->nullable();
                    $table->string('deces_conjoint_lieu', 255)->nullable();

                    // Divorce
                    $table->boolean('est_divorce')->default(false);
                    $table->date('divorce_date')->nullable();
                    $table->string('divorce_lieu', 255)->nullable();

                    /* ====== SACREMENTS RELIGIEUX ====== */
                    // Baptême
                    $table->boolean('baptise')->default(false);
                    $table->date('bapteme_date')->nullable();
                    $table->string('bapteme_lieu', 255)->nullable();

                    // Première communion
                    $table->boolean('premiere_communion')->default(false);
                    $table->date('premiere_communion_date')->nullable();
                    $table->string('premiere_communion_lieu', 255)->nullable();

                    // Mariage religieux
                    $table->boolean('marie_religieusement')->default(false);
                    $table->date('mariage_religieux_date')->nullable();
                    $table->string('mariage_religieux_lieu', 255)->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('user_sacrements')) {
            Schema::table('user_sacrements', function (Blueprint $table) {
                $columns = ['est_marie', 'mariage_civil_date', 'mariage_civil_lieu',
                           'dot_effectue', 'dot_date', 'dot_lieu',
                           'est_veuf', 'deces_conjoint_date', 'deces_conjoint_lieu',
                           'est_divorce', 'divorce_date', 'divorce_lieu',
                           'baptise', 'bapteme_date', 'bapteme_lieu',
                           'premiere_communion', 'premiere_communion_date', 'premiere_communion_lieu',
                           'marie_religieusement', 'mariage_religieux_date', 'mariage_religieux_lieu'];

                foreach ($columns as $column) {
                    if (Schema::hasColumn('user_sacrements', $column)) {
                        $table->dropColumn($column);
                    }
                }

                // Re-ajouter les anciennes colonnes si nécessaire
                $table->enum('type', [
                    'bapteme',
                    'premiere_communion',
                    'confirmation',
                    'mariage_religieux',
                    'mariage_civil',
                    'divorce',
                    'deces',
                    'dot'
                ])->nullable();
                $table->date('date')->nullable();
                $table->string('lieu')->nullable();
                $table->text('commentaire')->nullable();
            });
        }
    }
};
