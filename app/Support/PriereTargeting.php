<?php

namespace App\Support;

use App\Models\Priere;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class PriereTargeting
{
    public static function availableTargetsForResponsible(User $user): array
    {
        return self::availableTargetsForClassScopedSender($user);
    }

    public static function availableTargetsForMember(User $user): array
    {
        return self::availableTargetsForClassScopedSender($user);
    }

    public static function availableTargetsForConductor(User $user): array
    {
        return self::availableTargetsForClassScopedSender($user);
    }

    public static function buildDestinationsForResponsible(User $user, string $targetType, ?int $targetUserId = null): array
    {
        return self::buildDestinationsForClassScopedSender($user, $targetType, $targetUserId);
    }

    public static function buildDestinationsForMember(User $user, string $targetType, ?int $targetUserId = null): array
    {
        return self::buildDestinationsForClassScopedSender($user, $targetType, $targetUserId);
    }

    public static function buildDestinationsForConductor(User $user, string $targetType, ?int $targetUserId = null): array
    {
        return self::buildDestinationsForClassScopedSender($user, $targetType, $targetUserId);
    }

    private static function availableTargetsForClassScopedSender(User $user): array
    {
        $sameClasseConducteurs = User::query()
            ->where('role', 'conducteur')
            ->where('classe_id', $user->classe_id)
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get(['id', 'nom', 'prenom', 'role', 'classe_id']);

        $sameClasseMembers = User::query()
            ->whereIn('role', ['membre_famille', 'responsable_famille'])
            ->where('classe_id', $user->classe_id)
            ->whereKeyNot($user->id)
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get(['id', 'nom', 'prenom', 'role', 'classe_id']);

        $pastors = User::query()
            ->where('role', 'pasteur')
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get(['id', 'nom', 'prenom', 'role', 'classe_id']);

        return [
            'targetModes' => [
                [
                    'value' => Priere::TYPE_ALL_PASTEURS,
                    'label' => 'Tous les pasteurs',
                    'description' => 'La priere sera visible par tous les pasteurs de toutes les classes.',
                ],
                [
                    'value' => Priere::TYPE_SPECIFIC_PASTEUR,
                    'label' => 'Un pasteur specifique',
                    'description' => 'Choisissez un pasteur precis.',
                ],
                [
                    'value' => Priere::TYPE_ALL_CONDUCTEURS_CLASSE,
                    'label' => 'Les conducteurs de ma classe',
                    'description' => 'La priere sera visible par les conducteurs de votre classe.',
                ],
                [
                    'value' => Priere::TYPE_SPECIFIC_CONDUCTEUR_CLASSE,
                    'label' => 'Un conducteur de ma classe',
                    'description' => 'Choisissez un conducteur precis de votre classe.',
                ],
                [
                    'value' => Priere::TYPE_SPECIFIC_MEMBRE_CLASSE,
                    'label' => 'Un membre de ma classe',
                    'description' => 'Choisissez un membre precis de votre classe.',
                ],
            ],
            'pastors' => $pastors->map(fn (User $target) => self::formatUserOption($target))->values()->all(),
            'conductors' => $sameClasseConducteurs->map(fn (User $target) => self::formatUserOption($target))->values()->all(),
            'members' => $sameClasseMembers->map(fn (User $target) => self::formatUserOption($target))->values()->all(),
        ];
    }

    private static function buildDestinationsForClassScopedSender(User $user, string $targetType, ?int $targetUserId = null): array
    {
        $specificPastor = $targetType === Priere::TYPE_SPECIFIC_PASTEUR
            ? self::resolveTargetUser($targetUserId, 'pasteur')
            : null;
        $specificConductor = $targetType === Priere::TYPE_SPECIFIC_CONDUCTEUR_CLASSE
            ? self::resolveTargetUser($targetUserId, 'conducteur', $user->classe_id)
            : null;
        $specificMember = $targetType === Priere::TYPE_SPECIFIC_MEMBRE_CLASSE
            ? self::resolveTargetUserByRoles($targetUserId, ['membre_famille', 'responsable_famille'], $user->classe_id, $user->id)
            : null;

        return match ($targetType) {
            Priere::TYPE_ALL_PASTEURS => [[
                'type_cible' => $targetType,
                'role_cible' => 'pasteur',
                'user_cible_id' => null,
                'classe_cible_id' => null,
                'user_label' => null,
                'meta' => ['label' => 'Tous les pasteurs'],
            ]],
            Priere::TYPE_SPECIFIC_PASTEUR => [[
                'user_label' => trim($specificPastor?->name ?? ''),
                'type_cible' => $targetType,
                'role_cible' => 'pasteur',
                'user_cible_id' => $specificPastor?->id,
                'classe_cible_id' => null,
                'meta' => ['label' => 'Pasteur specifique'],
            ]],
            Priere::TYPE_ALL_CONDUCTEURS_CLASSE => [[
                'type_cible' => $targetType,
                'role_cible' => 'conducteur',
                'user_cible_id' => null,
                'classe_cible_id' => $user->classe_id,
                'user_label' => null,
                'meta' => ['label' => 'Conducteurs de la classe'],
            ]],
            Priere::TYPE_SPECIFIC_CONDUCTEUR_CLASSE => [[
                'user_label' => trim($specificConductor?->name ?? ''),
                'type_cible' => $targetType,
                'role_cible' => 'conducteur',
                'user_cible_id' => $specificConductor?->id,
                'classe_cible_id' => $user->classe_id,
                'meta' => ['label' => 'Conducteur specifique'],
            ]],
            Priere::TYPE_SPECIFIC_MEMBRE_CLASSE => [[
                'user_label' => trim($specificMember?->name ?? ''),
                'type_cible' => $targetType,
                'role_cible' => 'membre_famille',
                'user_cible_id' => $specificMember?->id,
                'classe_cible_id' => $user->classe_id,
                'meta' => ['label' => 'Membre specifique'],
            ]],
            default => throw ValidationException::withMessages([
                'type_cible' => 'Le mode de diffusion de la priere est invalide.',
            ]),
        };
    }

    public static function filterVisibleForUser(Collection $prayers, User $user): Collection
    {
        return $prayers->filter(function (Priere $prayer) use ($user) {
            if ((int) $prayer->user_id === (int) $user->id) {
                return true;
            }

            $destinations = collect($prayer->destinataires());

            if ($user->role === 'pasteur') {
                return $destinations->contains(fn (array $destination) =>
                    ($destination['type_cible'] ?? null) === Priere::TYPE_ALL_PASTEURS
                    || (
                        ($destination['type_cible'] ?? null) === Priere::TYPE_SPECIFIC_PASTEUR
                        && (int) ($destination['user_cible_id'] ?? 0) === (int) $user->id
                    )
                ) || $destinations->isEmpty();
            }

            if ($user->role === 'conducteur') {
                return $destinations->contains(fn (array $destination) =>
                    (
                        ($destination['type_cible'] ?? null) === Priere::TYPE_ALL_CONDUCTEURS_CLASSE
                        && (int) ($destination['classe_cible_id'] ?? 0) === (int) $user->classe_id
                    ) || (
                        ($destination['type_cible'] ?? null) === Priere::TYPE_SPECIFIC_CONDUCTEUR_CLASSE
                        && (int) ($destination['user_cible_id'] ?? 0) === (int) $user->id
                    )
                );
            }

            if ($user->role === 'membre_famille') {
                return $destinations->contains(fn (array $destination) =>
                    ($destination['type_cible'] ?? null) === Priere::TYPE_SPECIFIC_MEMBRE_CLASSE
                    && (int) ($destination['user_cible_id'] ?? 0) === (int) $user->id
                );
            }

            if ($user->role === 'responsable_famille') {
                return $destinations->contains(fn (array $destination) =>
                    ($destination['type_cible'] ?? null) === Priere::TYPE_SPECIFIC_MEMBRE_CLASSE
                    && (int) ($destination['user_cible_id'] ?? 0) === (int) $user->id
                );
            }

            return false;
        })->values();
    }

    private static function resolveTargetUserByRoles(?int $targetUserId, array $roles, ?int $classeId = null, ?int $excludedUserId = null): User
    {
        if (!$targetUserId) {
            throw ValidationException::withMessages([
                'user_cible_id' => 'Veuillez choisir un destinataire precis.',
            ]);
        }

        $query = User::query()
            ->whereKey($targetUserId)
            ->whereIn('role', $roles);

        if ($classeId) {
            $query->where('classe_id', $classeId);
        }

        if ($excludedUserId) {
            $query->whereKeyNot($excludedUserId);
        }

        $target = $query->first();

        if (!$target) {
            throw ValidationException::withMessages([
                'user_cible_id' => 'Le destinataire selectionne n est pas autorise pour cette priere.',
            ]);
        }

        return $target;
    }

    private static function resolveTargetUser(?int $targetUserId, string $role, ?int $classeId = null, ?int $excludedUserId = null): User
    {
        if (!$targetUserId) {
            throw ValidationException::withMessages([
                'user_cible_id' => 'Veuillez choisir un destinataire precis.',
            ]);
        }

        $query = User::query()
            ->whereKey($targetUserId)
            ->where('role', $role);

        if ($classeId) {
            $query->where('classe_id', $classeId);
        }

        if ($excludedUserId) {
            $query->whereKeyNot($excludedUserId);
        }

        $target = $query->first();

        if (!$target) {
            throw ValidationException::withMessages([
                'user_cible_id' => 'Le destinataire selectionne n est pas autorise pour cette priere.',
            ]);
        }

        return $target;
    }

    private static function formatUserOption(User $user): array
    {
        return [
            'id' => $user->id,
            'label' => trim($user->prenom . ' ' . $user->nom),
            'role' => $user->role,
            'classe_id' => $user->classe_id,
        ];
    }
}
