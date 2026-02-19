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
        Schema::table('users', function (Blueprint $table) {
            $columns = Schema::getColumnListing('users');

            // Ajouter les colonnes de suivi des modifications si elles n'existent pas
            if (!in_array('is_modified', $columns)) {
                $table->boolean('is_modified')->default(false)->after('updated_at');
            }

            if (!in_array('last_modified_at', $columns)) {
                $table->timestamp('last_modified_at')->nullable()->after('is_modified');
            }

            if (!in_array('last_modified_by', $columns)) {
                $table->unsignedBigInteger('last_modified_by')->nullable()->after('last_modified_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_modified')) {
                $table->dropColumn('is_modified');
            }
            if (Schema::hasColumn('users', 'last_modified_at')) {
                $table->dropColumn('last_modified_at');
            }
            if (Schema::hasColumn('users', 'last_modified_by')) {
                $table->dropColumn('last_modified_by');
            }
        });
    }
};
