<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE dons MODIFY mode_paiement ENUM('MOBILE_MONEY','ESPECES','VIREMENT','WAVE','ORANGE','DJAMO','CARTE') NOT NULL DEFAULT 'MOBILE_MONEY'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE dons MODIFY mode_paiement ENUM('MOBILE_MONEY','ESPECES','VIREMENT','WAVE','ORANGE','DJAMO') NOT NULL DEFAULT 'MOBILE_MONEY'");
    }
};
