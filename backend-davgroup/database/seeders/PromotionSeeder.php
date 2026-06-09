<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Promotion;
use Carbon\Carbon;

class PromotionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = Product::take(5)->get();

        $promotions = [];

        // Promotion 1: Réduction de 20% sur le Shampooing
        $promotions[] = [
            'product_id' => $products[0]->id,
            'title' => 'Promo Shampooing',
            'description' => '20% de réduction sur le shampooing hydratant',
            'discount_type' => 'percentage',
            'discount_value' => 20,
            'start_date' => Carbon::now(),
            'end_date' => Carbon::now()->addDays(7),
            'quantity_limit' => 100,
            'quantity_used' => 0,
            'is_active' => true,
        ];

        // Promotion 2: 3€ de réduction sur l'Après-Shampooing
        $promotions[] = [
            'product_id' => $products[1]->id,
            'title' => 'Offre Après-Shampooing',
            'description' => '3€ de réduction',
            'discount_type' => 'fixed',
            'discount_value' => 3.00,
            'start_date' => Carbon::now(),
            'end_date' => Carbon::now()->addDays(14),
            'quantity_limit' => 150,
            'quantity_used' => 0,
            'is_active' => true,
        ];

        // Promotion 3: 15% de réduction sur le Masque Capillaire
        $promotions[] = [
            'product_id' => $products[2]->id,
            'title' => 'Solde Masque Capillaire',
            'description' => 'Réduction de 15% ce mois-ci',
            'discount_type' => 'percentage',
            'discount_value' => 15,
            'start_date' => Carbon::now()->subDays(5),
            'end_date' => Carbon::now()->addDays(10),
            'quantity_limit' => null,
            'quantity_used' => 0,
            'is_active' => true,
        ];

        // Promotion 4: Offre future (commence demain)
        $promotions[] = [
            'product_id' => $products[3]->id,
            'title' => 'Promo à venir',
            'description' => 'Réduction de 25% demain',
            'discount_type' => 'percentage',
            'discount_value' => 25,
            'start_date' => Carbon::now()->addDay(),
            'end_date' => Carbon::now()->addDays(8),
            'quantity_limit' => 50,
            'quantity_used' => 0,
            'is_active' => false,
        ];

        // Promotion 5: Offre expirée
        $promotions[] = [
            'product_id' => $products[4]->id,
            'title' => 'Promo terminée',
            'description' => 'Réduction de 10%',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'start_date' => Carbon::now()->subDays(15),
            'end_date' => Carbon::now()->subDays(3),
            'quantity_limit' => 200,
            'quantity_used' => 50,
            'is_active' => true,
        ];

        foreach ($promotions as $promotion) {
            Promotion::updateOrCreate(
                [
                    'product_id' => $promotion['product_id'],
                    'title' => $promotion['title'],
                ],
                $promotion,
            );
        }
    }
}
