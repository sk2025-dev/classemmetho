<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'transfer_status')) {
                $table->string('transfer_status', 32)->nullable()->after('status');
            }

            if (!Schema::hasColumn('users', 'transfer_label')) {
                $table->string('transfer_label')->nullable()->after('transfer_status');
            }

            if (!Schema::hasColumn('users', 'transfer_request_id')) {
                $table->unsignedBigInteger('transfer_request_id')->nullable()->after('transfer_label');
            }

            if (!Schema::hasColumn('users', 'transfer_locked_at')) {
                $table->timestamp('transfer_locked_at')->nullable()->after('transfer_request_id');
            }

            if (!Schema::hasColumn('users', 'transferred_at')) {
                $table->timestamp('transferred_at')->nullable()->after('transfer_locked_at');
            }

            if (!Schema::hasColumn('users', 'transferred_to_user_id')) {
                $table->unsignedBigInteger('transferred_to_user_id')->nullable()->after('transferred_at');
            }

            if (!Schema::hasColumn('users', 'transferred_to_family_id')) {
                $table->unsignedBigInteger('transferred_to_family_id')->nullable()->after('transferred_to_user_id');
            }

            if (!Schema::hasColumn('users', 'transfer_origin_user_id')) {
                $table->unsignedBigInteger('transfer_origin_user_id')->nullable()->after('transferred_to_family_id');
            }

            if (!Schema::hasColumn('users', 'transfer_origin_family_id')) {
                $table->unsignedBigInteger('transfer_origin_family_id')->nullable()->after('transfer_origin_user_id');
            }
        });

        Schema::table('families', function (Blueprint $table) {
            if (!Schema::hasColumn('families', 'transfer_status')) {
                $table->string('transfer_status', 32)->nullable()->after('email');
            }

            if (!Schema::hasColumn('families', 'transfer_label')) {
                $table->string('transfer_label')->nullable()->after('transfer_status');
            }

            if (!Schema::hasColumn('families', 'transfer_request_id')) {
                $table->unsignedBigInteger('transfer_request_id')->nullable()->after('transfer_label');
            }

            if (!Schema::hasColumn('families', 'transfer_locked_at')) {
                $table->timestamp('transfer_locked_at')->nullable()->after('transfer_request_id');
            }

            if (!Schema::hasColumn('families', 'transferred_at')) {
                $table->timestamp('transferred_at')->nullable()->after('transfer_locked_at');
            }

            if (!Schema::hasColumn('families', 'transferred_to_family_id')) {
                $table->unsignedBigInteger('transferred_to_family_id')->nullable()->after('transferred_at');
            }

            if (!Schema::hasColumn('families', 'transfer_origin_family_id')) {
                $table->unsignedBigInteger('transfer_origin_family_id')->nullable()->after('transferred_to_family_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach ([
                'transfer_status',
                'transfer_label',
                'transfer_request_id',
                'transfer_locked_at',
                'transferred_at',
                'transferred_to_user_id',
                'transferred_to_family_id',
                'transfer_origin_user_id',
                'transfer_origin_family_id',
            ] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('families', function (Blueprint $table) {
            foreach ([
                'transfer_status',
                'transfer_label',
                'transfer_request_id',
                'transfer_locked_at',
                'transferred_at',
                'transferred_to_family_id',
                'transfer_origin_family_id',
            ] as $column) {
                if (Schema::hasColumn('families', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
