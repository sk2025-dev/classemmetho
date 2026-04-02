<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sondages', function (Blueprint $table) {
            if (!Schema::hasColumn('sondages', 'public_token')) {
                $table->string('public_token')->nullable()->unique()->after('code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sondages', function (Blueprint $table) {
            if (Schema::hasColumn('sondages', 'public_token')) {
                $table->dropUnique(['public_token']);
                $table->dropColumn('public_token');
            }
        });
    }
};
