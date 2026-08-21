<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tribu_transfert_demandes', function (Blueprint $table) {
            $table->foreignId('demandeur_id')->nullable()->after('membre_id')->constrained('users')->nullOnDelete();
        });

        // Les demandes existantes ont été soumises par le membre lui-même
        // (aucune demande "au nom d'un membre" n'existait avant cette
        // fonctionnalité).
        DB::table('tribu_transfert_demandes')->whereNull('demandeur_id')->update([
            'demandeur_id' => DB::raw('membre_id'),
        ]);
    }

    public function down(): void
    {
        Schema::table('tribu_transfert_demandes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('demandeur_id');
        });
    }
};
