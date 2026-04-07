<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CleanUpSpecialEventsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Désactiver les contraintes de clés étrangères
        Schema::disableForeignKeyConstraints();
        
        // Supprimer la table si elle existe
        Schema::dropIfExists('special_events');
        
        // Réactiver les contraintes
        Schema::enableForeignKeyConstraints();
        
        // Recréer la table avec la structure correcte
        Schema::create('special_events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->date('date');
            $table->time('time');
            $table->string('orateur')->nullable();
            $table->string('moderateur')->nullable();
            $table->string('dirigeant_priere')->nullable();
            $table->text('lieu')->nullable();
            $table->foreignId('class_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->boolean('is_parish')->default(false);
            $table->timestamps();
            
            // Ajouter des index pour les performances
            $table->index(['class_id', 'date']);
            $table->index(['date', 'is_parish']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('special_events');
    }
}