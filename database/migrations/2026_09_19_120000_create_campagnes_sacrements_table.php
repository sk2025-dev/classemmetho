<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campagnes_sacrements', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('annee');
            $table->string('titre')->nullable();
            $table->date('date_ouverture');
            $table->date('date_fermeture');
            $table->enum('statut', ['brouillon', 'ouverte', 'fermee'])->default('brouillon');
            $table->timestamp('reouverte_at')->nullable();
            $table->foreignId('reouverte_par')->nullable()->constrained('users')->nullOnDelete();
            $table->string('motif_reouverture')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('fermee_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('fermee_at')->nullable();
            $table->timestamps();

            $table->index(['statut', 'date_ouverture', 'date_fermeture']);
            $table->index('annee');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campagnes_sacrements');
    }
};
