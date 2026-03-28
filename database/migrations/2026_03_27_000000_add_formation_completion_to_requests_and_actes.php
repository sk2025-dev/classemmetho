<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formation_requests', function (Blueprint $table) {
            $table->foreignId('formation_terminee_by')
                ->nullable()
                ->after('conducteur_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('formation_terminee_at')
                ->nullable()
                ->after('message');
        });

        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->foreignId('formation_request_id')
                ->nullable()
                ->after('pasteur_id')
                ->constrained('formation_requests')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->dropConstrainedForeignId('formation_request_id');
        });

        Schema::table('formation_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('formation_terminee_by');
            $table->dropColumn('formation_terminee_at');
        });
    }
};
