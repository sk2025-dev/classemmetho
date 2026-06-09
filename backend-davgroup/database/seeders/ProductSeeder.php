<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\Category;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = Category::all();

        $products = [
            // Soins Capillaires
            [
                'category_id' => 1,
                'name' => 'Shampooing Hydratant',
                'slug' => Str::slug('Shampooing Hydratant'),
                'description' => 'Shampooing riche en vitamines pour cheveux secs',
                'price' => 15.99,
                'cost' => 8.50,
                'quantity' => 50,
                'min_quantity' => 10,
                'sku' => 'SHAMP-001',
                'is_active' => true,
            ],
            [
                'category_id' => 1,
                'name' => 'Après-Shampooing Nourrissant',
                'slug' => Str::slug('Après-Shampooing Nourrissant'),
                'description' => 'Après-shampooing pour cheveux crépus',
                'price' => 13.99,
                'cost' => 7.00,
                'quantity' => 45,
                'min_quantity' => 10,
                'sku' => 'CONDITIONER-001',
                'is_active' => true,
            ],
            [
                'category_id' => 1,
                'name' => 'Masque Capillaire Intensif',
                'slug' => Str::slug('Masque Capillaire Intensif'),
                'description' => 'Masque réparateur pour cheveux abîmés',
                'price' => 18.99,
                'cost' => 10.00,
                'quantity' => 35,
                'min_quantity' => 8,
                'sku' => 'MASK-001',
                'is_active' => true,
            ],
            // Cosmétiques
            [
                'category_id' => 2,
                'name' => 'Fond de Teint Longue Tenue',
                'slug' => Str::slug('Fond de Teint Longue Tenue'),
                'description' => 'Fond de teint waterproof 24h',
                'price' => 25.99,
                'cost' => 12.00,
                'quantity' => 60,
                'min_quantity' => 15,
                'sku' => 'FOUNDATION-001',
                'is_active' => true,
            ],
            [
                'category_id' => 2,
                'name' => 'Rouge à Lèvres Velours',
                'slug' => Str::slug('Rouge à Lèvres Velours'),
                'description' => 'Rouge à lèvres mat haute définition',
                'price' => 12.99,
                'cost' => 5.50,
                'quantity' => 80,
                'min_quantity' => 20,
                'sku' => 'LIPSTICK-001',
                'is_active' => true,
            ],
            [
                'category_id' => 2,
                'name' => 'Palette de Fards à Paupières',
                'slug' => Str::slug('Palette de Fards à Paupières'),
                'description' => 'Palette 12 couleurs nude et bronze',
                'price' => 22.99,
                'cost' => 10.00,
                'quantity' => 40,
                'min_quantity' => 10,
                'sku' => 'EYESHADOW-001',
                'is_active' => true,
            ],
            // Soins SPA
            [
                'category_id' => 3,
                'name' => 'Gel de Massage Relaxant',
                'slug' => Str::slug('Gel de Massage Relaxant'),
                'description' => 'Gel apaisant pour massage corporel',
                'price' => 19.99,
                'cost' => 9.50,
                'quantity' => 55,
                'min_quantity' => 12,
                'sku' => 'MASSAGE-001',
                'is_active' => true,
            ],
            [
                'category_id' => 3,
                'name' => 'Savon Exfoliant Naturel',
                'slug' => Str::slug('Savon Exfoliant Naturel'),
                'description' => 'Savon bio-exfoliant aux grains naturels',
                'price' => 8.99,
                'cost' => 3.50,
                'quantity' => 100,
                'min_quantity' => 25,
                'sku' => 'SOAP-001',
                'is_active' => true,
            ],
            [
                'category_id' => 3,
                'name' => 'Huile Corporelle Hydratante',
                'slug' => Str::slug('Huile Corporelle Hydratante'),
                'description' => 'Huile légère pour peaux sèches',
                'price' => 24.99,
                'cost' => 11.00,
                'quantity' => 38,
                'min_quantity' => 10,
                'sku' => 'OIL-001',
                'is_active' => true,
            ],
            // Accessoires
            [
                'category_id' => 4,
                'name' => 'Brosse Plate Premium',
                'slug' => Str::slug('Brosse Plate Premium'),
                'description' => 'Brosse plate pour lissage professionnel',
                'price' => 16.99,
                'cost' => 7.50,
                'quantity' => 25,
                'min_quantity' => 5,
                'sku' => 'BRUSH-001',
                'is_active' => true,
            ],
            [
                'category_id' => 4,
                'name' => 'Serre-Tête Éponge Colorée',
                'slug' => Str::slug('Serre-Tête Éponge Colorée'),
                'description' => 'Serre-tête confortable assortis',
                'price' => 5.99,
                'cost' => 2.00,
                'quantity' => 150,
                'min_quantity' => 30,
                'sku' => 'HEADBAND-001',
                'is_active' => true,
            ],
            // Coiffage
            [
                'category_id' => 5,
                'name' => 'Spray Coiffant Léger',
                'slug' => Str::slug('Spray Coiffant Léger'),
                'description' => 'Spray pour fixer sans résidu',
                'price' => 10.99,
                'cost' => 5.00,
                'quantity' => 70,
                'min_quantity' => 15,
                'sku' => 'SPRAY-001',
                'is_active' => true,
            ],
            [
                'category_id' => 5,
                'name' => 'Cire Coiffante Forte Tenue',
                'slug' => Str::slug('Cire Coiffante Forte Tenue'),
                'description' => 'Cire pour cheveux courts et texturés',
                'price' => 14.99,
                'cost' => 6.50,
                'quantity' => 45,
                'min_quantity' => 10,
                'sku' => 'WAX-001',
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(
                ['slug' => $product['slug']],
                $product,
            );
        }
    }
}
