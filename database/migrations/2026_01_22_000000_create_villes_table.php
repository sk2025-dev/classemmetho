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
        Schema::create('villes', function (Blueprint $table) {
            $table->id();
            $table->string('nom')->unique();
            $table->string('code')->nullable()->unique();
            $table->string('region')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Ajouter la FK pour families.ville_id (créée après villes)
        if (Schema::hasTable('families')) {
            try {
                Schema::table('families', function (Blueprint $table) {
                    $table->foreign('ville_id')
                        ->references('id')
                        ->on('villes')
                        ->nullOnDelete();
                });
            } catch (\Exception $e) {
                // FK might already exist
            }
        }

        // Ajouter une clé étrangère dans la table inscriptions
        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                if (!Schema::hasColumn('inscriptions', 'ville_id')) {
                    $table->foreignId('ville_id')->nullable()->constrained('villes')->onDelete('set null');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Supprimer les FK d'abord
        if (Schema::hasTable('families')) {
            try {
                Schema::table('families', function (Blueprint $table) {
                    $table->dropForeign(['ville_id']);
                });
            } catch (\Exception $e) {
                // FK might not exist
            }
        }

        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                if (Schema::hasColumn('inscriptions', 'ville_id')) {
                    try {
                        $table->dropForeign(['ville_id']);
                    } catch (\Exception $e) {
                        // Foreign key might not exist
                    }
                    $table->dropColumn('ville_id');
                }
            });
        }

        Schema::dropIfExists('villes');
    }
};
