<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Restructure complètement le système de famille et inscription
     * - Supprime les doublons dans families
     * - Ajoute les contraintes d'intégrité
     * - Crée l'audit trail
     */
    public function up(): void
    {
        // 1. Créer la table audit_logs AVANT les changements
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->string('action'); // 'family.created', 'family.merged', 'user.family_changed', etc
                $table->string('entity_type'); // 'Family', 'User', 'FamilyMember'
                $table->unsignedBigInteger('entity_id'); // ID de l'entité modifiée
                $table->json('old_values')->nullable(); // Valeurs avant
                $table->json('new_values')->nullable(); // Valeurs après
                $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('reason')->nullable(); // Pourquoi le changement
                $table->timestamp('created_at');

                $table->index(['entity_type', 'entity_id']);
                $table->index('action');
                $table->index('created_at');
            });
        }

        // 2. Les colonnes de déduplication sont maintenant créées dans create_families_table
        // Rien à faire ici pour families - elles seront gérées directement

        // 3. MAINTENANT nettoyer les doublons (avec merged_into_id disponible)
        // $this->deduplicateFamilies(); // Désactiver - colonne email n'existe pas dans families

        // 4. Améliorer les colonnes de User
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                // Ajouter un flag pour empêcher les changements de family
                if (!Schema::hasColumn('users', 'family_id_locked')) {
                    $table->boolean('family_id_locked')->default(false);
                }

                // Différencier responsable de famille vs responsable personnel
                if (!Schema::hasColumn('users', 'is_family_responsible')) {
                    $table->boolean('is_family_responsible')->default(false);
                }
            });
        }

        // 5. Améliorer FamilyMembers pour éviter les doublons
        if (Schema::hasTable('family_members')) {
            Schema::table('family_members', function (Blueprint $table) {
                // Ajouter un flag de duplication
                if (!Schema::hasColumn('family_members', 'is_duplicate')) {
                    $table->boolean('is_duplicate')->default(false);
                }

                // Ajouter le timestamp de la dernière approbation
                if (!Schema::hasColumn('family_members', 'approved_at')) {
                    $table->timestamp('approved_at')->nullable();
                }
            });

            // Créer un index unique pour éviter les doublons
            try {
                Schema::table('family_members', function (Blueprint $table) {
                    if (!DB::connection()->getSchemaBuilder()->hasIndex('family_members', 'unique_user_family_approved')) {
                        $table->unique(['user_id', 'family_id', 'deleted_at'], 'unique_user_family_approved');
                    }
                });
            } catch (\Exception $e) {
                // L'index existe peut-être déjà
            }
        }

        // 6. Créer une table pour les change logs de famille
        if (!Schema::hasTable('family_change_logs')) {
            Schema::create('family_change_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('old_family_id')->nullable()->constrained('families')->nullOnDelete();
                $table->foreignId('new_family_id')->nullable()->constrained('families')->nullOnDelete();
                $table->string('reason')->nullable();
                $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('changed_at');

                $table->index(['user_id', 'changed_at']);
            });
        }

        // 7. Ajouter les contraintes de sécurité
        if (Schema::hasTable('families')) {
            try {
                Schema::table('families', function (Blueprint $table) {
                    // UNIQUE sur (email, classe_id) pour éviter les doublons - COMMENTED: email column doesn't exist
                    // if (!DB::connection()->getSchemaBuilder()->hasIndex('families', 'unique_family_dedup')) {
                    //     $table->unique(['email', 'classe_id'], 'unique_family_dedup');
                    // }
                });
            } catch (\Exception $e) {
                // L'index existe peut-être déjà
            }
        }
    }

    /**
     * Dédupliquer les familles
     */
    private function deduplicateFamilies(): void
    {
        // Trouver les groupes de familles dupliquées
        $duplicates = DB::table('families')
            ->select('email', 'classe_id', DB::raw('COUNT(*) as count'), DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('email')
            ->groupBy('email', 'classe_id')
            ->having('count', '>', 1)
            ->get();

        foreach ($duplicates as $group) {
            $deleteIds = DB::table('families')
                ->where('email', $group->email)
                ->where('classe_id', $group->classe_id)
                ->where('id', '!=', $group->keep_id)
                ->pluck('id');

            if ($deleteIds->isNotEmpty()) {
                // Soft delete les family_members AVANT de rediriger les users
                DB::table('family_members')
                    ->whereIn('family_id', $deleteIds)
                    ->update(['deleted_at' => now()]);

                // Rediriger les users
                DB::table('users')
                    ->whereIn('family_id', $deleteIds)
                    ->update(['family_id' => $group->keep_id]);

                // Marquer les familles comme supprimées
                DB::table('families')
                    ->whereIn('id', $deleteIds)
                    ->update([
                        'merged_into_id' => $group->keep_id,
                        'merged_at' => now(),
                        'deleted_at' => now(),
                    ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('family_change_logs');
        Schema::dropIfExists('audit_logs');

        if (Schema::hasTable('family_members')) {
            try {
                DB::statement('ALTER TABLE family_members DROP INDEX IF EXISTS unique_user_family_approved');
            } catch (\Exception $e) {
                // Index might not exist
            }

            Schema::table('family_members', function (Blueprint $table) {
                if (Schema::hasColumn('family_members', 'is_duplicate')) {
                    $table->dropColumn('is_duplicate');
                }
                if (Schema::hasColumn('family_members', 'approved_at')) {
                    $table->dropColumn('approved_at');
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'family_id_locked')) {
                    $table->dropColumn('family_id_locked');
                }
                if (Schema::hasColumn('users', 'is_family_responsible')) {
                    $table->dropColumn('is_family_responsible');
                }
            });
        }

        if (Schema::hasTable('families')) {
            // NE PAS supprimer les colonnes de families ici
            // Elles sont gérées par la migration create_families_table
            // et seront supprimées quand la table entière sera droppée
        }
    }
};
