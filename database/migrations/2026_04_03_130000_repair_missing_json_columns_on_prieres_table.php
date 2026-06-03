<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('prieres')) {
            return;
        }

        if (!Schema::hasColumn('prieres', 'commentaires_data')) {
            Schema::table('prieres', function (Blueprint $table) {
                $table->json('commentaires_data')->nullable()->after('temoignage');
            });
        }

        if (!Schema::hasColumn('prieres', 'destinataires_data')) {
            Schema::table('prieres', function (Blueprint $table) {
                $table->json('destinataires_data')->nullable()->after('commentaires_data');
            });
        }

        if (!Schema::hasColumn('prieres', 'historiques_data')) {
            Schema::table('prieres', function (Blueprint $table) {
                $table->json('historiques_data')->nullable()->after('destinataires_data');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('prieres')) {
            return;
        }

        if (Schema::hasColumn('prieres', 'historiques_data')) {
            Schema::table('prieres', function (Blueprint $table) {
                $table->dropColumn('historiques_data');
            });
        }

        if (Schema::hasColumn('prieres', 'destinataires_data')) {
            Schema::table('prieres', function (Blueprint $table) {
                $table->dropColumn('destinataires_data');
            });
        }

        if (Schema::hasColumn('prieres', 'commentaires_data')) {
            Schema::table('prieres', function (Blueprint $table) {
                $table->dropColumn('commentaires_data');
            });
        }
    }
};
