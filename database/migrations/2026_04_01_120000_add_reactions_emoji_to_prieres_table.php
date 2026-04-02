<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('prieres')) {
            return;
        }

        Schema::table('prieres', function (Blueprint $table) {
            if (!Schema::hasColumn('prieres', 'reactions_emoji')) {
                $table->json('reactions_emoji')->nullable()->after('temoignage');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('prieres')) {
            return;
        }

        Schema::table('prieres', function (Blueprint $table) {
            if (Schema::hasColumn('prieres', 'reactions_emoji')) {
                $table->dropColumn('reactions_emoji');
            }
        });
    }
};
