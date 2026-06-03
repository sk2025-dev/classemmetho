<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Consolide les colonnes de fonctions
     */
    public function up(): void
    {
        if (Schema::hasTable('fonctions')) {
            Schema::table('fonctions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('fonctions');

                if (!in_array('niveau', $columns)) {
                    $table->integer('niveau')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        // Ne pas supprimer
    }
};
