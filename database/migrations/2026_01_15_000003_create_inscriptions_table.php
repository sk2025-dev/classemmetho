<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inscriptions', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['famille', 'conducteur'])->default('famille');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('family_id')->nullable()->constrained('families')->nullOnDelete();
            $table->foreignId('classe_id')->nullable()->constrained('classes')->nullOnDelete();

            $table->string('nom')->nullable();
            $table->string('prenom')->nullable();
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->date('date_naissance')->nullable();
            $table->string('genre')->nullable();
            $table->string('photo_path')->nullable();
            $table->json('data')->nullable();

            $table->boolean('admin_approved')->nullable();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('admin_approved_at')->nullable();

            $table->boolean('conducteur_approved')->nullable();
            $table->foreignId('conducteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('conducteur_approved_at')->nullable();

            $table->enum('status', ['en_attente', 'approuve', 'rejete'])->default('en_attente');
            $table->timestamps();
        });

        // Ajouter la FK pour families.inscription_id (créée après inscriptions)
        if (Schema::hasTable('families')) {
            try {
                Schema::table('families', function (Blueprint $table) {
                    $table->foreign('inscription_id')
                        ->references('id')
                        ->on('inscriptions')
                        ->nullOnDelete();
                });
            } catch (\Exception $e) {
                // FK might already exist
            }
        }
    }

    public function down(): void
    {
        // Supprimer la FK pour families d'abord
        if (Schema::hasTable('families')) {
            try {
                Schema::table('families', function (Blueprint $table) {
                    $table->dropForeign(['inscription_id']);
                });
            } catch (\Exception $e) {
                // FK might not exist
            }
        }

        Schema::dropIfExists('inscriptions');
    }
};
