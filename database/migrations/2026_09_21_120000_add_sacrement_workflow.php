<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campagnes_sacrements', function (Blueprint $table) {
            $table->timestamp('archivee_at')->nullable();
            $table->json('journal')->nullable();
        });
        Schema::create('listes_sacrements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campagne_id')->constrained('campagnes_sacrements');
            $table->foreignId('classe_id')->constrained('classes');
            $table->unsignedInteger('version');
            $table->string('statut');
            $table->json('candidats');
            $table->json('journal');
            $table->timestamps();
            $table->unique(['campagne_id', 'classe_id', 'version']);
        });
        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->foreignId('campagne_id')->nullable()->constrained('campagnes_sacrements');
            $table->foreignId('liste_sacrement_id')->nullable()->constrained('listes_sacrements');
            $table->json('suivi_sacrement')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->dropConstrainedForeignId('liste_sacrement_id');
            $table->dropConstrainedForeignId('campagne_id');
            $table->dropColumn('suivi_sacrement');
        });
        Schema::dropIfExists('listes_sacrements');
        Schema::table('campagnes_sacrements', fn (Blueprint $table) => $table->dropColumn(['archivee_at', 'journal']));
    }
};
