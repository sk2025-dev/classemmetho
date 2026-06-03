<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('special_events', function (Blueprint $table) {
            $table->dropColumn('dirigeant_priere');
        });
    }

    public function down()
    {
        Schema::table('special_events', function (Blueprint $table) {
            $table->string('dirigeant_priere')->nullable()->after('moderateur');
        });
    }
};