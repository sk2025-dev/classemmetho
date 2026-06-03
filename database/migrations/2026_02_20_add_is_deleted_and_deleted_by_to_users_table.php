<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute les colonnes is_deleted et deleted_by à la table users
     * Ces colonnes sont utilisées par le trait TrackModifications pour le suivi des suppressions
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_deleted')) {
                $table->boolean('is_deleted')->default(false)->after('last_modified_by');
            }
            if (!Schema::hasColumn('users', 'deleted_by')) {
                $table->unsignedBigInteger('deleted_by')->nullable()->after('is_deleted');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_deleted')) {
                $table->dropColumn('is_deleted');
            }
            if (Schema::hasColumn('users', 'deleted_by')) {
                $table->dropColumn('deleted_by');
            }
        });
    }
};
