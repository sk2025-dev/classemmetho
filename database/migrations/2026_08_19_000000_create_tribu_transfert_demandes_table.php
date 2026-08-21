<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tribu_transfert_demandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membre_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tribu_origine_id')->constrained('tribus')->cascadeOnDelete();
            $table->foreignId('tribu_destination_id')->constrained('tribus')->cascadeOnDelete();
            $table->string('statut')->default('en_attente'); // en_attente | validee | refusee
            $table->string('motif', 500)->nullable();
            $table->foreignId('traite_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('traite_le')->nullable();
            $table->string('commentaire', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tribu_transfert_demandes');
    }
};
