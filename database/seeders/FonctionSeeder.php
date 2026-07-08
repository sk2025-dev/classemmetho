<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FonctionSeeder extends Seeder
{
    public function run(): void
    {
        $fonctions = [
            'Choriste',
            'Conducteur',
            'Conseiller',
            'Instrumentiste',
            'Maitre de Choeur',
            'Membre',
            'Membre COCOM',
            'Membre groupe musicale',
            'Moniteur',
            'Monitrice',
            'Pasteur Principal',
            'Pianniste',
            'Predicateurs',
            'Président COMEFA',
            'Président COMITE EGLISE',
            'Président des Conducteurs',
            'Président des Laïcs',
            'Président des Prédicateurs',
            'Protocole',
            'Responsable FIMECO',
            'Responsable Morev',
            'Responsable enfants',
            'Responsable femmes',
            'Responsable groupe musicale',
            'Responsable jeunesse',
            'Secretaire',
            'SOCIETE',
            'Tresorier',
            'Vice Président des Laïcs',
        ];

        $now = now();
        $rows = array_map(fn($nom) => [
            'nom'        => $nom,
            'description' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ], $fonctions);

        DB::table('fonctions')->insertOrIgnore($rows);

        $this->command->info(count($fonctions) . ' fonctions insérées (doublons ignorés).');
    }
}
