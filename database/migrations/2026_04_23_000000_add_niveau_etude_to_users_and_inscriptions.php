<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'niveau_etude')) {
                $table->string('niveau_etude')->nullable()->after('profession_detail')
                    ->comment('Niveau d\'étude (affiché si statut = ETUDIANT)');
            }
        });

        Schema::table('inscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('inscriptions', 'niveau_etude')) {
                $table->string('niveau_etude')->nullable()
                    ->comment('Niveau d\'étude du responsable ou membre (ETUDIANT)');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'niveau_etude')) {
                $table->dropColumn('niveau_etude');
            }
        });

        Schema::table('inscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('inscriptions', 'niveau_etude')) {
                $table->dropColumn('niveau_etude');
            }
        });
    }
};
