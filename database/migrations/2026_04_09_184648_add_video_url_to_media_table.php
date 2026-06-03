<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('media', function (Blueprint $table) {
            $table->string('video_url')->nullable()->after('url');
        });
    }

    public function down()
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropColumn('video_url');
        });
    }
};