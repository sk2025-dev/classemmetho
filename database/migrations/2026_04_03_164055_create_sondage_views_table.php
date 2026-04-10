<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('sondage_views')) {
            Schema::create('sondage_views', function (Blueprint $table) {
                $table->id();
                $table->foreignId('sondage_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('ip_address')->nullable();
                $table->timestamp('viewed_at');
                $table->timestamps();
                $table->unique(['sondage_id', 'user_id']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('sondage_views');
    }
};