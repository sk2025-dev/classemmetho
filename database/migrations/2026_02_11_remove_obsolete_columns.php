<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('families')) {
            // D'abord supprimer les contraintes étrangères
            Schema::table('families', function (Blueprint $table) {
                try {
                    DB::statement('ALTER TABLE families DROP FOREIGN KEY families_merged_into_id_foreign');
                } catch (\Exception $e) {
                    // Constraint doesn't exist
                }
                try {
                    DB::statement('ALTER TABLE families DROP FOREIGN KEY families_inscription_id_foreign');
                } catch (\Exception $e) {
                    // Constraint doesn't exist
                }
            });

            // Puis supprimer les colonnes
            Schema::table('families', function (Blueprint $table) {
                $columns = Schema::getColumnListing('families');

                if (in_array('merged_into_id', $columns)) {
                    $table->dropColumn('merged_into_id');
                }

                if (in_array('email_hash', $columns)) {
                    $table->dropColumn('email_hash');
                }

                if (in_array('merged_at', $columns)) {
                    $table->dropColumn('merged_at');
                }

                if (in_array('inscription_id', $columns)) {
                    $table->dropColumn('inscription_id');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('families')) {
            Schema::table('families', function (Blueprint $table) {
                $table->unsignedBigInteger('merged_into_id')->nullable()->after('id');
                $table->string('email_hash')->nullable()->after('email');
                $table->timestamp('merged_at')->nullable();
                $table->unsignedBigInteger('inscription_id')->nullable();

                $table->foreign('merged_into_id')->references('id')->on('families')->nullOnDelete();
            });
        }
    }
};
