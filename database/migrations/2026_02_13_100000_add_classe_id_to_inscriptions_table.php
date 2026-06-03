<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Restaurer la colonne classe_id qui est essentielle pour les inscriptions
     */
    public function up(): void
    {
        Schema::table('inscriptions', function (Blueprint $table) {
            // Vérifier si la colonne n'existe pas avant de l'ajouter
            if (!Schema::hasColumn('inscriptions', 'classe_id')) {
                $table->unsignedBigInteger('classe_id')->nullable()->after('type');
                
                // Ajouter la contrainte de clé étrangère
                $table->foreign('classe_id')
                    ->references('id')
                    ->on('classes')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inscriptions', function (Blueprint $table) {
            // Supprimer la contrainte de clé étrangère
            if (Schema::hasColumn('inscriptions', 'classe_id')) {
                try {
                    $table->dropForeign(['classe_id']);
                } catch (\Exception $e) {
                    // Constraint might not exist
                }
                $table->dropColumn('classe_id');
            }
        });
    }
};
