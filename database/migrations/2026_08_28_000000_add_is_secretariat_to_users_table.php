<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_secretariat')->default(false)->after('role');
        });

        // Le secrétariat n'est plus un rôle exclusif mais une désignation en plus
        // du rôle habituel (membre_famille/responsable_famille), au même titre que
        // "Responsable FIMECO" ou "Président des conducteurs". On convertit les
        // comptes déjà basculés sur l'ancien rôle "secretariat" : ils redeviennent
        // membre_famille (rôle de base par défaut) tout en gardant l'accès
        // secrétariat via le nouveau booléen.
        DB::table('users')
            ->where('role', 'secretariat')
            ->update(['role' => 'membre_famille', 'is_secretariat' => true]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_secretariat');
        });
    }
};
