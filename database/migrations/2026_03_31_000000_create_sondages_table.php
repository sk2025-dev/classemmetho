<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sondages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('titre');
            $table->text('description')->nullable();
            $table->text('objectif')->nullable();
            $table->string('audience')->default('Tous les membres');
            $table->date('date_echeance')->nullable();
            $table->boolean('anonymat')->default(true);
            $table->text('message_fin')->nullable();
            $table->string('diffusion')->default('Lien partage');
            $table->json('questions')->nullable();
            $table->string('statut')->default('draft');
            $table->unsignedInteger('response_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['classe_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sondages');
    }
};
