<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_transfer_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('class_transfer_requests', 'destination_city')) {
                $table->string('destination_city')->nullable()->after('target_class_id');
            }
            if (!Schema::hasColumn('class_transfer_requests', 'destination_country')) {
                $table->string('destination_country')->nullable()->after('destination_city');
            }
            if (!Schema::hasColumn('class_transfer_requests', 'destination_note')) {
                $table->string('destination_note')->nullable()->after('destination_country');
            }
        });
    }

    public function down(): void
    {
        Schema::table('class_transfer_requests', function (Blueprint $table) {
            $table->dropColumn(['destination_city', 'destination_country', 'destination_note']);
        });
    }
};
