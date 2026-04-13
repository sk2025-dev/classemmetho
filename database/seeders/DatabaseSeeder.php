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
        $seedReferenceData = filter_var(env('SEED_REFERENCE_DATA', false), FILTER_VALIDATE_BOOL);
        $seedDemoData = filter_var(env('SEED_DEMO_DATA', false), FILTER_VALIDATE_BOOL);

        if ($seedReferenceData) {
            $this->call([
                AdminSeeder::class,
                VillesSeeder::class,
                ClassesSeeder::class,
                FonctionSeeder::class,
            ]);
            $this->command->info('Données de référence seedées.');
        }

        if ($seedDemoData) {
            $this->call([
                TresorerieSeeder::class,
                SondageDemoSeeder::class,
            ]);
            $this->command->info('Données de démo seedées.');
        }

        if (!$seedReferenceData && !$seedDemoData) {
            $this->command->info('Aucune donnée seedée (mode données réelles).');
        }
    }
}
