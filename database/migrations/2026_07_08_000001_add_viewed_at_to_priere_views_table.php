<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('priere_views', function (Blueprint $table) {
            $table->timestamp('viewed_at')->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('priere_views', function (Blueprint $table) {
            $table->dropColumn('viewed_at');
        });
    }
};
