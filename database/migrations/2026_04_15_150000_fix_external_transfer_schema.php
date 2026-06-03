<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('demandes_transfert_classe')) {
            return;
        }

        if (!Schema::hasColumn('demandes_transfert_classe', 'mode_transfert')) {
            Schema::table('demandes_transfert_classe', function (Blueprint $table) {
                $table->enum('mode_transfert', ['internal', 'external'])
                    ->default('internal')
                    ->after('type');
            });
        }

        if (!Schema::hasColumn('demandes_transfert_classe', 'eglise_destination')) {
            Schema::table('demandes_transfert_classe', function (Blueprint $table) {
                $table->string('eglise_destination')->nullable()->after('ville_destination');
            });
        }

        DB::table('demandes_transfert_classe')
            ->where('type', 'external')
            ->update(['mode_transfert' => 'external']);

        DB::statement(<<<'SQL'
            UPDATE demandes_transfert_classe
            SET type = CASE
                WHEN type = 'external' AND membre_id IS NOT NULL THEN 'member'
                WHEN type = 'external' AND membre_id IS NULL THEN 'family'
                ELSE type
            END
        SQL);

        DB::statement("ALTER TABLE demandes_transfert_classe MODIFY type ENUM('member','family') NOT NULL DEFAULT 'member'");
        DB::statement("ALTER TABLE demandes_transfert_classe MODIFY classe_cible_id BIGINT UNSIGNED NULL");

        $hasCountryColumn = Schema::hasColumn('demandes_transfert_classe', 'pays_destination');
        $hasNoteColumn = Schema::hasColumn('demandes_transfert_classe', 'note_destination');

        if ($hasCountryColumn || $hasNoteColumn) {
            $churchSource = $hasNoteColumn ? 'NULLIF(note_destination, \'\')' : 'NULL';
            $fallbackSource = $hasCountryColumn ? 'NULLIF(pays_destination, \'\')' : 'NULL';

            DB::statement(sprintf(
                "UPDATE demandes_transfert_classe SET eglise_destination = COALESCE(NULLIF(eglise_destination, ''), %s, %s)",
                $churchSource,
                $fallbackSource
            ));

            Schema::table('demandes_transfert_classe', function (Blueprint $table) use ($hasCountryColumn, $hasNoteColumn) {
                if ($hasCountryColumn) {
                    $table->dropColumn('pays_destination');
                }

                if ($hasNoteColumn) {
                    $table->dropColumn('note_destination');
                }
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('demandes_transfert_classe')) {
            return;
        }

        if (!Schema::hasColumn('demandes_transfert_classe', 'pays_destination')) {
            Schema::table('demandes_transfert_classe', function (Blueprint $table) {
                $table->string('pays_destination')->nullable()->after('eglise_destination');
            });
        }

        if (!Schema::hasColumn('demandes_transfert_classe', 'note_destination')) {
            Schema::table('demandes_transfert_classe', function (Blueprint $table) {
                $table->string('note_destination')->nullable()->after('pays_destination');
            });
        }

        if (Schema::hasColumn('demandes_transfert_classe', 'eglise_destination')) {
            DB::statement("UPDATE demandes_transfert_classe SET note_destination = COALESCE(NULLIF(note_destination, ''), NULLIF(eglise_destination, ''))");

            Schema::table('demandes_transfert_classe', function (Blueprint $table) {
                $table->dropColumn('eglise_destination');
            });
        }

        if (Schema::hasColumn('demandes_transfert_classe', 'mode_transfert')) {
            Schema::table('demandes_transfert_classe', function (Blueprint $table) {
                $table->dropColumn('mode_transfert');
            });
        }
    }
};
