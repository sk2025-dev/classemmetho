<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activite_id')->constrained('permanent_activities')->cascadeOnDelete();
            $table->foreignId('membre_famille_id')->constrained('users')->cascadeOnDelete();
            $table->string('statut')->default('present');
            $table->foreignId('marquee_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('marquee_le')->nullable();
            $table->string('methode')->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->unique(['activite_id', 'membre_famille_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presences');
    }
};
