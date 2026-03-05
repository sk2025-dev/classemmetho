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
        Schema::create('actes_liturgiques', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();

            $table->enum('type_acte', [
                'bapteme',
                'premiere_communion',
                'mariage',
                'naissance',
                'deces',
            ]);

            $table->enum('statut', [
                'SOUMISE',
                'EN_ATTENTE_CONDUCTEUR',
                'TRANSMISE_AU_PASTEUR',
                'VALIDEE',
                'REFUSEE_PAR_CONDUCTEUR',
                'REFUSEE_PAR_PASTEUR',
                'ARCHIVEE',
            ])->default('SOUMISE');

            $table->foreignId('membre_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('classe_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->foreignId('conducteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('pasteur_id')->nullable()->constrained('users')->nullOnDelete();

            $table->date('date_souhaitee')->nullable();
            $table->json('details')->nullable();

            $table->text('note_conducteur')->nullable();
            $table->text('note_pastorale')->nullable();
            $table->text('note_admin')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['type_acte', 'statut']);
            $table->index(['classe_id', 'statut']);
            $table->index('membre_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actes_liturgiques');
    }
};
