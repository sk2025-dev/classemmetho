<?php

namespace App\Support;

use App\Models\User;

final class FimecoAccess
{
    public const POINT_FOCAL_FONCTION = 'Point Focal FIMECO';

    /**
     * Responsable FIMECO global (admin, ou fonction dédiée) : accès à toutes les classes.
     */
    public static function canManage(?User $user): bool
    {
        return $user !== null
            && ($user->role === 'admin' || $user->hasFonction('Responsable FIMECO'));
    }

    /**
     * Point Focal FIMECO : accès limité à la FIMECO des membres de sa propre classe.
     * Retourne l'id de la classe si l'utilisateur détient la fonction et a une classe
     * assignée, sinon null. N'importe quel rôle peut porter cette fonction.
     */
    public static function pointFocalClasseId(?User $user): ?int
    {
        if ($user === null || !$user->classe_id || !$user->hasFonction(self::POINT_FOCAL_FONCTION)) {
            return null;
        }

        return (int) $user->classe_id;
    }

    public static function isPointFocal(?User $user): bool
    {
        return self::pointFocalClasseId($user) !== null;
    }
}
