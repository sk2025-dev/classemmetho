<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('demandes_transfert_classe')) {
            return;
        }

        if (Schema::hasTable('class_transfer_requests')) {
            Schema::table('class_transfer_requests', function (Blueprint $table) {
                $table->dropForeign(['family_id']);
                $table->dropForeign(['user_id']);
                $table->dropForeign(['source_class_id']);
                $table->dropForeign(['target_class_id']);
                $table->dropForeign(['validated_by_source_id']);
                $table->dropForeign(['validated_by_accueil_id']);
                $table->dropForeign(['created_by_id']);
            });

            Schema::rename('class_transfer_requests', 'demandes_transfert_classe');

            Schema::table('demandes_transfert_classe', function (Blueprint $table) {
                $table->renameColumn('family_id', 'famille_id');
                $table->renameColumn('user_id', 'membre_id');
                $table->renameColumn('source_class_id', 'classe_source_id');
                $table->renameColumn('target_class_id', 'classe_cible_id');
                $table->renameColumn('reason', 'motif');
                $table->renameColumn('status', 'statut');
                $table->renameColumn('destination_city', 'ville_destination');
                $table->renameColumn('destination_country', 'pays_destination');
                $table->renameColumn('destination_note', 'note_destination');
                $table->renameColumn('validated_by_source_at', 'date_validation_source');
                $table->renameColumn('validated_by_source_id', 'validateur_source_id');
                $table->renameColumn('validated_by_accueil_at', 'date_validation_accueil');
                $table->renameColumn('validated_by_accueil_id', 'validateur_accueil_id');
                $table->renameColumn('refusal_reason', 'motif_refus');
                $table->renameColumn('created_by_id', 'createur_id');
            });

            Schema::table('demandes_transfert_classe', function (Blueprint $table) {
                $table->foreign('famille_id')->references('id')->on('families')->onDelete('cascade');
                $table->foreign('membre_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('classe_source_id')->references('id')->on('classes')->onDelete('restrict');
                $table->foreign('classe_cible_id')->references('id')->on('classes')->onDelete('restrict');
                $table->foreign('validateur_source_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('validateur_accueil_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('createur_id')->references('id')->on('users')->onDelete('restrict');
            });

            return;
        }

        Schema::create('demandes_transfert_classe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('famille_id')->constrained('families')->onDelete('cascade');
            $table->foreignId('membre_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('classe_source_id')->constrained('classes')->onDelete('restrict');
            $table->foreignId('classe_cible_id')->nullable()->constrained('classes')->onDelete('restrict');
            $table->string('ville_destination')->nullable();
            $table->string('pays_destination')->nullable();
            $table->string('note_destination')->nullable();
            $table->enum('type', ['member', 'family', 'external'])->default('member');
            $table->text('motif')->nullable();
            $table->enum('statut', [
                'SOUMISE',
                'EN_ATTENTE_SOURCE',
                'VALIDEE_SOURCE',
                'EN_ATTENTE_ACCUEIL',
                'VALIDEE_ACCUEIL',
                'TERMINEE',
                'REFUSEE',
            ])->default('SOUMISE');
            $table->string('reference')->unique();
            $table->timestamp('date_validation_source')->nullable();
            $table->foreignId('validateur_source_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('date_validation_accueil')->nullable();
            $table->foreignId('validateur_accueil_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('motif_refus')->nullable();
            $table->foreignId('createur_id')->constrained('users')->onDelete('restrict');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('demandes_transfert_classe') || Schema::hasTable('class_transfer_requests')) {
            return;
        }

        Schema::table('demandes_transfert_classe', function (Blueprint $table) {
            $table->dropForeign(['famille_id']);
            $table->dropForeign(['membre_id']);
            $table->dropForeign(['classe_source_id']);
            $table->dropForeign(['classe_cible_id']);
            $table->dropForeign(['validateur_source_id']);
            $table->dropForeign(['validateur_accueil_id']);
            $table->dropForeign(['createur_id']);
        });

        Schema::table('demandes_transfert_classe', function (Blueprint $table) {
            $table->renameColumn('famille_id', 'family_id');
            $table->renameColumn('membre_id', 'user_id');
            $table->renameColumn('classe_source_id', 'source_class_id');
            $table->renameColumn('classe_cible_id', 'target_class_id');
            $table->renameColumn('motif', 'reason');
            $table->renameColumn('statut', 'status');
            $table->renameColumn('ville_destination', 'destination_city');
            $table->renameColumn('pays_destination', 'destination_country');
            $table->renameColumn('note_destination', 'destination_note');
            $table->renameColumn('date_validation_source', 'validated_by_source_at');
            $table->renameColumn('validateur_source_id', 'validated_by_source_id');
            $table->renameColumn('date_validation_accueil', 'validated_by_accueil_at');
            $table->renameColumn('validateur_accueil_id', 'validated_by_accueil_id');
            $table->renameColumn('motif_refus', 'refusal_reason');
            $table->renameColumn('createur_id', 'created_by_id');
        });

        Schema::rename('demandes_transfert_classe', 'class_transfer_requests');

        Schema::table('class_transfer_requests', function (Blueprint $table) {
            $table->foreign('family_id')->references('id')->on('families')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('source_class_id')->references('id')->on('classes')->onDelete('restrict');
            $table->foreign('target_class_id')->references('id')->on('classes')->onDelete('restrict');
            $table->foreign('validated_by_source_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('validated_by_accueil_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by_id')->references('id')->on('users')->onDelete('restrict');
        });
    }
};
