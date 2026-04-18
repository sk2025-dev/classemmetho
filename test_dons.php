<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Don;

// Vérifier le nombre de dons
$countDons = Don::count();
echo "Nombre total de dons: $countDons\n";

if ($countDons === 0) {
    echo "Aucun don trouvé! Exécution du seeder...\n";
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\Seeders\TresorerieSeeder']);
    $countDons = Don::count();
    echo "Après seeder: $countDons dons\n";
}

// Afficher les premiers dons
$dons = Don::with(['family:id,nom', 'user:id,prenom,nom,classe_id', 'user.classe:id,nom'])
    ->orderByDesc('date_don')
    ->take(5)
    ->get();

echo "\n--- Premiers dons ---\n";
foreach ($dons as $don) {
    echo sprintf(
        "ID: %d | Donateur: %s | Montant: %d | Date: %s | Trésorier: %s %s | Classe: %s\n",
        $don->id,
        $don->family?->nom ?? 'N/A',
        $don->montant,
        $don->date_don?->format('d/m/Y') ?? 'N/A',
        $don->user?->prenom ?? '',
        $don->user?->nom ?? '',
        $don->user?->classe?->nom ?? 'N/A'
    );
}
