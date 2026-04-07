<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Compatibilite pour les bases deja creees avant l'ajout
        // des colonnes JSON directement dans la table prieres.
        Schema::table('prieres', function (Blueprint $table) {
            if (!Schema::hasColumn('prieres', 'commentaires_data')) {
                $table->json('commentaires_data')->nullable()->after('temoignage');
            }

            if (!Schema::hasColumn('prieres', 'destinataires_data')) {
                $table->json('destinataires_data')->nullable()->after('commentaires_data');
            }

            if (!Schema::hasColumn('prieres', 'historiques_data')) {
                $table->json('historiques_data')->nullable()->after('destinataires_data');
            }
        });
    }

    public function down(): void
    {
        Schema::table('prieres', function (Blueprint $table) {
            if (Schema::hasColumn('prieres', 'commentaires_data')) {
                $table->dropColumn('commentaires_data');
            }

            if (Schema::hasColumn('prieres', 'historiques_data')) {
                $table->dropColumn('historiques_data');
            }

            if (Schema::hasColumn('prieres', 'destinataires_data')) {
                $table->dropColumn('destinataires_data');
            }
        });
    }
};
