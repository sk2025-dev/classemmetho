<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ajoute toutes les colonnes manquantes à users en une seule migration
     * Consolide ce qui était dispersé dans plusieurs migrations
     */
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = Schema::getColumnListing('users');

                // === Identifiants et données personnelles ===
                if (!in_array('identifier', $columns)) {
                    $table->string('identifier')->unique()->after('email');
                }

                if (!in_array('nom', $columns)) {
                    $table->string('nom')->nullable()->after('identifier');
                }

                if (!in_array('prenom', $columns)) {
                    $table->string('prenom')->nullable()->after('nom');
                }

                if (!in_array('genre', $columns)) {
                    $table->enum('genre', ['M', 'F', 'Autre'])->nullable()->after('prenom');
                }

                if (!in_array('date_naissance', $columns)) {
                    $table->date('date_naissance')->nullable()->after('genre');
                }

                // === Contact ===
                if (!in_array('telephone', $columns)) {
                    $table->string('telephone')->nullable();
                }

                if (!in_array('telephone2', $columns)) {
                    $table->string('telephone2')->nullable();
                }

                // === Photos et profil ===
                if (!in_array('photo_path', $columns)) {
                    $table->string('photo_path')->nullable();
                }

                if (!in_array('photo_url', $columns)) {
                    $table->string('photo_url')->nullable();
                }

                // === Professionnel ===
                if (!in_array('profession', $columns)) {
                    $table->string('profession')->nullable();
                }

                if (!in_array('relation', $columns)) {
                    $table->string('relation')->nullable();
                }

                // === Relations ===
                if (!in_array('fonction_id', $columns)) {
                    $table->unsignedBigInteger('fonction_id')->nullable(); // FK sera créée en async
                }
                if (!in_array('ville_id', $columns)) {
                    $table->unsignedBigInteger('ville_id')->nullable(); // FK sera créée en async
                }

                if (!in_array('family_id', $columns)) {
                    $table->unsignedBigInteger('family_id')->nullable(); // FK sera créée en async
                }

                // === Gestion du compte ===
                if (!in_array('role', $columns)) {
                    $table->enum('role', ['admin', 'pasteur', 'conducteur', 'responsable_famille', 'membre_famille'])->default('membre_famille')->nullable();
                }

                if (!in_array('must_change_password', $columns)) {
                    $table->boolean('must_change_password')->default(true);
                }

                if (!in_array('last_login_at', $columns)) {
                    $table->timestamp('last_login_at')->nullable();
                }
            });

            // === Ajouter les indices ===
            try {
                Schema::table('users', function (Blueprint $table) {
                    if (!DB::connection()->getSchemaBuilder()->hasIndex('users', 'users_identifier_unique')) {
                        $table->unique('identifier', 'users_identifier_unique');
                    }
                    if (!DB::connection()->getSchemaBuilder()->hasIndex('users', 'users_email_index')) {
                        $table->index('email', 'users_email_index');
                    }
                });
            } catch (\Exception $e) {
                // Indices might already exist
            }
        }
    }

    public function down(): void
    {
        // Ne pas supprimer les colonnes - elles sont essentielles
    }
};
