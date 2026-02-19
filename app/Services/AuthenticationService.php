<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthenticationService
{
    /**
     * Authentifier un utilisateur par identifier ou email
     *
     * @param string $login Peut être identifier ou email
     * @param string $password Mot de passe en clair
     * @return array ['success' => bool, 'message' => string, 'user' => User|null]
     */
    public static function authenticate(string $login, string $password): array
    {
        // Chercher par identifier OU email avec eager loading des relations
        $user = User::with(['family', 'classe', 'fonction'])
                    ->where('identifier', $login)
                    ->orWhere('email', $login)
                    ->first();

        // Utilisateur non trouvé
        if (!$user) {
            return [
                'success' => false,
                'message' => 'Identifiant ou email introuvable.',
                'user' => null,
            ];
        }

        // Vérifier le mot de passe
        if (!Hash::check($password, $user->password)) {
            return [
                'success' => false,
                'message' => 'Mot de passe incorrect.',
                'user' => null,
            ];
        }

        // Vérifier si le compte est actif
        if ($user->is_active === false) {
            return [
                'success' => false,
                'message' => 'Ce compte a été désactivé.',
                'user' => null,
            ];
        }

        // Log de la connexion
        $user->update([
            'last_login_at' => now(),
        ]);

        return [
            'success' => true,
            'message' => 'Authentification réussie.',
            'user' => $user,
        ];
    }

    /**
     * Vérifier si un utilisateur doit changer son mot de passe
     *
     * @param User $user
     * @return bool
     */
    public static function mustChangePassword(User $user): bool
    {
        return $user->must_change_password === true;
    }

    /**
     * Obtenir les informations de l'utilisateur après authentification
     *
     * @param User $user
     * @return array
     */
    public static function getUserInfo(User $user): array
    {
        return [
            'id' => $user->id,
            'nome' => $user->nom,
            'prenom' => $user->prenom,
            'email' => $user->email,
            'identifier' => $user->identifier,
            'role' => $user->role,
            'must_change_password' => $user->must_change_password,
            'last_login_at' => $user->last_login_at,
        ];
    }
}
