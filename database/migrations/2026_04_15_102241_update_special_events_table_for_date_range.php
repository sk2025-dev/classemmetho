<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasStartDate = Schema::hasColumn('special_events', 'start_date');
        $hasEndDate = Schema::hasColumn('special_events', 'end_date');
        $hasStartTime = Schema::hasColumn('special_events', 'start_time');
        $hasEndTime = Schema::hasColumn('special_events', 'end_time');

        if (!$hasStartDate || !$hasEndDate || !$hasStartTime || !$hasEndTime) {
            Schema::table('special_events', function (Blueprint $table) use ($hasStartDate, $hasEndDate, $hasStartTime, $hasEndTime): void {
                // Etat partiel possible apres merge: on ajoute seulement ce qui manque.
                if (!$hasStartDate) {
                    $table->date('start_date')->nullable()->after('title');
                }
                if (!$hasEndDate) {
                    $table->date('end_date')->nullable()->after('start_date');
                }
                if (!$hasStartTime) {
                    $table->time('start_time')->nullable()->after('end_date');
                }
                if (!$hasEndTime) {
                    $table->time('end_time')->nullable()->after('start_time');
                }
            });
        }

        if (Schema::hasColumn('special_events', 'date')) {
            $updateData = [
                'start_date' => DB::raw('date'),
            ];

            if (Schema::hasColumn('special_events', 'time') && Schema::hasColumn('special_events', 'start_time')) {
                $updateData['start_time'] = DB::raw('time');
            }

            DB::table('special_events')
                ->whereNotNull('date')
                ->update($updateData);
        }

        Schema::table('special_events', function (Blueprint $table): void {
            if (Schema::hasColumn('special_events', 'date')) {
                $table->dropColumn('date');
            }
            if (Schema::hasColumn('special_events', 'time')) {
                $table->dropColumn('time');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('special_events', 'date') || !Schema::hasColumn('special_events', 'time')) {
            Schema::table('special_events', function (Blueprint $table): void {
                if (!Schema::hasColumn('special_events', 'date')) {
                    $table->date('date')->nullable()->after('title');
                }
                if (!Schema::hasColumn('special_events', 'time')) {
                    $table->time('time')->nullable()->after('date');
                }
            });
        }

        if (Schema::hasColumn('special_events', 'start_date')) {
            $rollbackData = [
                'date' => DB::raw('start_date'),
            ];

            if (Schema::hasColumn('special_events', 'start_time')) {
                $rollbackData['time'] = DB::raw('start_time');
            }

            DB::table('special_events')
                ->whereNotNull('start_date')
                ->update($rollbackData);
        }

        Schema::table('special_events', function (Blueprint $table): void {
            $columnsToDrop = [];
            foreach (['start_date', 'end_date', 'start_time', 'end_time'] as $column) {
                if (Schema::hasColumn('special_events', $column)) {
                    $columnsToDrop[] = $column;
                }
            }

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
