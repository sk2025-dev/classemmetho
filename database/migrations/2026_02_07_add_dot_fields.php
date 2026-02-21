<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajouter les colonnes pour la dot (cadeau de mariage)
     * Partout où se trouve statut_marital, ajouter:
     * - date_dot (la date de remise de la dot)
     * - lieu_dot (le lieu de remise de la dot)
     */
    public function up(): void
    {
        // Table users
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                // Vérifier si statut_marital existe avant d'ajouter après
                $columns = Schema::getColumnListing('users');
                if (!Schema::hasColumn('users', 'date_dot')) {
                    if (in_array('statut_marital', $columns)) {
                        $table->date('date_dot')->nullable()->after('statut_marital');
                    } else {
                        $table->date('date_dot')->nullable();
                    }
                }
                if (!Schema::hasColumn('users', 'lieu_dot')) {
                    $table->string('lieu_dot')->nullable();
                }
            });
        }

        // Table family_members
        if (Schema::hasTable('family_members')) {
            Schema::table('family_members', function (Blueprint $table) {
                // Vérifier si statut_marital existe avant d'ajouter après
                $columns = Schema::getColumnListing('family_members');
                if (!Schema::hasColumn('family_members', 'date_dot')) {
                    if (in_array('statut_marital', $columns)) {
                        $table->date('date_dot')->nullable()->after('statut_marital');
                    } else {
                        $table->date('date_dot')->nullable();
                    }
                }
                if (!Schema::hasColumn('family_members', 'lieu_dot')) {
                    $table->string('lieu_dot')->nullable();
                }
            });
        }

        // Table inscriptions (si elle contient aussi le statut_marital)
        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                // Vérifier d'abord si statut_marital existe
                $columns = Schema::getColumnListing('inscriptions');
                if (in_array('statut_marital', $columns)) {
                    if (!Schema::hasColumn('inscriptions', 'date_dot')) {
                        $table->date('date_dot')->nullable()->after('statut_marital');
                    }
                    if (!Schema::hasColumn('inscriptions', 'lieu_dot')) {
                        $table->string('lieu_dot')->nullable()->after('date_dot');
                    }
                }
            });
        }
    }

    public function down(): void
    {
        // Supprimer les colonnes de dot
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = Schema::getColumnListing('users');
                $toDelete = array_intersect(['date_dot', 'lieu_dot'], $columns);
                if (!empty($toDelete)) {
                    $table->dropColumn($toDelete);
                }
            });
        }

        if (Schema::hasTable('family_members')) {
            Schema::table('family_members', function (Blueprint $table) {
                $columns = Schema::getColumnListing('family_members');
                $toDelete = array_intersect(['date_dot', 'lieu_dot'], $columns);
                if (!empty($toDelete)) {
                    $table->dropColumn($toDelete);
                }
            });
        }

        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');
                $toDelete = array_intersect(['date_dot', 'lieu_dot'], $columns);
                if (!empty($toDelete)) {
                    $table->dropColumn($toDelete);
                }
            });
        }
    }
};
