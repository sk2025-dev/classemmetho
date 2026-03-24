<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permanent_activities', function (Blueprint $table) {
            $table->id();
            $table->string('type');          // mass, charity, youth, eveil, catechese, aumonerie, etc.
            $table->string('tag');           // affiché sur la carte (Culte, Social, Jeunes, Primaire, etc.)
            $table->string('day');           // Lundi, Mardi, …
            $table->string('time');          // 09h30
            $table->string('title');
            $table->string('speaker')->nullable();
            $table->string('prayer')->nullable();  // rôle "dirigeant" dans le frontend
            $table->string('master')->nullable();  // rôle "cérémonie"
            $table->string('choir')->nullable();
            $table->boolean('is_parish');    // true = paroisse, false = classes
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permanent_activities');
    }
};