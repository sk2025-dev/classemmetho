<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('prieres')) {
            return;
        }

        $this->dropForeignIfExists('prieres', 'viewed_by_pastor_id');
        $this->dropForeignIfExists('prieres', 'prayed_by_pastor_id');
        $this->dropForeignIfExists('prieres', 'fulfilled_by_pastor_id');

        Schema::table('prieres', function (Blueprint $table) {
            if (Schema::hasColumn('prieres', 'submitted_by_role')) {
                $table->renameColumn('submitted_by_role', 'role_soumission');
            }

            if (Schema::hasColumn('prieres', 'subject')) {
                $table->renameColumn('subject', 'sujet');
            }

            if (Schema::hasColumn('prieres', 'message')) {
                $table->renameColumn('message', 'demande');
            }

            if (Schema::hasColumn('prieres', 'is_anonymous')) {
                $table->renameColumn('is_anonymous', 'est_anonyme');
            }

            if (Schema::hasColumn('prieres', 'visible_name')) {
                $table->renameColumn('visible_name', 'nom_affiche');
            }

            if (Schema::hasColumn('prieres', 'status')) {
                $table->renameColumn('status', 'statut');
            }

            if (Schema::hasColumn('prieres', 'testimony')) {
                $table->renameColumn('testimony', 'temoignage');
            }

            if (Schema::hasColumn('prieres', 'seen_at')) {
                $table->renameColumn('seen_at', 'vue_le');
            }

            if (Schema::hasColumn('prieres', 'prayed_at')) {
                $table->renameColumn('prayed_at', 'prise_en_priere_le');
            }

            if (Schema::hasColumn('prieres', 'fulfilled_at')) {
                $table->renameColumn('fulfilled_at', 'exaucee_le');
            }

            if (Schema::hasColumn('prieres', 'viewed_by_pastor_id')) {
                $table->renameColumn('viewed_by_pastor_id', 'vue_par_pasteur_id');
            }

            if (Schema::hasColumn('prieres', 'prayed_by_pastor_id')) {
                $table->renameColumn('prayed_by_pastor_id', 'prise_en_priere_par_pasteur_id');
            }

            if (Schema::hasColumn('prieres', 'fulfilled_by_pastor_id')) {
                $table->renameColumn('fulfilled_by_pastor_id', 'exaucee_par_pasteur_id');
            }
        });

        Schema::table('prieres', function (Blueprint $table) {
            if (Schema::hasColumn('prieres', 'vue_par_pasteur_id')) {
                $table->foreign('vue_par_pasteur_id')->references('id')->on('users')->nullOnDelete();
            }

            if (Schema::hasColumn('prieres', 'prise_en_priere_par_pasteur_id')) {
                $table->foreign('prise_en_priere_par_pasteur_id')->references('id')->on('users')->nullOnDelete();
            }

            if (Schema::hasColumn('prieres', 'exaucee_par_pasteur_id')) {
                $table->foreign('exaucee_par_pasteur_id')->references('id')->on('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('prieres')) {
            return;
        }

        $this->dropForeignIfExists('prieres', 'vue_par_pasteur_id');
        $this->dropForeignIfExists('prieres', 'prise_en_priere_par_pasteur_id');
        $this->dropForeignIfExists('prieres', 'exaucee_par_pasteur_id');

        Schema::table('prieres', function (Blueprint $table) {
            if (Schema::hasColumn('prieres', 'role_soumission')) {
                $table->renameColumn('role_soumission', 'submitted_by_role');
            }

            if (Schema::hasColumn('prieres', 'sujet')) {
                $table->renameColumn('sujet', 'subject');
            }

            if (Schema::hasColumn('prieres', 'demande')) {
                $table->renameColumn('demande', 'message');
            }

            if (Schema::hasColumn('prieres', 'est_anonyme')) {
                $table->renameColumn('est_anonyme', 'is_anonymous');
            }

            if (Schema::hasColumn('prieres', 'nom_affiche')) {
                $table->renameColumn('nom_affiche', 'visible_name');
            }

            if (Schema::hasColumn('prieres', 'statut')) {
                $table->renameColumn('statut', 'status');
            }

            if (Schema::hasColumn('prieres', 'temoignage')) {
                $table->renameColumn('temoignage', 'testimony');
            }

            if (Schema::hasColumn('prieres', 'vue_le')) {
                $table->renameColumn('vue_le', 'seen_at');
            }

            if (Schema::hasColumn('prieres', 'prise_en_priere_le')) {
                $table->renameColumn('prise_en_priere_le', 'prayed_at');
            }

            if (Schema::hasColumn('prieres', 'exaucee_le')) {
                $table->renameColumn('exaucee_le', 'fulfilled_at');
            }

            if (Schema::hasColumn('prieres', 'vue_par_pasteur_id')) {
                $table->renameColumn('vue_par_pasteur_id', 'viewed_by_pastor_id');
            }

            if (Schema::hasColumn('prieres', 'prise_en_priere_par_pasteur_id')) {
                $table->renameColumn('prise_en_priere_par_pasteur_id', 'prayed_by_pastor_id');
            }

            if (Schema::hasColumn('prieres', 'exaucee_par_pasteur_id')) {
                $table->renameColumn('exaucee_par_pasteur_id', 'fulfilled_by_pastor_id');
            }
        });

        Schema::table('prieres', function (Blueprint $table) {
            if (Schema::hasColumn('prieres', 'viewed_by_pastor_id')) {
                $table->foreign('viewed_by_pastor_id')->references('id')->on('users')->nullOnDelete();
            }

            if (Schema::hasColumn('prieres', 'prayed_by_pastor_id')) {
                $table->foreign('prayed_by_pastor_id')->references('id')->on('users')->nullOnDelete();
            }

            if (Schema::hasColumn('prieres', 'fulfilled_by_pastor_id')) {
                $table->foreign('fulfilled_by_pastor_id')->references('id')->on('users')->nullOnDelete();
            }
        });
    }

    private function dropForeignIfExists(string $tableName, string $columnName): void
    {
        if (!Schema::hasColumn($tableName, $columnName)) {
            return;
        }

        $databaseName = DB::getDatabaseName();

        $constraint = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->select('CONSTRAINT_NAME')
            ->where('TABLE_SCHEMA', $databaseName)
            ->where('TABLE_NAME', $tableName)
            ->where('COLUMN_NAME', $columnName)
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->value('CONSTRAINT_NAME');

        if (!$constraint) {
            return;
        }

        DB::statement(sprintf(
            'ALTER TABLE `%s` DROP FOREIGN KEY `%s`',
            $tableName,
            $constraint,
        ));
    }
};
