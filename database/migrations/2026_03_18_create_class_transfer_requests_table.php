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
        Schema::create('class_transfer_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained('families')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('source_class_id')->constrained('classes')->onDelete('restrict');
            $table->foreignId('target_class_id')->constrained('classes')->onDelete('restrict');
            $table->enum('type', ['member', 'family'])->default('member');
            $table->text('reason')->nullable();
            $table->enum('status', [
                'SOUMISE',
                'EN_ATTENTE_SOURCE',
                'VALIDEE_SOURCE',
                'EN_ATTENTE_ACCUEIL',
                'VALIDEE_ACCUEIL',
                'TERMINEE',
                'REFUSEE'
            ])->default('SOUMISE');
            $table->string('reference')->unique();
            $table->timestamp('validated_by_source_at')->nullable();
            $table->foreignId('validated_by_source_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('validated_by_accueil_at')->nullable();
            $table->foreignId('validated_by_accueil_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('refusal_reason')->nullable();
            $table->foreignId('created_by_id')->constrained('users')->onDelete('restrict');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_transfer_requests');
    }
};
