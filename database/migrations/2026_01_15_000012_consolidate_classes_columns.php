<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Consolide les colonnes de classes
     */
    public function up(): void
    {
        if (Schema::hasTable('classes')) {
            Schema::table('classes', function (Blueprint $table) {
                $columns = Schema::getColumnListing('classes');

                if (!in_array('status', $columns)) {
                    $table->enum('status', ['active', 'inactive', 'archived'])->default('active')->nullable();
                }

                if (!in_array('capacity', $columns)) {
                    $table->integer('capacity')->nullable();
                }

                if (!in_array('conducteur', $columns)) {
                    $table->string('conducteur')->nullable();
                }

                if (!in_array('nombre_membres', $columns)) {
                    $table->integer('nombre_membres')->default(0);
                }
            });
        }
    }

    public function down(): void
    {
        // Ne pas supprimer
    }
};
