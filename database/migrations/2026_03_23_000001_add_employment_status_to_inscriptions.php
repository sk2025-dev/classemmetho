<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inscriptions', function (Blueprint $table) {
            // Ajouter employment_status à côté de responsable_profession
            if (!Schema::hasColumn('inscriptions', 'responsable_employment_status')) {
                $table->enum('responsable_employment_status', [
                    'TRAVAILLEUR',
                    'RETRAITE',
                    'ETUDIANT',
                    'SANS_EMPLOI',
                ])->nullable()->after('responsable_profession');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('inscriptions', 'responsable_employment_status')) {
                $table->dropColumn('responsable_employment_status');
            }
        });
    }
};
