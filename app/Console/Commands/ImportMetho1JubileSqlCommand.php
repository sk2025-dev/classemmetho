<?php

namespace App\Console\Commands;

use App\Support\Metho1JubileSqlImporter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;

class ImportMetho1JubileSqlCommand extends Command
{
    protected $signature = 'db:import-metho1-jubile
                            {--path= : Chemin absolu vers le fichier .sql}
                            {--connection= : Connexion Laravel (mysql/mariadb)}
                            {--force : Ne pas demander de confirmation}';

    protected $description = 'Importe le dump MySQL metho1_jubile (structure, index, contraintes et données)';

    public function handle(): int
    {
        $path = $this->option('path') ?: Config::get('database.metho1_jubile_snapshot.path');
        $connection = $this->option('connection') ?: null;

        if (! $this->option('force')) {
            $confirmed = $this->confirm(
                'Ce dump exécute CREATE TABLE, INSERT et ALTER (clés étrangères). '.
                'Sur une base déjà migrée, des erreurs « table exists » sont probables. '.
                'Préférez une base vide ou importez hors Laravel (mysql client). Continuer ?',
                false
            );
            if (! $confirmed) {
                $this->info('Import annulé.');

                return self::SUCCESS;
            }
        }

        try {
            Metho1JubileSqlImporter::importFromPath($path, $connection);
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info('Import terminé.');

        return self::SUCCESS;
    }
}
