<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Supprime complètement la table family_members et toutes les références
     */
    public function up(): void
    {
        // Supprimer la table family_members
        Schema::dropIfExists('family_members');
    }

    /**
     * Restaurer la table family_members (en cas de rollback)
     */
    public function down(): void
    {
        if (!Schema::hasTable('family_members')) {
            Schema::create('family_members', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('family_id')->constrained()->cascadeOnDelete();
                $table->foreignId('classe_id')->nullable()->constrained()->nullOnDelete();
                $table->string('statut')->nullable();
                $table->string('relation')->nullable();
                $table->string('role')->nullable();
                $table->boolean('baptise')->default(false);
                $table->date('date_bapteme')->nullable();
                $table->string('lieu_bapteme')->nullable();
                $table->boolean('premiere_communion')->default(false);
                $table->date('date_premiere_communion')->nullable();
                $table->string('lieu_premiere_communion')->nullable();
                $table->boolean('mariage_religieux')->default(false);
                $table->date('date_mariage_religieux')->nullable();
                $table->string('lieu_mariage_religieux')->nullable();
                $table->string('contact_urgence')->nullable();
                $table->string('contact_urgence_tel')->nullable();
                $table->softDeletes();
                $table->timestamps();
            });
        }
    }
};
