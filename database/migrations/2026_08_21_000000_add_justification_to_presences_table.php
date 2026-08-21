<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presences', function (Blueprint $table) {
            $table->boolean('justifiee')->default(false)->after('statut');
            $table->string('motif_justification')->nullable()->after('justifiee');
            $table->string('motif_justification_detail', 500)->nullable()->after('motif_justification');
            $table->foreignId('justifiee_par')->nullable()->after('motif_justification_detail')->constrained('users')->nullOnDelete();
            $table->timestamp('justifiee_le')->nullable()->after('justifiee_par');
        });
    }

    public function down(): void
    {
        Schema::table('presences', function (Blueprint $table) {
            $table->dropConstrainedForeignId('justifiee_par');
            $table->dropColumn(['justifiee', 'motif_justification', 'motif_justification_detail', 'justifiee_le']);
        });
    }
};
