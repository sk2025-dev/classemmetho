<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FonctionSeeder extends Seeder
{
    /**
     * Les fonctions d'église proviennent de l'import Excel (getFonctionId → firstOrCreate).
     * Ce seeder ne pré-insère rien pour éviter les doublons avec les données réelles.
     */
    public function run(): void
    {
        $this->command->info('FonctionSeeder : aucune fonction pré-insérée — les fonctions sont créées automatiquement lors de l\'import Excel.');
    }
}
