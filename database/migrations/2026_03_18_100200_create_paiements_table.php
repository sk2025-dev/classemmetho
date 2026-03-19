<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained('families')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cotisation_id')->nullable()->constrained('cotisations')->nullOnDelete();
            $table->unsignedBigInteger('montant');
            $table->enum('mode_paiement', ['MOBILE_MONEY', 'ESPECES', 'VIREMENT'])->default('MOBILE_MONEY');
            $table->date('date_paiement');
            $table->string('reference_recu')->unique();
            $table->enum('statut', ['PAYE', 'PARTIELLEMENT_PAYE', 'EN_RETARD', 'ANNULE'])->default('PAYE');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['family_id', 'date_paiement']);
            $table->index(['cotisation_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
