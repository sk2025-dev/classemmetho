<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('special_events', function (Blueprint $table) {
            // Ajouter les nouvelles colonnes
            $table->date('start_date')->nullable()->after('title');
            $table->date('end_date')->nullable()->after('start_date');
            $table->time('start_time')->nullable()->after('end_date');
            $table->time('end_time')->nullable()->after('start_time');
        });

        // Migrer les données existantes
        if (Schema::hasColumn('special_events', 'date')) {
            DB::table('special_events')->whereNotNull('date')->update([
                'start_date' => DB::raw('date'),
                'start_time' => DB::raw('time'),
            ]);
        }

        // Supprimer les anciennes colonnes
        Schema::table('special_events', function (Blueprint $table) {
            if (Schema::hasColumn('special_events', 'date')) {
                $table->dropColumn('date');
            }
            if (Schema::hasColumn('special_events', 'time')) {
                $table->dropColumn('time');
            }
        });
    }

    public function down()
    {
        Schema::table('special_events', function (Blueprint $table) {
            $table->date('date')->nullable()->after('title');
            $table->time('time')->nullable()->after('date');
        });

        // Restaurer les données
        DB::table('special_events')->whereNotNull('start_date')->update([
            'date' => DB::raw('start_date'),
            'time' => DB::raw('start_time'),
        ]);

        Schema::table('special_events', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'end_date', 'start_time', 'end_time']);
        });
    }
};