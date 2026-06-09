<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BeautyService;

class BeautyServiceSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'section_key' => 'rendezvous',
                'category_key' => 'coiffure',
                'title' => 'Micro-twist',
                'subtitle' => null,
                'duration' => '11H30',
                'price' => '35 000 FCFA',
                'image_path' => null,
                'sort_order' => 1,
            ],
            [
                'section_key' => 'rendezvous',
                'category_key' => 'coiffure',
                'title' => 'Tresse enfant',
                'subtitle' => null,
                'duration' => '3H',
                'price' => '25 000 FCFA',
                'image_path' => null,
                'sort_order' => 2,
            ],
            [
                'section_key' => 'rendezvous',
                'category_key' => 'ongerie',
                'title' => 'Pose gel simple',
                'subtitle' => null,
                'duration' => '1H30',
                'price' => '24 000 FCFA',
                'image_path' => null,
                'sort_order' => 10,
            ],
            [
                'section_key' => 'rendezvous',
                'category_key' => 'spa',
                'title' => 'Massage relaxant',
                'subtitle' => null,
                'duration' => '1H30',
                'price' => '38 000 FCFA',
                'image_path' => null,
                'sort_order' => 20,
            ],
            [
                'section_key' => 'rendezvous',
                'category_key' => 'conseil',
                'title' => 'Conseil beauté',
                'subtitle' => null,
                'duration' => '1H',
                'price' => '20 000 FCFA',
                'image_path' => null,
                'sort_order' => 30,
            ],
        ];

        foreach ($items as $item) {
            BeautyService::updateOrCreate(
                [
                    'section_key' => $item['section_key'],
                    'category_key' => $item['category_key'],
                    'title' => $item['title'],
                ],
                $item,
            );
        }
    }
}
