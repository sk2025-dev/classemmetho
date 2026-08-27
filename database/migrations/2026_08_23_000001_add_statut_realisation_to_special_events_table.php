<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('special_events', function (Blueprint $table) {
            $table->string('statut_realisation', 20)->default('planifiee')->after('lieu');
        });
    }

    public function down(): void
    {
        Schema::table('special_events', function (Blueprint $table) {
            $table->dropColumn('statut_realisation');
        });
    }
};
