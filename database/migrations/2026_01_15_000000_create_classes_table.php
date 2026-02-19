<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Désactiver les contraintes d'intégrité avant de supprimer la table
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Schema::dropIfExists('classes');
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }
};
