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
        Schema::table('dons', function (Blueprint $table) {
            $table->string('nom_donateur', 120)->nullable()->after('note');
            $table->string('numero_donateur', 10)->nullable()->after('nom_donateur');
        });
    }

    public function down(): void
    {
        Schema::table('dons', function (Blueprint $table) {
            $table->dropColumn(['nom_donateur', 'numero_donateur']);
        });
    }
};
