<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_sacrements', function (Blueprint $table) {
            // Ajouter les colonnes de suivi des modifications
            if (!Schema::hasColumn('user_sacrements', 'is_modified')) {
                $table->boolean('is_modified')->default(false)->after('mariage_religieux_lieu');
            }
            if (!Schema::hasColumn('user_sacrements', 'last_modified_at')) {
                $table->timestamp('last_modified_at')->nullable()->after('is_modified');
            }
            if (!Schema::hasColumn('user_sacrements', 'last_modified_by')) {
                $table->unsignedBigInteger('last_modified_by')->nullable()->after('last_modified_at');
            }
            if (!Schema::hasColumn('user_sacrements', 'is_deleted')) {
                $table->boolean('is_deleted')->default(false)->after('last_modified_by');
            }
            if (!Schema::hasColumn('user_sacrements', 'deleted_by')) {
                $table->unsignedBigInteger('deleted_by')->nullable()->after('is_deleted');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_sacrements', function (Blueprint $table) {
            $columns = ['is_modified', 'last_modified_at', 'last_modified_by', 'is_deleted', 'deleted_by'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('user_sacrements', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
