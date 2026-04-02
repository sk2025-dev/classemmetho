<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ajoute le rôle tresorier à l'énumération des rôles utilisateurs
     */
    public function up(): void
    {
        // Pour MySQL, on doit recréer l'énumération
        if (Schema::hasTable('users')) {
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'pasteur', 'conducteur', 'responsable_famille', 'membre_famille', 'tresorier') DEFAULT 'membre_famille' NULL");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            // Remettre les anciens rôles
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'pasteur', 'conducteur', 'responsable_famille', 'membre_famille') DEFAULT 'membre_famille' NULL");
        }
    }
};
