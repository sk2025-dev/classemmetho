<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beauty_services', function (Blueprint $table) {
            $table->id();
            $table->string('section_key')->index();
            $table->string('category_key')->index();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->string('duration')->nullable();
            $table->string('price')->nullable();
            $table->string('image_path')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beauty_services');
    }
};
