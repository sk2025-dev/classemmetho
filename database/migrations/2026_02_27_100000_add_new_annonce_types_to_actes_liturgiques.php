<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get the current enum values
        $tableName = 'actes_liturgiques';
        $columnName = 'type_acte';

        // Get current column type info
        $columnType = DB::select("SHOW COLUMNS FROM {$tableName} WHERE Field = ?", [$columnName]);

        if (!empty($columnType) && strpos($columnType[0]->Type, 'enum') !== false) {
            // Extract current enum values
            preg_match('/enum\((.*)\)/', $columnType[0]->Type, $matches);
            $currentValues = array_map(function ($v) {
                return trim($v, "'");
            }, explode(',', $matches[1]));

            // New values to add
            $newValues = ['annonce', 'annonce_liturgique', 'priere', 'grace', 'felicitations', 'generale'];

            // Merge and remove duplicates
            $allValues = array_unique(array_merge($currentValues, $newValues));

            // Build new enum definition
            $enumString = "'" . implode("','", $allValues) . "'";
            $newType = "enum({$enumString})";

            // Modify the column
            DB::statement("ALTER TABLE {$tableName} MODIFY COLUMN {$columnName} {$newType}");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tableName = 'actes_liturgiques';
        $columnName = 'type_acte';

        $originalValues = ['bapteme', 'premiere_communion', 'mariage', 'naissance', 'deces'];
        $enumString = "'" . implode("','", $originalValues) . "'";
        $originalType = "enum({$enumString})";

        DB::table($tableName)
            ->whereNotIn($columnName, $originalValues)
            ->delete();

        DB::statement("ALTER TABLE {$tableName} MODIFY COLUMN {$columnName} {$originalType}");
    }
};
