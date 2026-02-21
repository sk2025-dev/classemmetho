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
        Schema::dropIfExists('user_sacrements');

        Schema::create('user_sacrements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            /* ====== STATUT MATRIMONIAL CIVIL ====== */

            // Mariage civil
            $table->boolean('est_marie')->default(false);
            $table->date('mariage_civil_date')->nullable();
            $table->string('mariage_civil_lieu', 255)->nullable();

            // Dot
            $table->boolean('dot_effectue')->default(false);
            $table->date('dot_date')->nullable();
            $table->string('dot_lieu', 255)->nullable();

            // Veuvage
            $table->boolean('est_veuf')->default(false);
            $table->date('deces_conjoint_date')->nullable();
            $table->string('deces_conjoint_lieu', 255)->nullable();

            // Divorce
            $table->boolean('est_divorce')->default(false);
            $table->date('divorce_date')->nullable();
            $table->string('divorce_lieu', 255)->nullable();

            /* ====== SACREMENTS RELIGIEUX ====== */

            // Baptême
            $table->boolean('baptise')->default(false);
            $table->date('bapteme_date')->nullable();
            $table->string('bapteme_lieu', 255)->nullable();

            // Première communion
            $table->boolean('premiere_communion')->default(false);
            $table->date('premiere_communion_date')->nullable();
            $table->string('premiere_communion_lieu', 255)->nullable();

            // Mariage religieux
            $table->boolean('marie_religieusement')->default(false);
            $table->date('mariage_religieux_date')->nullable();
            $table->string('mariage_religieux_lieu', 255)->nullable();

            /* ====== META ====== */
            $table->timestamps();

            // Index pour les requêtes fréquentes
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_sacrements');
    }
};
