<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formation_requests', function (Blueprint $table) {
            $table->string('type_formation')->default('mariage')->after('statut');
            $table->json('details')->nullable()->after('message');
            $table->index(['membre_id', 'type_formation']);
        });
    }

    public function down(): void
    {
        Schema::table('formation_requests', function (Blueprint $table) {
            $table->dropIndex('formation_requests_membre_id_type_formation_index');
            $table->dropColumn(['type_formation', 'details']);
        });
    }
};
