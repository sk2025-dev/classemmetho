<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute les colonnes de tracking d'audit à la table fonctions
     */
    public function up(): void
    {
        if (Schema::hasTable('fonctions')) {
            Schema::table('fonctions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('fonctions');

                if (!in_array('is_modified', $columns)) {
                    $table->boolean('is_modified')->default(false)->after('description');
                }

                if (!in_array('last_modified_at', $columns)) {
                    $table->timestamp('last_modified_at')->nullable()->after('is_modified');
                }

                if (!in_array('last_modified_by', $columns)) {
                    $table->unsignedBigInteger('last_modified_by')->nullable()->after('last_modified_at');
                    $table->foreign('last_modified_by')->references('id')->on('users')->onDelete('set null');
                }

                if (!in_array('is_deleted', $columns)) {
                    $table->boolean('is_deleted')->default(false)->after('last_modified_by');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('fonctions')) {
            Schema::table('fonctions', function (Blueprint $table) {
                if (Schema::hasColumn('fonctions', 'last_modified_by')) {
                    $table->dropForeign(['last_modified_by']);
                    $table->dropColumn('last_modified_by');
                }
                if (Schema::hasColumn('fonctions', 'last_modified_at')) {
                    $table->dropColumn('last_modified_at');
                }
                if (Schema::hasColumn('fonctions', 'is_modified')) {
                    $table->dropColumn('is_modified');
                }
                if (Schema::hasColumn('fonctions', 'is_deleted')) {
                    $table->dropColumn('is_deleted');
                }
            });
        }
    }
};
