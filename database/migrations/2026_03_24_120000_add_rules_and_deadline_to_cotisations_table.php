<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cotisations', function (Blueprint $table) {
            if (!Schema::hasColumn('cotisations', 'target_rules')) {
                $table->json('target_rules')->nullable()->after('target_genders');
            }

            if (!Schema::hasColumn('cotisations', 'date_echeance')) {
                $table->date('date_echeance')->nullable()->after('date_fin');
            }

            if (!Schema::hasColumn('cotisations', 'late_after_days')) {
                $table->unsignedTinyInteger('late_after_days')->default(2)->after('date_echeance');
            }
        });

        // Add weekly periodicity while keeping existing enum values.
        DB::statement("ALTER TABLE cotisations MODIFY periodicite ENUM('HEBDOMADAIRE','MENSUEL','TRIMESTRIEL','ANNUEL','UNIQUE') NOT NULL DEFAULT 'MENSUEL'");
    }

    public function down(): void
    {
        Schema::table('cotisations', function (Blueprint $table) {
            if (Schema::hasColumn('cotisations', 'target_rules')) {
                $table->dropColumn('target_rules');
            }

            if (Schema::hasColumn('cotisations', 'date_echeance')) {
                $table->dropColumn('date_echeance');
            }

            if (Schema::hasColumn('cotisations', 'late_after_days')) {
                $table->dropColumn('late_after_days');
            }
        });

        DB::statement("ALTER TABLE cotisations MODIFY periodicite ENUM('MENSUEL','TRIMESTRIEL','ANNUEL','UNIQUE') NOT NULL DEFAULT 'MENSUEL'");
    }
};
