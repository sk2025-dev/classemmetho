<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Soins Capillaires',
                'description' => 'Produits pour l\'entretien et le soin des cheveux',
                'slug' => Str::slug('Soins Capillaires'),
            ],
            [
                'name' => 'Cosmétiques',
                'description' => 'Produits de beauté et cosmétiques',
                'slug' => Str::slug('Cosmétiques'),
            ],
            [
                'name' => 'Soins SPA',
                'description' => 'Produits de spa et relaxation',
                'slug' => Str::slug('Soins SPA'),
            ],
            [
                'name' => 'Accessoires',
                'description' => 'Accessoires de coiffure et beauté',
                'slug' => Str::slug('Accessoires'),
            ],
            [
                'name' => 'Coiffage',
                'description' => 'Produits de coiffage et styling',
                'slug' => Str::slug('Coiffage'),
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                $category,
            );
        }
    }
}
