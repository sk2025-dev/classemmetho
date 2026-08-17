<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tribus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->foreignId('chef_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->unique(['classe_id', 'nom']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tribus');
    }
};
