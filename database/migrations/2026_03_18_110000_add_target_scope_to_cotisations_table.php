<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cotisations', function (Blueprint $table) {
            if (!Schema::hasColumn('cotisations', 'target_scope')) {
                $table->enum('target_scope', ['FAMILLE', 'INDIVIDUELLE'])
                    ->default('FAMILLE')
                    ->after('statut');
            }

            if (!Schema::hasColumn('cotisations', 'created_by')) {
                $table->foreignId('created_by')
                    ->nullable()
                    ->after('classe_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('cotisations', function (Blueprint $table) {
            if (Schema::hasColumn('cotisations', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }

            if (Schema::hasColumn('cotisations', 'target_scope')) {
                $table->dropColumn('target_scope');
            }
        });
    }
};
