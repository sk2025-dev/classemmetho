<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            // Ajouter les colonnes de soft delete si elles n'existent pas
            if (!Schema::hasColumn('classes', 'deleted_at')) {
                $table->softDeletes();
            }
            if (!Schema::hasColumn('classes', 'deleted_by')) {
                $table->unsignedBigInteger('deleted_by')->nullable()->after('deleted_at');
            }
            if (!Schema::hasColumn('classes', 'is_deleted')) {
                $table->boolean('is_deleted')->default(false)->after('deleted_by');
            }
            if (!Schema::hasColumn('classes', 'is_modified')) {
                $table->boolean('is_modified')->default(false);
            }
            if (!Schema::hasColumn('classes', 'last_modified_at')) {
                $table->timestamp('last_modified_at')->nullable();
            }
            if (!Schema::hasColumn('classes', 'last_modified_by')) {
                $table->unsignedBigInteger('last_modified_by')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            if (Schema::hasColumn('classes', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
            if (Schema::hasColumn('classes', 'deleted_by')) {
                $table->dropColumn('deleted_by');
            }
            if (Schema::hasColumn('classes', 'is_deleted')) {
                $table->dropColumn('is_deleted');
            }
            if (Schema::hasColumn('classes', 'is_modified')) {
                $table->dropColumn('is_modified');
            }
            if (Schema::hasColumn('classes', 'last_modified_at')) {
                $table->dropColumn('last_modified_at');
            }
            if (Schema::hasColumn('classes', 'last_modified_by')) {
                $table->dropColumn('last_modified_by');
            }
        });
    }
};
