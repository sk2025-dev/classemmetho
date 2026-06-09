<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BureauConducteurSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'bureau.conducteurs@classemetho.local'],
            [
                'identifier'           => 'BUREAU001',
                'code_membre'          => 'BC001',
                'nom'                  => 'Conducteurs',
                'prenom'               => 'Bureau',
                'password'             => Hash::make('bureau123'),
                'role'                 => 'bureau_conducteur',
                'email_verified_at'    => now(),
                'must_change_password' => true,
            ]
        );

        $this->command->info('Bureau des Conducteurs créé/mis à jour :');
        $this->command->info('  Code membre  : BC001');
        $this->command->info('  Identifiant  : BUREAU001');
        $this->command->info('  Email        : bureau.conducteurs@classemetho.local');
        $this->command->info('  Mot de passe : bureau123');
        $this->command->info('  ⚠️  Changez le mot de passe à la première connexion !');
    }
}
