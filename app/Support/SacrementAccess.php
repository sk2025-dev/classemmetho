<?php

namespace App\Support;

use App\Models\ActeLiturgique;
use App\Models\User;

final class SacrementAccess
{
    public static function responsable(User $user): bool
    {
        return (bool) $user->family_id && (in_array($user->role, ['responsable_famille', 'responsable'], true)
            || (bool) $user->is_family_responsible);
    }

    public static function canRegister(User $user): bool
    {
        return self::responsable($user) || ($user->role === 'conducteur' && (bool) $user->classe_id);
    }

    public static function candidates(User $user): \Illuminate\Database\Eloquent\Builder
    {
        return User::query()->where(function ($query) use ($user) {
            $query->whereRaw('1 = 0');
            if (self::responsable($user)) {
                $query->orWhere('family_id', $user->family_id);
            }
            if ($user->role === 'conducteur' && $user->classe_id) {
                $query->orWhere('classe_id', $user->classe_id);
            }
        })->whereNotNull('family_id');
    }

    public static function bureau(User $user): bool
    {
        return $user->role === 'bureau_conducteur' || ($user->role === 'conducteur'
            && in_array(mb_strtolower(trim((string) $user->fonction?->nom)), ['président des conducteurs', 'president des conducteurs'], true));
    }

    public static function allowed(User $user): bool
    {
        return self::responsable($user) || self::bureau($user) || in_array($user->role, ['admin', 'pasteur', 'conducteur'], true);
    }

    public static function owns(User $user, ActeLiturgique $acte): bool
    {
        return (self::responsable($user) && (int) $acte->family_id === (int) $user->family_id)
            || ($user->role === 'conducteur' && $user->classe_id && (int) $acte->classe_id === (int) $user->classe_id && (int) $acte->created_by === (int) $user->id);
    }

    public static function reads(User $user, ActeLiturgique $acte): bool
    {
        if (($acte->suivi_sacrement['etape'] ?? null) === 'brouillon') {
            return $user->role === 'admin' || self::owns($user, $acte);
        }
        if (in_array($user->role, ['admin', 'pasteur'], true)) {
            return true;
        }
        if (self::owns($user, $acte)) {
            return true;
        }
        if ($user->role === 'conducteur' && $user->classe_id && (int) $user->classe_id === (int) $acte->classe_id) {
            return true;
        }

        return self::bureau($user) && $acte->liste_sacrement_id !== null;
    }
}
