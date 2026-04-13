<?php

namespace App\Console\Commands;

use App\Models\Inscription;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class NormalizePhotoStorage extends Command
{
    protected $signature = 'photos:normalize-storage {--dry-run : Simuler sans ecrire de changements}';

    protected $description = 'Uniformiser les photos dans storage/app/public/photos/users et corriger les chemins en base';

    private array $movedMap = [];

    private int $movedFiles = 0;
    private int $reusedFiles = 0;
    private int $missingFiles = 0;
    private int $updatedUsers = 0;
    private int $updatedInscriptions = 0;
    private int $updatedJsonEntries = 0;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info('=== NORMALISATION DES PHOTOS ===');
        $this->line('Mode: ' . ($dryRun ? 'DRY-RUN (aucune ecriture)' : 'EXECUTION REELLE'));

        $this->normalizeUsers($dryRun);
        $this->normalizeInscriptions($dryRun);

        $this->newLine();
        $this->info('=== RESUME ===');
        $this->line('Fichiers deplaces: ' . $this->movedFiles);
        $this->line('Fichiers deja reutilisables: ' . $this->reusedFiles);
        $this->line('Fichiers introuvables: ' . $this->missingFiles);
        $this->line('Users mis a jour: ' . $this->updatedUsers);
        $this->line('Inscriptions mises a jour: ' . $this->updatedInscriptions);
        $this->line('Entrees JSON corrigees: ' . $this->updatedJsonEntries);

        if ($dryRun) {
            $this->warn('Simulation terminee. Lancez sans --dry-run pour appliquer.');
        }

        return self::SUCCESS;
    }

    private function normalizeUsers(bool $dryRun): void
    {
        $this->newLine();
        $this->info('--- USERS ---');

        User::query()->orderBy('id')->chunkById(200, function ($users) use ($dryRun) {
            foreach ($users as $user) {
                $originalPhotoPath = $user->photo_path;
                $originalProfileUrl = $user->profile_photo_url;

                $sourcePath = $this->normalizeToDiskPath($user->photo_path)
                    ?? $this->normalizeToDiskPath($user->profile_photo_url);

                if (!$sourcePath) {
                    continue;
                }

                $finalPath = $this->relocateToUnifiedFolder($sourcePath, $dryRun);
                $finalUrl = '/storage/' . ltrim($finalPath, '/');

                $shouldUpdate = false;
                if ($originalPhotoPath !== $finalPath) {
                    $user->photo_path = $finalPath;
                    $shouldUpdate = true;
                }

                if ($originalProfileUrl !== $finalUrl) {
                    $user->profile_photo_url = $finalUrl;
                    $shouldUpdate = true;
                }

                if ($shouldUpdate) {
                    $this->updatedUsers++;
                    $this->line("USER#{$user->id} -> {$finalPath}");
                    if (!$dryRun) {
                        $user->save();
                    }
                }
            }
        });
    }

    private function normalizeInscriptions(bool $dryRun): void
    {
        $this->newLine();
        $this->info('--- INSCRIPTIONS ---');

        Inscription::query()->orderBy('id')->chunkById(100, function ($inscriptions) use ($dryRun) {
            foreach ($inscriptions as $inscription) {
                $changed = false;

                $photoPathSource = $this->normalizeToDiskPath($inscription->photo_path)
                    ?? $this->normalizeToDiskPath($inscription->profile_photo_url);

                if ($photoPathSource) {
                    $finalPath = $this->relocateToUnifiedFolder($photoPathSource, $dryRun);
                    $finalUrl = '/storage/' . ltrim($finalPath, '/');

                    if ($inscription->photo_path !== $finalPath) {
                        $inscription->photo_path = $finalPath;
                        $changed = true;
                    }

                    if ($inscription->profile_photo_url !== $finalUrl) {
                        $inscription->profile_photo_url = $finalUrl;
                        $changed = true;
                    }
                }

                $data = $inscription->data;
                if (is_array($data)) {
                    $jsonChanged = $this->normalizeInscriptionData($data, $dryRun);
                    if ($jsonChanged) {
                        $inscription->data = $data;
                        $changed = true;
                        $this->updatedJsonEntries += $jsonChanged;
                    }
                }

                if ($changed) {
                    $this->updatedInscriptions++;
                    $this->line("INSCRIPTION#{$inscription->id} corrigee");
                    if (!$dryRun) {
                        $inscription->save();
                    }
                }
            }
        });
    }

    private function normalizeInscriptionData(array &$data, bool $dryRun): int
    {
        $changes = 0;

        if (isset($data['responsable']) && is_array($data['responsable'])) {
            $changes += $this->normalizePhotoContainer($data['responsable'], $dryRun);
        }

        if (isset($data['membres']) && is_array($data['membres'])) {
            foreach ($data['membres'] as $index => $membre) {
                if (!is_array($membre)) {
                    continue;
                }

                $delta = $this->normalizePhotoContainer($membre, $dryRun);
                if ($delta > 0) {
                    $data['membres'][$index] = $membre;
                    $changes += $delta;
                }
            }
        }

        return $changes;
    }

    private function normalizePhotoContainer(array &$node, bool $dryRun): int
    {
        $source = $this->normalizeToDiskPath($node['photo_path'] ?? null)
            ?? $this->normalizeToDiskPath($node['profile_photo_url'] ?? null)
            ?? $this->normalizeToDiskPath($node['photo_url'] ?? null)
            ?? $this->normalizeToDiskPath($node['photo'] ?? null);

        if (!$source) {
            return 0;
        }

        $finalPath = $this->relocateToUnifiedFolder($source, $dryRun);
        $finalUrl = '/storage/' . ltrim($finalPath, '/');

        $changed = 0;

        if (($node['photo_path'] ?? null) !== $finalPath) {
            $node['photo_path'] = $finalPath;
            $changed++;
        }

        if (array_key_exists('profile_photo_url', $node) && ($node['profile_photo_url'] ?? null) !== $finalUrl) {
            $node['profile_photo_url'] = $finalUrl;
            $changed++;
        }

        if (array_key_exists('photo_url', $node) && ($node['photo_url'] ?? null) !== $finalUrl) {
            $node['photo_url'] = $finalUrl;
            $changed++;
        }

        if (array_key_exists('photo', $node) && is_string($node['photo'] ?? null)) {
            if (!str_starts_with((string) $node['photo'], 'http://') && !str_starts_with((string) $node['photo'], 'https://')) {
                if (($node['photo'] ?? null) !== $finalUrl) {
                    $node['photo'] = $finalUrl;
                    $changed++;
                }
            }
        }

        return $changed;
    }

    private function relocateToUnifiedFolder(string $path, bool $dryRun): string
    {
        $normalized = ltrim($path, '/');

        if (isset($this->movedMap[$normalized])) {
            return $this->movedMap[$normalized];
        }

        if (str_starts_with($normalized, 'photos/users/')) {
            $this->movedMap[$normalized] = $normalized;
            return $normalized;
        }

        $target = $this->buildUniqueTargetPath($normalized);

        if (!Storage::disk('public')->exists($normalized)) {
            if (Storage::disk('public')->exists($target)) {
                $this->reusedFiles++;
                $this->movedMap[$normalized] = $target;
                return $target;
            }

            $this->missingFiles++;
            $this->warn("Fichier introuvable: {$normalized}");
            $this->movedMap[$normalized] = $normalized;
            return $normalized;
        }

        $this->movedMap[$normalized] = $target;

        if ($dryRun) {
            $this->line("[DRY-RUN] MOVE {$normalized} -> {$target}");
            $this->movedFiles++;
            return $target;
        }

        Storage::disk('public')->makeDirectory('photos/users');
        Storage::disk('public')->move($normalized, $target);
        $this->line("MOVE {$normalized} -> {$target}");
        $this->movedFiles++;

        return $target;
    }

    private function buildUniqueTargetPath(string $sourcePath): string
    {
        $baseName = pathinfo($sourcePath, PATHINFO_FILENAME);
        $extension = pathinfo($sourcePath, PATHINFO_EXTENSION);
        $suffix = '';

        $candidate = 'photos/users/' . $baseName . ($extension !== '' ? '.' . $extension : '');

        $counter = 1;
        while (Storage::disk('public')->exists($candidate)) {
            $suffix = '_' . $counter;
            $candidate = 'photos/users/' . $baseName . $suffix . ($extension !== '' ? '.' . $extension : '');
            $counter++;
        }

        return $candidate;
    }

    private function normalizeToDiskPath(?string $value): ?string
    {
        if (!$value || !is_string($value)) {
            return null;
        }

        $value = trim($value);
        if ($value === '' || strtolower($value) === 'null' || strtolower($value) === 'undefined') {
            return null;
        }

        if (str_contains($value, '://')) {
            $parsed = parse_url($value);
            $path = $parsed['path'] ?? null;
            if (!$path || !str_contains($path, '/storage/')) {
                return null;
            }

            return ltrim(substr($path, strpos($path, '/storage/') + strlen('/storage/')), '/');
        }

        if (str_starts_with($value, '/storage/')) {
            return ltrim(substr($value, strlen('/storage/')), '/');
        }

        if (str_starts_with($value, 'storage/')) {
            return ltrim(substr($value, strlen('storage/')), '/');
        }

        if (str_starts_with($value, 'public/')) {
            return ltrim(substr($value, strlen('public/')), '/');
        }

        return ltrim($value, '/');
    }
}
