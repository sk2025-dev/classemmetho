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
        if (Schema::hasTable('fonction_user')) {
            return;
        }

        Schema::create('fonction_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('fonction_id')->constrained('fonctions')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'fonction_id']);
            $table->index(['user_id']);
            $table->index(['fonction_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fonction_user');
    }
};

