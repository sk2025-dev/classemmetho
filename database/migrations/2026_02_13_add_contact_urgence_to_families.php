<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('families', function (Blueprint $table) {
            // Ajouter les colonnes de contact d'urgence si elles n'existent pas
            if (!Schema::hasColumn('families', 'contact_urgence')) {
                $table->string('contact_urgence')->nullable()->after('email');
            }
            if (!Schema::hasColumn('families', 'contact_urgence_tel')) {
                $table->string('contact_urgence_tel')->nullable()->after('contact_urgence');
            }
        });
    }

    public function down(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $table->dropColumn(['contact_urgence', 'contact_urgence_tel']);
        });
    }
};
