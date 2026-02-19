<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute le soft delete à la table fonctions
     */
    public function up(): void
    {
        if (Schema::hasTable('fonctions')) {
            Schema::table('fonctions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('fonctions');

                if (!in_array('deleted_at', $columns)) {
                    $table->softDeletes();
                }

                if (!in_array('deleted_by', $columns)) {
                    $table->unsignedBigInteger('deleted_by')->nullable();
                    $table->foreign('deleted_by')->references('id')->on('users')->onDelete('set null');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('fonctions')) {
            Schema::table('fonctions', function (Blueprint $table) {
                if (Schema::hasColumn('fonctions', 'deleted_by')) {
                    $table->dropForeign(['deleted_by']);
                    $table->dropColumn('deleted_by');
                }
                if (Schema::hasColumn('fonctions', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }
    }
};
