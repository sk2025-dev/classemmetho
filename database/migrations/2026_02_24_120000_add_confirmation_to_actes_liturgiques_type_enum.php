<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE actes_liturgiques
            MODIFY COLUMN type_acte ENUM(
                'bapteme',
                'premiere_communion',
                'confirmation',
                'mariage',
                'naissance',
                'deces'
            ) NOT NULL
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE actes_liturgiques
            MODIFY COLUMN type_acte ENUM(
                'bapteme',
                'premiere_communion',
                'mariage',
                'naissance',
                'deces'
            ) NOT NULL
        ");
    }
};
