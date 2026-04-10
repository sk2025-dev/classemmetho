<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SpecialEvent;
use Carbon\Carbon;

class PastActivitiesSeeder extends Seeder
{
    public function run()
    {
        // Pour la classe ID 1 (ajustez selon votre besoin)
        $classId = 1;
        $userId = 1; // ID du conducteur
        
        $pastActivities = [
            [
                'title' => 'Étude biblique - La foi',
                'date' => Carbon::now()->subDays(30)->format('Y-m-d'),
                'time' => '18:30',
                'orateur' => 'Frère Jean',
                'moderateur' => 'Frère Pierre',
                'famille_reception' => 'Famille Koné',
                'lieu' => 'Salle 101',
            ],
            [
                'title' => 'Réunion de prière',
                'date' => Carbon::now()->subDays(25)->format('Y-m-d'),
                'time' => '19:00',
                'orateur' => 'Pasteur Marc',
                'moderateur' => 'Frère André',
                'famille_reception' => 'Famille Kouadio',
                'lieu' => 'Église centrale',
            ],
            [
                'title' => 'Culte d\'adoration',
                'date' => Carbon::now()->subDays(20)->format('Y-m-d'),
                'time' => '10:00',
                'orateur' => 'Pasteur David',
                'moderateur' => 'Sœur Marie',
                'famille_reception' => 'Famille Yao',
                'lieu' => 'Grand temple',
            ],
            [
                'title' => 'Étude biblique - Les paraboles',
                'date' => Carbon::now()->subDays(15)->format('Y-m-d'),
                'time' => '18:30',
                'orateur' => 'Frère Thomas',
                'moderateur' => 'Frère Luc',
                'famille_reception' => 'Famille N\'Guessan',
                'lieu' => 'Salle 102',
            ],
            [
                'title' => 'Réunion de jeunesse',
                'date' => Carbon::now()->subDays(10)->format('Y-m-d'),
                'time' => '19:00',
                'orateur' => 'Conducteur Paul',
                'moderateur' => 'Sœur Julie',
                'famille_reception' => 'Famille Kouakou',
                'lieu' => 'Salle polyvalente',
            ],
            [
                'title' => 'Culte dominical',
                'date' => Carbon::now()->subDays(7)->format('Y-m-d'),
                'time' => '09:00',
                'orateur' => 'Pasteur Emmanuel',
                'moderateur' => 'Frère Simon',
                'famille_reception' => 'Famille Aka',
                'lieu' => 'Église centrale',
            ],
            [
                'title' => 'Étude biblique - Le Saint-Esprit',
                'date' => Carbon::now()->subDays(5)->format('Y-m-d'),
                'time' => '18:30',
                'orateur' => 'Frère Jacques',
                'moderateur' => 'Frère Étienne',
                'famille_reception' => 'Famille Bamba',
                'lieu' => 'Salle 103',
            ],
            [
                'title' => 'Nuit de prière',
                'date' => Carbon::now()->subDays(3)->format('Y-m-d'),
                'time' => '20:00',
                'orateur' => 'Pasteur Samuel',
                'moderateur' => 'Frère Joseph',
                'famille_reception' => 'Famille Traoré',
                'lieu' => 'Sanctuaire',
            ],
        ];
        
        foreach ($pastActivities as $activity) {
            SpecialEvent::create([
                'title' => $activity['title'],
                'date' => $activity['date'],
                'time' => $activity['time'],
                'orateur' => $activity['orateur'],
                'moderateur' => $activity['moderateur'],
                'famille_reception' => $activity['famille_reception'],
                'lieu' => $activity['lieu'],
                'class_id' => $classId,
                'created_by' => $userId,
                'is_parish' => false,
            ]);
        }
        
        $this->command->info('8 activités passées créées avec succès !');
    }
}