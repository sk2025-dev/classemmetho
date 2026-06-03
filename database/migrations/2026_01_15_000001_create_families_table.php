<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('families', function (Blueprint $table) {
            // === Identifiants de base ===
            $table->id();

            // === Informations de la famille ===
            $table->string('nom');
            $table->text('adresse')->nullable();
            $table->string('quartier')->nullable();
            $table->string('email')->nullable();

            // === Contacts  ===
            $table->string('telephone')->nullable();
            $table->string('telephone2')->nullable();

            // === Relations ===
            $table->foreignId('responsable_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('classe_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->unsignedBigInteger('ville_id')->nullable(); // FK sera créée après que villes existe
            $table->unsignedBigInteger('inscription_id')->nullable(); // FK sera créée après que inscriptions existe

            // === Gestion et audit ===
            $table->softDeletes();
            $table->timestamps();

            // === Indices ===
            $table->index('email');
            $table->index('ville_id');
            $table->index(['responsable_id', 'classe_id']);
        });
    }

    public function down(): void
    {
        // Désactiver les contraintes d'intégrité avant de supprimer la table
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Schema::dropIfExists('families');
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }
};
