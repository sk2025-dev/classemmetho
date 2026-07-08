<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add bureau_conducteur_id column
        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->unsignedBigInteger('bureau_conducteur_id')->nullable()->after('pasteur_id');
            $table->foreign('bureau_conducteur_id')->references('id')->on('users')->nullOnDelete();
        });

        // Add new ENUM values to statut column
        DB::statement("ALTER TABLE actes_liturgiques MODIFY COLUMN statut ENUM(
            'SOUMISE',
            'EN_ATTENTE_CONDUCTEUR',
            'TRANSMISE_AU_BUREAU_CONDUCTEUR',
            'REFUSEE_PAR_BUREAU_CONDUCTEUR',
            'TRANSMISE_AU_PASTEUR',
            'VALIDEE',
            'REFUSEE_PAR_CONDUCTEUR',
            'REFUSEE_PAR_PASTEUR',
            'CELEBRE',
            'TERMINE',
            'PUBLIEE',
            'ARCHIVEE'
        ) NOT NULL DEFAULT 'SOUMISE'");
    }

    public function down(): void
    {
        // Revert ENUM (remove new values — only possible if no rows use them)
        DB::statement("ALTER TABLE actes_liturgiques MODIFY COLUMN statut ENUM(
            'SOUMISE',
            'EN_ATTENTE_CONDUCTEUR',
            'TRANSMISE_AU_PASTEUR',
            'VALIDEE',
            'REFUSEE_PAR_CONDUCTEUR',
            'REFUSEE_PAR_PASTEUR',
            'CELEBRE',
            'TERMINE',
            'PUBLIEE',
            'ARCHIVEE'
        ) NOT NULL DEFAULT 'SOUMISE'");

        Schema::table('actes_liturgiques', function (Blueprint $table) {
            $table->dropForeign(['bureau_conducteur_id']);
            $table->dropColumn('bureau_conducteur_id');
        });
    }
};
