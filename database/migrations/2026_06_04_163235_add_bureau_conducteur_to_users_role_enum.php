<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY role ENUM('admin','pasteur','bureau_conducteur','conducteur','responsable_famille','membre_famille') NOT NULL DEFAULT 'membre_famille'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY role ENUM('admin','pasteur','conducteur','responsable_famille','membre_famille') NOT NULL DEFAULT 'membre_famille'");
    }
};
