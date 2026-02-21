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
        // 1. Autoriser temporairement toutes les valeurs (français + anglais)
        Schema::table('inscriptions', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected', 'en_attente', 'approuve', 'rejete'])->default('pending')->change();
        });

        // 2. Convertir les valeurs anglaises en français
        DB::table('inscriptions')->where('status', 'pending')->update(['status' => 'en_attente']);
        DB::table('inscriptions')->where('status', 'approved')->update(['status' => 'approuve']);
        DB::table('inscriptions')->where('status', 'rejected')->update(['status' => 'rejete']);

        // 3. Restreindre l'énum aux valeurs françaises uniquement
        Schema::table('inscriptions', function (Blueprint $table) {
            $table->enum('status', ['en_attente', 'approuve', 'rejete'])->default('en_attente')->change();
        });
    }

    public function down(): void
    {
        // 1. Autoriser temporairement toutes les valeurs (français + anglais)
        Schema::table('inscriptions', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected', 'en_attente', 'approuve', 'rejete'])->default('pending')->change();
        });

        // 2. Convertir les valeurs françaises en anglais
        DB::table('inscriptions')->where('status', 'en_attente')->update(['status' => 'pending']);
        DB::table('inscriptions')->where('status', 'approuve')->update(['status' => 'approved']);
        DB::table('inscriptions')->where('status', 'rejete')->update(['status' => 'rejected']);

        // 3. Restreindre l'énum aux valeurs anglaises uniquement
        Schema::table('inscriptions', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->change();
        });
    }
};
