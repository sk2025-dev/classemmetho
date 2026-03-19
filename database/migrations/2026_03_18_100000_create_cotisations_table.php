<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cotisations', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->unsignedBigInteger('montant');
            $table->enum('periodicite', ['MENSUEL', 'TRIMESTRIEL', 'ANNUEL', 'UNIQUE'])->default('MENSUEL');
            $table->enum('statut', ['ACTIVE', 'SUSPENDUE', 'ANNULEE'])->default('ACTIVE');
            $table->foreignId('classe_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->text('description')->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->timestamps();

            $table->index(['statut', 'periodicite']);
            $table->index('classe_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cotisations');
    }
};
