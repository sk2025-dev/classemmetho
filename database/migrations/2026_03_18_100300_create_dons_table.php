<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->nullable()->constrained('families')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('campagne_id')->nullable()->constrained('campagnes')->nullOnDelete();
            $table->unsignedBigInteger('montant');
            $table->enum('type', ['LIBRE', 'CAMPAGNE'])->default('LIBRE');
            $table->enum('mode_paiement', ['MOBILE_MONEY', 'ESPECES', 'VIREMENT'])->default('MOBILE_MONEY');
            $table->date('date_don');
            $table->string('reference_recu')->nullable()->unique();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['family_id', 'date_don']);
            $table->index(['campagne_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dons');
    }
};
