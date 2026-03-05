<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = 'actes_liturgiques';
        $columnName = 'type_acte';

        $columnType = DB::select("SHOW COLUMNS FROM {$tableName} WHERE Field = ?", [$columnName]);

        if (empty($columnType) || strpos($columnType[0]->Type, 'enum') === false) {
            return;
        }

        preg_match('/enum\((.*)\)/', $columnType[0]->Type, $matches);
        if (empty($matches[1])) {
            return;
        }

        $currentValues = array_map(function ($value) {
            return trim($value, "'");
        }, explode(',', $matches[1]));

        $allValues = array_unique(array_merge($currentValues, ['bapteme_premiere_communion']));
        $enumString = "'" . implode("','", $allValues) . "'";

        DB::statement("ALTER TABLE {$tableName} MODIFY COLUMN {$columnName} ENUM({$enumString}) NOT NULL");
    }

    public function down(): void
    {
        $tableName = 'actes_liturgiques';
        $columnName = 'type_acte';

        $columnType = DB::select("SHOW COLUMNS FROM {$tableName} WHERE Field = ?", [$columnName]);

        if (empty($columnType) || strpos($columnType[0]->Type, 'enum') === false) {
            return;
        }

        preg_match('/enum\((.*)\)/', $columnType[0]->Type, $matches);
        if (empty($matches[1])) {
            return;
        }

        $currentValues = array_map(function ($value) {
            return trim($value, "'");
        }, explode(',', $matches[1]));

        $revertedValues = array_values(array_filter(
            $currentValues,
            fn ($value) => $value !== 'bapteme_premiere_communion'
        ));

        $enumString = "'" . implode("','", $revertedValues) . "'";

        DB::statement("ALTER TABLE {$tableName} MODIFY COLUMN {$columnName} ENUM({$enumString}) NOT NULL");
    }
};
