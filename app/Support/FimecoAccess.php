<?php

namespace App\Support;

use App\Models\User;

final class FimecoAccess
{
    public static function canManage(?User $user): bool
    {
        return $user !== null
            && ($user->role === 'admin' || $user->hasFonction('Responsable FIMECO'));
    }
}
