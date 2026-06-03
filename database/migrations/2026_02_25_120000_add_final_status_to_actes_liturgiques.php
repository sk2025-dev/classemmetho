<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('actes_liturgiques')) {
            return;
        }

        $driver = DB::getDriverName();
        if ($driver !== 'mysql') {
            return;
        }

        DB::statement(
            "ALTER TABLE actes_liturgiques MODIFY COLUMN statut ENUM(
                'SOUMISE',
                'EN_ATTENTE_CONDUCTEUR',
                'TRANSMISE_AU_PASTEUR',
                'VALIDEE',
                'CELEBRE',
                'TERMINE',
                'REFUSEE_PAR_CONDUCTEUR',
                'REFUSEE_PAR_PASTEUR',
                'ARCHIVEE'
            ) DEFAULT 'SOUMISE'"
        );
    }

    public function down(): void
    {
        // No down to avoid data loss.
    }
};
