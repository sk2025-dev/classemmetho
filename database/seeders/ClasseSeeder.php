<?php

namespace Database\Seeders;

use App\Models\Classe;
use Illuminate\Database\Seeder;

class ClasseSeeder extends Seeder
{
    public function run(): void
    {
        $classes = [
            [
                'nom' => 'Classe Méthodiste Alpha',
                'description' => 'Classe principale de la communauté méthodiste',
                'conducteur' => 'Jean Dupont',
                'status' => 'active',
                'nombre_membres' => 25,
            ],
            [
                'nom' => 'Classe Méthodiste Bêta',
                'description' => 'Classe secondaire pour les jeunes',
                'conducteur' => 'Marie Poulain',
                'status' => 'active',
                'nombre_membres' => 18,
            ],
            [
                'nom' => 'Classe Méthodiste Gamma',
                'description' => 'Classe pour les familles',
                'conducteur' => 'Pierre Martin',
                'status' => 'active',
                'nombre_membres' => 32,
            ],
            [
                'nom' => 'Classe Méthodiste Delta',
                'description' => 'Classe pour les nouveaux fidèles',
                'conducteur' => 'Sophie Leclerc',
                'status' => 'inactive',
                'nombre_membres' => 0,
            ],
        ];

        foreach ($classes as $classe) {
            Classe::firstOrCreate(
                ['nom' => $classe['nom']],
                $classe
            );
        }
    }
}
