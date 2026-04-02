<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('formation_request_historiques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('formation_request_id')->constrained('formation_requests')->cascadeOnDelete();
            $table->string('statut_precedent')->nullable();
            $table->string('statut_nouveau');
            $table->foreignId('acteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('commentaire')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('formation_request_historiques');
    }
};
