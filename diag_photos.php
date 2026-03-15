<?php
// Script de diagnostic photos
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->boot();

use App\Models\User;
use App\Models\Inscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

echo "=== DIAGNOSTIC PHOTOS ===\n\n";

// 1. Valeurs brutes en DB pour users
echo "--- USERS (5 premiers avec photo) ---\n";
$users = DB::table('users')
    ->whereNotNull('photo_path')
    ->orWhereNotNull('profile_photo_url')
    ->limit(5)
    ->get(['id', 'nom', 'prenom', 'photo_path', 'profile_photo_url']);

foreach ($users as $u) {
    echo "ID:{$u->id} | nom:{$u->nom} {$u->prenom}\n";
    echo "  photo_path: " . ($u->photo_path ?? 'NULL') . "\n";
    echo "  profile_photo_url: " . ($u->profile_photo_url ?? 'NULL') . "\n";
    // Vérifier si le fichier existe
    if ($u->photo_path) {
        $exists = Storage::disk('public')->exists($u->photo_path);
        echo "  fichier existe (storage/public): " . ($exists ? 'OUI' : 'NON') . "\n";
    }
    echo "\n";
}

// 2. Stats globales
echo "--- STATISTIQUES ---\n";
$totalUsers = DB::table('users')->count();
$withPhotoPath = DB::table('users')->whereNotNull('photo_path')->count();
$withProfileUrl = DB::table('users')->whereNotNull('profile_photo_url')->count();
$withAbsoluteUrl = DB::table('users')->where('profile_photo_url', 'LIKE', 'http%')->count();
$withRelativeUrl = DB::table('users')->where('profile_photo_url', 'LIKE', '/storage/%')->count();

echo "Total users: $totalUsers\n";
echo "Avec photo_path: $withPhotoPath\n";
echo "Avec profile_photo_url: $withProfileUrl\n";
echo "  -> URLs absolues (http://...): $withAbsoluteUrl\n";
echo "  -> URLs relatives (/storage/...): $withRelativeUrl\n\n";

// 3. APP_URL
echo "--- CONFIGURATION ---\n";
echo "APP_URL: " . config('app.url') . "\n";
echo "APP_ENV: " . config('app.env') . "\n\n";

// 4. Vérifier le lien symbolique storage
echo "--- STOCKAGE ---\n";
$publicStoragePath = public_path('storage');
echo "public/storage existe: " . (file_exists($publicStoragePath) ? 'OUI' : 'NON') . "\n";
echo "public/storage est un lien: " . (is_link($publicStoragePath) ? 'OUI' : 'NON') . "\n";
if (is_link($publicStoragePath)) {
    echo "Pointe vers: " . readlink($publicStoragePath) . "\n";
}

// 5. Exemples d'inscriptions
echo "\n--- INSCRIPTIONS (3 premières avec photo) ---\n";
$inscriptions = DB::table('inscriptions')
    ->whereNotNull('photo_path')
    ->orWhereNotNull('profile_photo_url')
    ->limit(3)
    ->get(['id', 'responsable_nom', 'responsable_prenom', 'photo_path', 'profile_photo_url']);

foreach ($inscriptions as $i) {
    echo "ID:{$i->id} | {$i->responsable_nom} {$i->responsable_prenom}\n";
    echo "  photo_path: " . ($i->photo_path ?? 'NULL') . "\n";
    echo "  profile_photo_url: " . ($i->profile_photo_url ?? 'NULL') . "\n";
    echo "\n";
}

echo "=== FIN DIAGNOSTIC ===\n";
