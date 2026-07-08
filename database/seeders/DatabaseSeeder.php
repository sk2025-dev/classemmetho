<?php

namespace Database\Seeders;

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
        $seedMetho1Jubile = filter_var(env('SEED_METHO1_JUBILE_SNAPSHOT', false), FILTER_VALIDATE_BOOL);
        $seedReferenceData = filter_var(env('SEED_REFERENCE_DATA', false), FILTER_VALIDATE_BOOL);
        $seedDemoData = filter_var(env('SEED_DEMO_DATA', false), FILTER_VALIDATE_BOOL);

        if ($seedMetho1Jubile) {
            $this->call(Metho1JubileSnapshotSeeder::class);
            $this->command->info('Import complet metho1_jubile terminé (dump SQL). Les autres seeders sont ignorés pour éviter les doublons.');

            return;
        }

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

        if (! $seedReferenceData && ! $seedDemoData) {
            $this->command->info('Aucune donnée seedée (mode données réelles).');
        }
    }
}
