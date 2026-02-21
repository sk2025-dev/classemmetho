<?php

namespace Database\Seeders;

use App\Models\Fonction;
use Illuminate\Database\Seeder;

class FonctionSeeder extends Seeder
{
    /**
     * Remplir la table des fonctions
     */
    public function run(): void
    {
        $fonctions = [
            [
                'nom' => 'Pasteur',
                'description' => 'Chef spirituel de l\'église',
            ],
            [
                'nom' => 'Diacre',
                'description' => 'Responsable de l\'administration',
            ],
            [
                'nom' => 'Conducteur',
                'description' => 'Conducteur d\'une classe méthodiste',
            ],
            [
                'nom' => 'Moniteur',
                'description' => 'Assistant du conducteur',
            ],
            [
                'nom' => 'Trésorier',
                'description' => 'Responsable des finances',
            ],
            [
                'nom' => 'Secrétaire',
                'description' => 'Responsable de la documentation',
            ],
        ];

        foreach ($fonctions as $fonction) {
            Fonction::updateOrCreate(
                ['nom' => $fonction['nom']],
                ['description' => $fonction['description']]
            );
        }
    }
}
