<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Rdv;

class RdvSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rdvs = [
            [
                'client_name' => 'Fatou Diallo',
                'client_email' => '',
                'client_phone' => '+225 05 44 33 22 11',
                'appointment_date' => '2026-05-22 10:00:00',
                'service' => 'Tresses africaines',
                'notes' => null,
                'status' => 'confirmed',
                'duration' => '180',
                'is_notified' => false,
            ],
            [
                'client_name' => "Aïssatou Koné",
                'client_email' => 'aissatou@gmail.com',
                'client_phone' => '+225 07 11 22 33 44',
                'appointment_date' => '2026-05-21 14:00:00',
                'service' => 'Soin visage éclat',
                'notes' => null,
                'status' => 'pending',
                'duration' => '60',
                'is_notified' => false,
            ],
        ];

        foreach ($rdvs as $r) {
            Rdv::create($r);
        }
    }
}
