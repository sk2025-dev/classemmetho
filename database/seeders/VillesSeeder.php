<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VillesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Remplit la table villes avec toutes les communes/villes de Côte d'Ivoire
     */
    public function run(): void
    {
        $villes = [
            // DISTRICT AUTONOME D'ABIDJAN
            ['nom' => 'Abidjan'],
            ['nom' => 'Adjamé'],
            ['nom' => 'Abobo'],
            ['nom' => 'Plateaux'],
            ['nom' => 'Cocody'],
            ['nom' => 'Yopougon'],
            ['nom' => 'Marcory'],
            ['nom' => 'Treichville'],
            ['nom' => 'Port-Bouët'],
            ['nom' => 'Attécoubé'],

            // DISTRICT DU HAUT-SASSANDRA
            ['nom' => 'Sassandra'],
            ['nom' => 'Tabou'],
            ['nom' => 'Guéyo'],
            ['nom' => 'Issia'],
            ['nom' => 'Soubré'],
            ['nom' => 'Saïoua'],
            ['nom' => 'Oumé'],

            // DISTRICT DE SAN-PÉDRO
            ['nom' => 'San-Pédro'],
            ['nom' => 'Tiassalé'],
            ['nom' => 'Grebo'],
            ['nom' => 'Azaguié'],

            // RÉGION DES SAVANES
            ['nom' => 'Korhogo'],
            ['nom' => 'Ferké'],
            ['nom' => 'Odienné'],
            ['nom' => 'Boundiali'],
            ['nom' => 'Katiola'],
            ['nom' => 'Sinématiali'],
            ['nom' => 'Dikodougou'],

            // RÉGION DU Nord
            ['nom' => 'Bouna'],
            ['nom' => 'Bondoukou'],
            ['nom' => 'Nassian'],
            ['nom' => 'DoropoR'],

            // RÉGION DU NORD-EST
            ['nom' => 'Gagnoa'],
            ['nom' => 'Bongouanou'],
            ['nom' => 'Dimbokro'],
            ['nom' => 'Adzopé'],

            // RÉGION DE LA MARAHOUÉ
            ['nom' => 'Yamoussoukro'],
            ['nom' => 'Tiébissou'],
            ['nom' => 'Toumodi'],

            // RÉGION DE LA COMOÉ
            ['nom' => 'Abengourou'],
            ['nom' => 'Aboisso'],
            ['nom' => 'Agnibilékrou'],

            // RÉGION DE L'INDÉNIÉ-DJUABLIN
            ['nom' => 'Yamoussoukro Centre'],

            // RÉGION DE LA VALLÉE DU BANDAMA
            ['nom' => 'Bouaké'],
            ['nom' => 'Sakassou'],
            ['nom' => 'Béoumi'],
            ['nom' => 'Botro'],
            ['nom' => 'Nzi-Comoé'],
            ['nom' => 'Buyo'],
        ];

        // Insérer les villes dans la base de données
        foreach ($villes as $ville) {
            DB::table('villes')->insertOrIgnore([
                'nom' => $ville['nom'],
            ]);
        }

        $this->command->info('Villes et communes de Côte d\'Ivoire importées avec succès!');
    }
}
