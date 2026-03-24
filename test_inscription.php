<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$lastInscription = \App\Models\Inscription::latest('id')->first();
echo "Dernière inscription ID: {$lastInscription->id}\n";
echo "Type: {$lastInscription->type}\n";
echo "responsable_employment_status: " . ($lastInscription->responsable_employment_status ?? 'NULL') . "\n";
echo "responsable_profession: " . ($lastInscription->responsable_profession ?? 'NULL') . "\n";
echo "responsable_lien_parente: " . ($lastInscription->responsable_lien_parente ?? 'NULL') . "\n";

if (is_array($lastInscription->data) && !empty($lastInscription->data['responsable'])) {
    echo "JSON responsable keys: " . implode(', ', array_keys($lastInscription->data['responsable'])) . "\n";
    if (!empty($lastInscription->data['responsable']['employment_status'])) {
        echo "JSON employment_status: " . $lastInscription->data['responsable']['employment_status'] . "\n";
    }
}
echo "\n=== First 5 inscriptions summary ===\n";
$inscriptions = \App\Models\Inscription::latest('id')->limit(5)->get();
foreach ($inscriptions as $insc) {
    echo "ID {$insc->id}: employment=" . ($insc->responsable_employment_status ?? 'NULL') . " profession=" . ($insc->responsable_profession ?? 'NULL') . "\n";
}
