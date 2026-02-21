<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClassesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Remplit la table classes avec les groupes/classes de l'église
     */
    public function run(): void
    {
        $classes = [
            [
                'nom' => 'Genese',
            ],
            [
                'nom' => 'Romains'
            ],
            [
                'nom' => 'Jerusalem',

            ],
            [
                'nom' => 'Sion',

            ],
            [
                'nom' => 'Ephese',

            ],
            [
                'nom' => 'Bethanie',

            ],
            [
                'nom' => 'Josue',

            ],
            [
                'nom' => 'Abraham',

            ],
            [
                'nom' => 'Noe',

            ],
            [
                'nom' => 'Sarah',

            ],
        ];

        foreach ($classes as $classe) {
            DB::table('classes')->insertOrIgnore([
                'nom' => $classe['nom'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Classes de l\'église importées avec succès!');
    }
}
