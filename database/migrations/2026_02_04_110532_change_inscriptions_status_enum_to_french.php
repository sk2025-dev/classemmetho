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
        // Modifier l'enum status pour utiliser des valeurs en français
        Schema::table('inscriptions', function (Blueprint $table) {
            // Modifier le type de la colonne status en enum français
            $table->enum('status', ['en_attente', 'approuve', 'rejete'])->default('en_attente')->change();
        });
    }

    public function down(): void
    {
        // Revenir à l'enum anglais
        Schema::table('inscriptions', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->change();
        });
    }
};
