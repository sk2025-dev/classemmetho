<?php

namespace App\Services;

use App\Models\Family;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * FamilyDeduplicationService
 *
 * Détecte et corrige les familles dupliquées
 * Une famille est dupliquée si elle a le même (email, classe_id, responsable_id)
 */
class FamilyDeduplicationService
{
    /**
     * Nettoyer toutes les familles dupliquées
     * Garder la plus ancienne, fusionner les autres dans celle-ci
     */
    public function cleanAllDuplicates(): array
    {
        Log::info('FamilyDeduplicationService: Starting deduplication process');

        $stats = [
            'duplicate_groups' => 0,
            'families_merged' => 0,
            'family_members_updated' => 0,
            'users_updated' => 0,
            'errors' => [],
        ];

        // Trouver les groupes de familles dupliquées
        // Une famille est unique par (email, classe_id)
        $duplicateGroups = Family::select('email', 'classe_id', DB::raw('COUNT(*) as count'), DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('email')
            ->whereNull('deleted_at')
            ->groupBy('email', 'classe_id')
            ->having('count', '>', 1)
            ->get();

        $stats['duplicate_groups'] = $duplicateGroups->count();

        foreach ($duplicateGroups as $group) {
            try {
                $merged = $this->mergeGroup($group->email, $group->classe_id, $group->keep_id);
                $stats['families_merged'] += $merged['families_merged'];
                $stats['family_members_updated'] += $merged['family_members_updated'];
                $stats['users_updated'] += $merged['users_updated'];
            } catch (\Exception $e) {
                Log::error('Error merging family group', [
                    'email' => $group->email,
                    'classe_id' => $group->classe_id,
                    'error' => $e->getMessage(),
                ]);
                $stats['errors'][] = "Group ({$group->email}, {$group->classe_id}): {$e->getMessage()}";
            }
        }

        Log::info('FamilyDeduplicationService: Deduplication completed', $stats);
        return $stats;
    }

    /**
     * Fusionner un groupe de familles dupliquées
     */
    private function mergeGroup(string $email, ?int $classeId, int $keepId): array
    {
        $stats = [
            'families_merged' => 0,
            'family_members_updated' => 0,
            'users_updated' => 0,
        ];

        // Trouver toutes les familles du groupe
        $families = Family::where('email', $email)
            ->where('classe_id', $classeId)
            ->where('id', '!=', $keepId)
            ->whereNull('deleted_at')
            ->get();

        if ($families->isEmpty()) {
            return $stats;
        }

        $keepFamily = Family::find($keepId);
        if (!$keepFamily) {
            throw new \Exception("Keep family ID {$keepId} not found");
        }

        foreach ($families as $duplicateFamily) {
            // Rediriger tous les FamilyMembers
            DB::table('family_members')
                ->where('family_id', $duplicateFamily->id)
                ->update(['family_id' => $keepFamily->id]);

            $stats['family_members_updated'] += $duplicateFamily->users()->count();

            // Rediriger tous les Users
            DB::table('users')
                ->where('family_id', $duplicateFamily->id)
                ->update(['family_id' => $keepFamily->id]);

            $stats['users_updated'] += User::where('family_id', $duplicateFamily->id)->count();

            // Mettre à jour les inscriptions
            DB::table('inscriptions')
                ->where('family_id', $duplicateFamily->id)
                ->update(['family_id' => $keepFamily->id]);

            // Soft delete la famille dupliquée
            $duplicateFamily->delete();
            $stats['families_merged']++;

            Log::info('Merged duplicate family', [
                'duplicate_id' => $duplicateFamily->id,
                'keep_id' => $keepFamily->id,
                'email' => $email,
            ]);
        }

        return $stats;
    }

    /**
     * Vérifier l'intégrité d'une famille
     */
    public function verifyFamilyIntegrity(Family $family): array
    {
        $issues = [];

        // Vérifier que tous les users de la famille ont le même famille_id
        $usersCount = User::where('family_id', $family->id)->count();
        if ($usersCount === 0) {
            $issues[] = 'No users in family';
        }

        // Vérifier que tous les users ont la même classe_id que la famille
        $usersWithDifferentClass = User::where('family_id', $family->id)
            ->where('classe_id', '!=', $family->classe_id)
            ->count();

        if ($usersWithDifferentClass > 0) {
            $issues[] = "Found {$usersWithDifferentClass} users with different classe_id than family";
        }

        // Vérifier qu'il n'y a qu'un responsable
        $responsablesCount = User::where('family_id', $family->id)
            ->where('is_family_responsible', true)
            ->count();

        if ($responsablesCount !== 1) {
            $issues[] = "Expected 1 responsible, found {$responsablesCount}";
        }

        // Vérifier que family.responsable_id pointe sur un user de la famille
        if ($family->responsable_id) {
            $responsable = User::find($family->responsable_id);
            if (!$responsable || $responsable->family_id !== $family->id) {
                $issues[] = 'responsable_id does not point to a user in this family';
            }
        }

        return $issues;
    }

    /**
     * Corriger les intégrités
     */
    public function fixFamilyIntegrity(Family $family): array
    {
        $fixes = [];

        // Fixer les classe_id différentes
        $usersWithDifferentClass = User::where('family_id', $family->id)
            ->where('classe_id', '!=', $family->classe_id)
            ->get();

        foreach ($usersWithDifferentClass as $user) {
            $user->update(['classe_id' => $family->classe_id]);
            $fixes[] = "Fixed user {$user->id} classe_id to {$family->classe_id}";
        }

        // Fixer le responsable_id si absent
        if (!$family->responsable_id) {
            $responsible = User::where('family_id', $family->id)
                ->where('is_family_responsible', true)
                ->first();

            if ($responsible) {
                $family->update(['responsable_id' => $responsible->id]);
                $fixes[] = "Set family responsable_id to {$responsible->id}";
            }
        }

        return $fixes;
    }
}
