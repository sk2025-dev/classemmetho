<?php

namespace Database\Seeders;

use App\Support\Metho1JubileSqlImporter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Config;

/**
 * Importe le fichier {@see config('database.metho1_jubile_snapshot.path')} (export phpMyAdmin complet).
 *
 * Activez avec SEED_METHO1_JUBILE_SNAPSHOT=true dans .env.
 * Recommandation : base MySQL vide ; sinon utilisez php artisan db:import-metho1-jubile avec précaution.
 */
class Metho1JubileSnapshotSeeder extends Seeder
{
    public function run(): void
    {
        $path = Config::get('database.metho1_jubile_snapshot.path');

        Metho1JubileSqlImporter::importFromPath($path);

        $this->command?->info('Snapshot metho1_jubile importé depuis : '.$path);
    }
}
