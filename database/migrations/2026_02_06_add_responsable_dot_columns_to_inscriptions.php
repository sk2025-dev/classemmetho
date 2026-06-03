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
            // Ajouter les colonnes manquantes pour la DOT du responsable
            if (!Schema::hasColumn('inscriptions', 'responsable_date_dot')) {
                $table->date('responsable_date_dot')->nullable()->after('responsable_lieu_mariage');
            }
            if (!Schema::hasColumn('inscriptions', 'responsable_lieu_dot')) {
                $table->string('responsable_lieu_dot')->nullable()->after('responsable_date_dot');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inscriptions', function (Blueprint $table) {
            $table->dropColumn(['responsable_date_dot', 'responsable_lieu_dot']);
        });
    }
};
