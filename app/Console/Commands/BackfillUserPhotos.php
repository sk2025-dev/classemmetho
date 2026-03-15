<?php

namespace App\Console\Commands;

use App\Models\Inscription;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class BackfillUserPhotos extends Command
{
    protected $signature = 'app:backfill-user-photos';
    protected $description = 'Rattacher les photos des inscriptions aux utilisateurs qui ont photo_path NULL';

    public function handle()
    {
        $usersWithoutPhoto = User::whereNull('photo_path')->get();
        $this->info("Utilisateurs sans photo: {$usersWithoutPhoto->count()}");

        $fixed = 0;
        $notFound = 0;

        foreach ($usersWithoutPhoto as $user) {
            $photoPath = $this->findPhotoForUser($user);

            if ($photoPath && Storage::disk('public')->exists($photoPath)) {
                $user->update(['photo_path' => $photoPath]);
                $this->line("  ✅ USER#{$user->id} ({$user->prenom} {$user->nom}) → {$photoPath}");
                $fixed++;
            } else if ($photoPath) {
                // Path found in DB but file missing on disk
                $this->warn("  ⚠️  USER#{$user->id} ({$user->prenom} {$user->nom}) → {$photoPath} (fichier absent)");
                $notFound++;
            } else {
                $this->line("  ❌ USER#{$user->id} ({$user->prenom} {$user->nom}) → aucune photo trouvée");
                $notFound++;
            }
        }

        $this->newLine();
        $this->info("Résultat: {$fixed} corrigés, {$notFound} sans photo disponible.");
    }

    private function findPhotoForUser(User $user): ?string
    {
        // Chercher dans les inscriptions approuvées liées à ce user
        $inscriptions = Inscription::where('status', 'approuve')->get();

        foreach ($inscriptions as $inscription) {
            $data = $inscription->data;

            // Vérifier si c'est le responsable
            $respNom = $inscription->responsable_nom ?? ($data['responsable']['nom'] ?? null);
            $respPrenom = $inscription->responsable_prenom ?? ($data['responsable']['prenom'] ?? null);

            if ($this->matchesUser($user, $respNom, $respPrenom)) {
                // Photo du responsable
                $path = $this->resolvePhotoPath($inscription->photo_path)
                    ?? $this->resolvePhotoPath($inscription->profile_photo_url)
                    ?? $this->resolvePhotoPath($data['responsable']['photo_path'] ?? null)
                    ?? $this->resolvePhotoPath($data['responsable']['photo_url'] ?? null);

                if ($path) return $path;
            }

            // Chercher dans les membres
            if (isset($data['membres']) && is_array($data['membres'])) {
                foreach ($data['membres'] as $membre) {
                    $memNom = $membre['nom'] ?? null;
                    $memPrenom = $membre['prenom'] ?? null;

                    if ($this->matchesUser($user, $memNom, $memPrenom)) {
                        $path = $this->resolvePhotoPath($membre['photo_path'] ?? null)
                            ?? $this->resolvePhotoPath($membre['photo_url'] ?? null)
                            ?? $this->resolvePhotoPath($membre['photo'] ?? null);

                        if ($path) return $path;
                    }
                }
            }
        }

        return null;
    }

    private function matchesUser(User $user, ?string $nom, ?string $prenom): bool
    {
        if (!$nom || !$prenom) return false;
        return mb_strtolower(trim($user->nom)) === mb_strtolower(trim($nom))
            && mb_strtolower(trim($user->prenom)) === mb_strtolower(trim($prenom));
    }

    private function resolvePhotoPath(?string $value): ?string
    {
        if (!$value || !is_string($value) || trim($value) === '') return null;

        $value = trim($value);

        // URL complète → extraire le chemin relatif
        if (str_contains($value, '://')) {
            $parsed = parse_url($value);
            if (isset($parsed['path']) && str_contains($parsed['path'], '/storage/')) {
                return ltrim(substr($parsed['path'], strpos($parsed['path'], '/storage/') + strlen('/storage/')), '/');
            }
            return null;
        }

        if (str_starts_with($value, '/storage/')) {
            return ltrim(substr($value, strlen('/storage/')), '/');
        }

        if (str_starts_with($value, 'storage/')) {
            return ltrim(substr($value, strlen('storage/')), '/');
        }

        return ltrim($value, '/');
    }
}
