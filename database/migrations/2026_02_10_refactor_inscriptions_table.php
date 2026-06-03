<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Refactorisation de la table inscriptions comme table d'archivage
     */
    public function up(): void
    {
        if (Schema::hasTable('inscriptions')) {
            // D'abord supprimer les colonnes booléennes d'approbation
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');

                if (in_array('admin_approved', $columns)) {
                    $table->dropColumn('admin_approved');
                }
                if (in_array('conducteur_approved', $columns)) {
                    $table->dropColumn('conducteur_approved');
                }
            });

            // Supprimer les contraintes de clés étrangères si elles existent
            try {
                DB::statement('ALTER TABLE inscriptions DROP FOREIGN KEY inscriptions_user_id_foreign');
            } catch (\Illuminate\Database\QueryException $e) {
                // Constraint doesn't exist
            }
            try {
                DB::statement('ALTER TABLE inscriptions DROP FOREIGN KEY inscriptions_created_by_foreign');
            } catch (\Illuminate\Database\QueryException $e) {
                // Constraint doesn't exist
            }
            try {
                DB::statement('ALTER TABLE inscriptions DROP FOREIGN KEY inscriptions_family_id_foreign');
            } catch (\Illuminate\Database\QueryException $e) {
                // Constraint doesn't exist
            }
            try {
                DB::statement('ALTER TABLE inscriptions DROP FOREIGN KEY inscriptions_classe_id_foreign');
            } catch (\Illuminate\Database\QueryException $e) {
                // Constraint doesn't exist
            }

            // Maintenant supprimer les colonnes avec les clés étrangères
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');

                $toDelete = [
                    'nom',
                    'prenom',
                    'email',
                    'telephone',
                    'date_naissance',
                    'genre',
                    'photo_path',
                    'user_id',
                    'created_by',
                    'family_id',
                    'classe_id',
                ];

                foreach ($toDelete as $col) {
                    if (in_array($col, $columns)) {
                        $table->dropColumn($col);
                    }
                }
            });

            // Ajouter les colonnes manquantes
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');

                if (!in_array('family_temp_key', $columns)) {
                    $table->string('family_temp_key')->nullable()->unique();
                }

                if (!in_array('photo_data', $columns)) {
                    $table->longText('photo_data')->nullable();
                }

                if (!in_array('data', $columns)) {
                    $table->json('data')->nullable();
                }

                if (!in_array('status', $columns)) {
                    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                }

                if (!in_array('raison_rejet', $columns)) {
                    $table->text('raison_rejet')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('inscriptions')) {
            // Supprimer les colonnes ajoutées
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');
                $toDelete = ['family_temp_key', 'photo_data', 'raison_rejet'];

                foreach ($toDelete as $col) {
                    if (in_array($col, $columns)) {
                        $table->dropColumn($col);
                    }
                }
            });

            // Restaurer les colonnes supprimées
            Schema::table('inscriptions', function (Blueprint $table) {
                $table->string('nom')->nullable();
                $table->string('prenom')->nullable();
                $table->string('email')->nullable();
                $table->string('telephone')->nullable();
                $table->date('date_naissance')->nullable();
                $table->string('genre')->nullable();
                $table->string('photo_path')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('family_id')->nullable();
                $table->unsignedBigInteger('classe_id')->nullable();
                $table->boolean('admin_approved')->nullable();
                $table->boolean('conducteur_approved')->nullable();
            });

            // Restaurer les contraintes de clés étrangères
            Schema::table('inscriptions', function (Blueprint $table) {
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
                $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
                $table->foreign('family_id')->references('id')->on('families')->nullOnDelete();
                $table->foreign('classe_id')->references('id')->on('classes')->nullOnDelete();
            });
        }
    }
};
