<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DiagPhotos extends Command
{
    protected $signature = 'diag:photos {--fix : Corriger les URLs absolues en URLs relatives}';
    protected $description = 'Diagnostic (et correction) du système de photos';

    public function handle()
    {
        $this->info('=== DIAGNOSTIC PHOTOS ===');

        // Vérifier si la colonne profile_photo_url existe sur users
        $userColumns = \Illuminate\Support\Facades\Schema::getColumnListing('users');
        $hasProfilePhotoUrl = in_array('profile_photo_url', $userColumns);

        $this->info('--- COLONNES USERS ---');
        $this->line("photo_path: " . (in_array('photo_path', $userColumns) ? '✓ existe' : '✗ MANQUANTE'));
        $this->line("profile_photo_url: " . ($hasProfilePhotoUrl ? '✓ existe' : '✗ MANQUANTE ← PROBLÈME'));

        if (!$hasProfilePhotoUrl) {
            $this->error("La colonne profile_photo_url n'existe pas dans users !");
            $this->warn("Lancez: php artisan migrate");
            return 1;
        }

        // 1. Stats
        $this->info('--- STATISTIQUES USERS ---');
        $totalUsers = DB::table('users')->count();
        $withPhotoPath = DB::table('users')->whereNotNull('photo_path')->where('photo_path', '!=', '')->count();
        $withProfileUrl = DB::table('users')->whereNotNull('profile_photo_url')->where('profile_photo_url', '!=', '')->count();
        $withAbsoluteUrl = DB::table('users')->where('profile_photo_url', 'LIKE', 'http%')->count();
        $withRelativeUrl = DB::table('users')->where('profile_photo_url', 'LIKE', '/storage/%')->count();

        $this->line("Total users: $totalUsers");
        $this->line("Avec photo_path: $withPhotoPath");
        $this->line("Avec profile_photo_url: $withProfileUrl");
        $this->line("  -> URLs absolues (http://...): $withAbsoluteUrl");
        $this->line("  -> URLs relatives (/storage/...): $withRelativeUrl");

        // 2. Quelques exemples
        $this->info('--- EXEMPLES USERS (5 avec photo) ---');
        $users = DB::table('users')
            ->where(function ($q) {
                $q->whereNotNull('photo_path')->orWhereNotNull('profile_photo_url');
            })
            ->where('photo_path', '!=', '')->limit(5)->get(['id', 'nom', 'prenom', 'photo_path', 'profile_photo_url']);

        foreach ($users as $u) {
            $this->line("ID:{$u->id} | {$u->nom} {$u->prenom}");
            $this->line("  photo_path: " . ($u->photo_path ?? 'NULL'));
            $this->line("  profile_photo_url: " . ($u->profile_photo_url ?? 'NULL'));
            if ($u->photo_path) {
                $exists = Storage::disk('public')->exists($u->photo_path);
                $this->line("  fichier sur disque: " . ($exists ? '✓ OUI' : '✗ NON'));
            }
        }

        // 3. Lien symbolique
        $this->info('--- STOCKAGE ---');
        $link = public_path('storage');
        $this->line("public/storage existe: " . (file_exists($link) ? 'OUI' : 'NON'));
        $this->line("public/storage est symlink: " . (is_link($link) ? 'OUI' : 'NON'));
        if (is_link($link)) {
            $this->line("Symlink pointe vers: " . readlink($link));
        }

        // 4. Fichiers photo réels
        $this->info('--- FICHIERS SUR DISQUE ---');
        $files = Storage::disk('public')->files('profiles');
        $this->line('Fichiers dans profiles/: ' . count($files));
        foreach (array_slice($files, 0, 5) as $f) {
            $this->line("  $f");
        }
        $files2 = Storage::disk('public')->files('photos/users');
        $this->line('Fichiers dans photos/users/: ' . count($files2));

        // 5. APP_URL
        $this->info('--- CONFIG ---');
        $this->line("APP_URL: " . config('app.url'));
        $this->line("APP_ENV: " . config('app.env'));

        // 6. Inscriptions
        $this->info('--- INSCRIPTIONS ---');
        $countAbsInscriptions = DB::table('inscriptions')->where('profile_photo_url', 'LIKE', 'http%')->count();
        $this->line("Inscriptions avec URL absolue: $countAbsInscriptions");

        if ($this->option('fix')) {
            $this->fixAbsoluteUrls();
        } else {
            if ($withAbsoluteUrl > 0 || $countAbsInscriptions > 0) {
                $this->warn("→ Des URLs absolues existent. Lancez: php artisan diag:photos --fix");
            }
        }

        $this->info('=== FIN ===');
    }

    private function fixAbsoluteUrls(): void
    {
        $this->info('--- CORRECTION DES URLs ABSOLUES ---');

        // Corriger users
        $users = DB::table('users')
            ->where('profile_photo_url', 'LIKE', 'http%')
            ->get(['id', 'profile_photo_url']);

        $fixed = 0;
        foreach ($users as $u) {
            $relative = $this->toRelativeUrl($u->profile_photo_url);
            if ($relative) {
                DB::table('users')->where('id', $u->id)->update(['profile_photo_url' => $relative]);
                $fixed++;
            }
        }
        $this->line("Users corrigés: $fixed / " . count($users));

        // Corriger inscriptions
        $inscriptions = DB::table('inscriptions')
            ->where('profile_photo_url', 'LIKE', 'http%')
            ->get(['id', 'profile_photo_url']);

        $fixedInsc = 0;
        foreach ($inscriptions as $i) {
            $relative = $this->toRelativeUrl($i->profile_photo_url);
            if ($relative) {
                DB::table('inscriptions')->where('id', $i->id)->update(['profile_photo_url' => $relative]);
                $fixedInsc++;
            }
        }
        $this->line("Inscriptions corrigées: $fixedInsc / " . count($inscriptions));

        $this->info('Correction terminée !');
    }

    /**
     * Convertit une URL absolue de storage en chemin relatif /storage/...
     * Ex: "http://localhost/storage/profiles/photo.jpg" → "/storage/profiles/photo.jpg"
     */
    private function toRelativeUrl(string $url): ?string
    {
        if (str_contains($url, '/storage/')) {
            $pos = strpos($url, '/storage/');
            return substr($url, $pos); // → "/storage/profiles/photo.jpg"
        }
        return null;
    }
}
