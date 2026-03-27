<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('formation_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('membre_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('conducteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('classe_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->foreignId('family_id')->nullable()->constrained('families')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->enum('statut', [
                'SOUMISE',
                'EN_ATTENTE_CONDUCTEUR',
                'TRANSMISE_AU_PASTEUR',
                'VALIDEE',
                'REFUSEE_PAR_CONDUCTEUR',
                'REFUSEE_PAR_PASTEUR',
                'PUBLIEE',
                'CELEBRE',
                'TERMINE',
                'ARCHIVEE',
            ])->default('SOUMISE');
            $table->string('conjoint_nom')->nullable();
            $table->string('conjoint_contact')->nullable();
            $table->string('conjoint_phone')->nullable();
            $table->string('conjoint_profession')->nullable();
            $table->date('conjoint_birthdate')->nullable();
            $table->boolean('conjoint_baptized')->default(false);
            $table->string('conjoint_church')->nullable();
            $table->text('message')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['membre_id', 'family_id']);
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('formation_requests');
    }
};
