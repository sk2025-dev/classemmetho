<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer l'admin par défaut
        $admin = User::updateOrCreate(
            ['email' => 'admin@classemetho.local'],
            [
                'identifier' => 'ADMIN001',
                'nom' => 'Administrateur',
                'prenom' => 'Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'email_verified_at' => now(),
                'must_change_password' => true,
            ]
        );

        $this->command->info("Admin créé/mis à jour:");
        $this->command->info("  Identifiant: ADMIN001");
        $this->command->info("  Email: admin@classemetho.local");
        $this->command->info("  Mot de passe initial: admin123");
        $this->command->info("  ⚠️  Changez le mot de passe lors de la première connexion!");
    }
}
