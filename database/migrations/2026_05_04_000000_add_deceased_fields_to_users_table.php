<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_deceased')->default(false)->after('status');
            $table->date('deceased_at')->nullable()->after('is_deceased');
            $table->foreignId('acte_deces_id')
                ->nullable()
                ->after('deceased_at')
                ->constrained('actes_liturgiques')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['acte_deces_id']);
            $table->dropColumn(['is_deceased', 'deceased_at', 'acte_deces_id']);
        });
    }
};
