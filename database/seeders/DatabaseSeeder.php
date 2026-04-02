<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Remplir les données de référence
        $this->call([
            AdminSeeder::class,
            VillesSeeder::class,
            ClassesSeeder::class,
            FonctionSeeder::class,
            TresorerieSeeder::class,
            SondageDemoSeeder::class,
        ]);


        $this->command->info('Base de données remplie avec succès!');
    }
}
