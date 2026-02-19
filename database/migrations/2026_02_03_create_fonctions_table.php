<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Créer la table fonctions (remplace church_roles)
     * Contient les fonctions/rôles de l'église méthodiste
     */
    public function up(): void
    {
        if (!Schema::hasTable('fonctions')) {
            Schema::create('fonctions', function (Blueprint $table) {
                $table->id();
                $table->string('nom')->unique();
                $table->text('description')->nullable();
                $table->timestamps();

                $table->index('nom');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fonctions');
    }
};
