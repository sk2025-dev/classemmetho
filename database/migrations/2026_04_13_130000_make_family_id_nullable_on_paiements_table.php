<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('paiements') || !Schema::hasColumn('paiements', 'family_id')) {
            return;
        }

        $foreignKey = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', 'paiements')
            ->where('COLUMN_NAME', 'family_id')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->value('CONSTRAINT_NAME');

        if ($foreignKey) {
            DB::statement("ALTER TABLE paiements DROP FOREIGN KEY {$foreignKey}");
        }

        DB::statement('ALTER TABLE paiements MODIFY family_id BIGINT UNSIGNED NULL');

        Schema::table('paiements', function (Blueprint $table) {
            $table->foreign('family_id')->references('id')->on('families')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('paiements') || !Schema::hasColumn('paiements', 'family_id')) {
            return;
        }

        $foreignKey = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', 'paiements')
            ->where('COLUMN_NAME', 'family_id')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->value('CONSTRAINT_NAME');

        if ($foreignKey) {
            DB::statement("ALTER TABLE paiements DROP FOREIGN KEY {$foreignKey}");
        }

        // On garde la colonne nullable pour éviter les erreurs si des NULL existent déjà
        DB::statement('ALTER TABLE paiements MODIFY family_id BIGINT UNSIGNED NULL');

        Schema::table('paiements', function (Blueprint $table) {
            $table->foreign('family_id')->references('id')->on('families')->nullOnDelete();
        });
    }
};
