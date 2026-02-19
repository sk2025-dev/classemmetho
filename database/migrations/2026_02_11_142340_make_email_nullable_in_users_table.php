<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Rendre email nullable
            if (Schema::hasColumn('users', 'email')) {
                DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NULL');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Revenir à email NOT NULL
            if (Schema::hasColumn('users', 'email')) {
                DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NOT NULL');
            }
        });
    }
};
