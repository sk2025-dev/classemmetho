<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presences', function (Blueprint $table) {
            // Keep legacy permanent activity support while enabling Programmes events.
            $table->foreignId('special_event_id')
                ->nullable()
                ->after('activite_id')
                ->constrained('special_events')
                ->nullOnDelete();

            $table->unique(['special_event_id', 'membre_famille_id'], 'presences_special_event_member_unique');
        });

        Schema::table('presences', function (Blueprint $table) {
            $table->foreignId('activite_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('presences', function (Blueprint $table) {
            if (Schema::hasColumn('presences', 'special_event_id')) {
                // Supprimer la FK avant l'index unique (MySQL exige cet ordre)
                $fks = collect(\DB::select("
                    SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'presences'
                      AND COLUMN_NAME = 'special_event_id'
                      AND REFERENCED_TABLE_NAME IS NOT NULL
                "))->pluck('CONSTRAINT_NAME');

                foreach ($fks as $fk) {
                    \DB::statement("ALTER TABLE presences DROP FOREIGN KEY `{$fk}`");
                }

                if (\DB::select("
                    SELECT INDEX_NAME FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'presences'
                      AND INDEX_NAME = 'presences_special_event_member_unique'
                    LIMIT 1
                ")) {
                    $table->dropUnique('presences_special_event_member_unique');
                }

                $table->dropColumn('special_event_id');
            }
        });
    }
};
