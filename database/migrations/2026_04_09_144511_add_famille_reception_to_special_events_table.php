<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('special_events', function (Blueprint $table) {
            $table->string('famille_reception')->nullable()->after('moderateur');
        });
    }

    public function down()
    {
        Schema::table('special_events', function (Blueprint $table) {
            $table->dropColumn('famille_reception');
        });
    }
};