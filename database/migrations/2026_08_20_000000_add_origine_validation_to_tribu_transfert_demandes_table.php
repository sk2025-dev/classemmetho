<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tribu_transfert_demandes', function (Blueprint $table) {
            $table->foreignId('origine_valide_par')->nullable()->after('tribu_destination_id')->constrained('users')->nullOnDelete();
            $table->timestamp('origine_valide_le')->nullable()->after('origine_valide_par');
        });
    }

    public function down(): void
    {
        Schema::table('tribu_transfert_demandes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('origine_valide_par');
            $table->dropColumn('origine_valide_le');
        });
    }
};
