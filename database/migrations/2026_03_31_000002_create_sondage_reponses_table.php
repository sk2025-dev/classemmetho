<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sondage_reponses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sondage_id')->constrained('sondages')->cascadeOnDelete();
            $table->string('respondent_key');
            $table->json('reponses');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['sondage_id', 'respondent_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sondage_reponses');
    }
};
