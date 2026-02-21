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
        Schema::table('families', function (Blueprint $table) {
            // Ajouter les colonnes de suivi si elles n'existent pas
            if (!Schema::hasColumn('families', 'is_modified')) {
                $table->boolean('is_modified')->default(false)->after('telephone2');
            }
            if (!Schema::hasColumn('families', 'last_modified_at')) {
                $table->timestamp('last_modified_at')->nullable()->after('is_modified');
            }
            if (!Schema::hasColumn('families', 'last_modified_by')) {
                $table->unsignedBigInteger('last_modified_by')->nullable()->after('last_modified_at');
            }
            if (!Schema::hasColumn('families', 'is_deleted')) {
                $table->boolean('is_deleted')->default(false)->after('last_modified_by');
            }
            if (!Schema::hasColumn('families', 'deleted_by')) {
                $table->unsignedBigInteger('deleted_by')->nullable()->after('is_deleted');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $columns = ['is_modified', 'last_modified_at', 'last_modified_by', 'is_deleted', 'deleted_by'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('families', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
