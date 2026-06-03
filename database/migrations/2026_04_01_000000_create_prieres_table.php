<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('prieres')) {
            return;
        }

        Schema::create('prieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('classe_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->string('role_soumission', 50);
            $table->string('sujet');
            $table->text('demande');
            $table->boolean('est_anonyme')->default(true);
            $table->string('nom_affiche')->nullable();
            $table->string('statut', 50)->default('Nouvelle');
            $table->text('temoignage')->nullable();
            $table->json('commentaires_data')->nullable();
            $table->json('destinataires_data')->nullable();
            $table->json('historiques_data')->nullable();
            $table->timestamp('vue_le')->nullable();
            $table->timestamp('prise_en_priere_le')->nullable();
            $table->timestamp('exaucee_le')->nullable();
            $table->foreignId('vue_par_pasteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('prise_en_priere_par_pasteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('exaucee_par_pasteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['statut', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['classe_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prieres');
    }
};
