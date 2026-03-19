<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications_financieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', [
                'PAIEMENT_RECU',
                'RETARD_COTISATION',
                'CAMPAGNE_ACTIVE',
                'OBJECTIF_ATTEINT',
                'DON_RECU',
            ]);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('entity_type')->nullable();
            $table->string('titre')->nullable();
            $table->text('message')->nullable();
            $table->boolean('lue')->default(false);
            $table->timestamp('lue_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'lue']);
            $table->index(['entity_type', 'entity_id']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications_financieres');
    }
};
