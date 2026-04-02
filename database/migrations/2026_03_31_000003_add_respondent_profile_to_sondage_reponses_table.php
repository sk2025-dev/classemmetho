<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sondage_reponses', function (Blueprint $table) {
            if (!Schema::hasColumn('sondage_reponses', 'respondent_profile')) {
                $table->json('respondent_profile')->nullable()->after('respondent_key');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sondage_reponses', function (Blueprint $table) {
            if (Schema::hasColumn('sondage_reponses', 'respondent_profile')) {
                $table->dropColumn('respondent_profile');
            }
        });
    }
};
