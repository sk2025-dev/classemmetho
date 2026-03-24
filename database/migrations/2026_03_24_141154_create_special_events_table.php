<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('special_events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->date('date');
            $table->time('time');
            $table->string('category');     // culte, social, reunion, sortie, CM1, CM2, 6eme, Aumônerie
            $table->text('description')->nullable();
            $table->boolean('is_parish');    // true = paroisse, false = classes
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('special_events');
    }
};