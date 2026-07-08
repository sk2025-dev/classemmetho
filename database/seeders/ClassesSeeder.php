<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Classe;

class ClassesSeeder extends Seeder
{
    public function run(): void
    {
        $classes = [
            'BETHANIE',
            'ISRAEL',
            'NOUVELLE JERUSALEM',
            'BETHEL',
            'BETHESDA',
            'SHEKINA',
            'CITE DE GRACE',
            'BERAKA',
            'SION',
            'SILOE',
            'CANAAN',
        ];

        foreach ($classes as $nom) {
            Classe::firstOrCreate(['nom' => $nom]);
        }

        $this->command->info(count($classes) . ' classes traitées (doublons ignorés).');
    }
}
