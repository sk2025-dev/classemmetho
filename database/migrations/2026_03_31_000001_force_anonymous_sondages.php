<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('sondages')->update(['anonymat' => true]);

        Schema::table('sondages', function (Blueprint $table) {
            $table->boolean('anonymat')->default(true)->change();
        });
    }

    public function down(): void
    {
        Schema::table('sondages', function (Blueprint $table) {
            $table->boolean('anonymat')->default(false)->change();
        });
    }
};
