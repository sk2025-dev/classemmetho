<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Consolide toutes les colonnes d'inscriptions
     */
    public function up(): void
    {
        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');

                // === Photo et documents ===
                if (!in_array('profile_photo', $columns)) {
                    $table->string('profile_photo')->nullable();
                }

                if (!in_array('profile_photo_url', $columns)) {
                    $table->string('profile_photo_url')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        // Ne pas supprimer
    }
};
