<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class UpdateAdminPasswordSeeder extends Seeder
{
    /**
     * Met à jour le mot de passe du compte admin.
     *
     * Prérequis dans .env :
     *   ADMIN_PASSWORD=votre_mot_de_passe
     * Optionnel :
     *   ADMIN_EMAIL=admin@classemetho.local (défaut)
     *
     * Exécution : php artisan db:seed --class=UpdateAdminPasswordSeeder
     */
    public function run(): void
    {
        $password = env('ADMIN_PASSWORD');
        if ($password === null || $password === '') {
            throw new RuntimeException(
                'ADMIN_PASSWORD doit être défini dans .env (non versionné). Exemple : ADMIN_PASSWORD="MonMotDePasseSûr"'
            );
        }

        $email = env('ADMIN_EMAIL', 'admin@classemetho.local');

        $user = User::query()
            ->where('email', $email)
            ->where('role', 'admin')
            ->first();

        if (! $user) {
            $user = User::query()->where('role', 'admin')->orderBy('id')->first();
        }

        if (! $user) {
            throw new RuntimeException(
                "Aucun utilisateur avec le rôle « admin » trouvé (email attendu : {$email})."
            );
        }

        $user->password = Hash::make($password);
        $user->save();

        $this->command?->info("Mot de passe admin mis à jour pour : {$user->email}");
    }
}
