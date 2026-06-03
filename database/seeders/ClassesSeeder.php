<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ClassesSeeder extends Seeder
{
    /**
     * Les classes méthodistes proviennent de l'import Excel (getClasseId → firstOrCreate).
     * Ce seeder ne pré-insère rien pour éviter les doublons avec les données réelles.
     */
    public function run(): void
    {
        $this->command->info('ClassesSeeder : aucune classe pré-insérée — les classes sont créées automatiquement lors de l\'import Excel.');
    }
}
