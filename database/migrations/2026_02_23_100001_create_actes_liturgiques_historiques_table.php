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
        Schema::create('actes_liturgiques_historiques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('acte_id')->constrained('actes_liturgiques')->cascadeOnDelete();

            $table->string('statut_precedent')->nullable();
            $table->string('statut_nouveau');

            $table->foreignId('acteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('commentaire')->nullable();

            $table->timestamps();

            $table->index(['acte_id', 'created_at']);
            $table->index('statut_nouveau');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actes_liturgiques_historiques');
    }
};
