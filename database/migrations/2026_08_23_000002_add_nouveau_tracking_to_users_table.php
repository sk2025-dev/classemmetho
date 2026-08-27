<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_nouveau')->default(false)->after('status');
            $table->date('nouveau_depuis')->nullable()->after('is_nouveau');
            $table->timestamp('nouveau_integre_le')->nullable()->after('nouveau_depuis');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_nouveau', 'nouveau_depuis', 'nouveau_integre_le']);
        });
    }
};
