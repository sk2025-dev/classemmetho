<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presences', function (Blueprint $table) {
            // Keep legacy permanent activity support while enabling Programmes events.
            $table->foreignId('special_event_id')
                ->nullable()
                ->after('activite_id')
                ->constrained('special_events')
                ->nullOnDelete();

            $table->unique(['special_event_id', 'membre_famille_id'], 'presences_special_event_member_unique');
        });

        Schema::table('presences', function (Blueprint $table) {
            $table->foreignId('activite_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('presences', function (Blueprint $table) {
            $table->dropUnique('presences_special_event_member_unique');
            $table->dropConstrainedForeignId('special_event_id');
        });

        Schema::table('presences', function (Blueprint $table) {
            $table->foreignId('activite_id')->nullable(false)->change();
        });
    }
};
