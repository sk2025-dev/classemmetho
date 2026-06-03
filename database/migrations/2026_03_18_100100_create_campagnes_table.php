<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campagnes', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->unsignedBigInteger('objectif_montant');
            $table->unsignedBigInteger('montant_collecte')->default(0);
            $table->enum('scope', ['GLOBAL', 'CLASSE'])->default('GLOBAL');
            $table->foreignId('classe_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->enum('statut', ['ACTIVE', 'CLOTUREE', 'ANNULEE'])->default('ACTIVE');
            $table->timestamps();

            $table->index(['scope', 'statut']);
            $table->index('classe_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campagnes');
    }
};
