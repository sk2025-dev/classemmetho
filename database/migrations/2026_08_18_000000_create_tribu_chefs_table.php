<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tribu_chefs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tribu_id')->constrained('tribus')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['tribu_id', 'user_id']);
        });

        // Reprendre le chef unique existant dans la nouvelle table pivot.
        DB::table('tribus')
            ->whereNotNull('chef_id')
            ->get(['id', 'chef_id'])
            ->each(function ($tribu) {
                DB::table('tribu_chefs')->insert([
                    'tribu_id' => $tribu->id,
                    'user_id' => $tribu->chef_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });

        Schema::table('tribus', function (Blueprint $table) {
            $table->dropConstrainedForeignId('chef_id');
        });
    }

    public function down(): void
    {
        Schema::table('tribus', function (Blueprint $table) {
            $table->foreignId('chef_id')->nullable()->constrained('users')->nullOnDelete();
        });

        DB::table('tribu_chefs')
            ->orderBy('id')
            ->get()
            ->groupBy('tribu_id')
            ->each(function ($chefs, $tribuId) {
                DB::table('tribus')
                    ->where('id', $tribuId)
                    ->update(['chef_id' => $chefs->first()->user_id]);
            });

        Schema::dropIfExists('tribu_chefs');
    }
};
