<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * Récupère les photos de membres de l'ancienne plateforme "metholiste" (/metho/)
 * — table rnm_membres.photo_url + fichiers uploads/membres/ — et les rattache aux
 * utilisateurs de la nouvelle plateforme (users.photo_path).
 *
 * Appariement par défaut : users.code_membre = rnm_membres.code_membre, avec
 * contrôle du nom (désactivable via --loose). Les cas douteux sont consignés
 * dans storage/app/legacy-photos-review.csv et NON rattachés.
 *
 * Prérequis (.env) — connexion LECTURE SEULE vers l'ancienne base :
 *   METHO_LEGACY_DB_HOST, METHO_LEGACY_DB_DATABASE, METHO_LEGACY_DB_USERNAME, METHO_LEGACY_DB_PASSWORD
 */
class ImportLegacyMemberPhotos extends Command
{
    protected $signature = 'photos:import-legacy
        {--dry-run : Simule : ne copie aucun fichier et n\'écrit pas en base}
        {--source=fs : Origine des fichiers : "fs" (copie locale) ou "http" (téléchargement)}
        {--legacy-uploads= : (source=fs) Dossier contenant les fichiers membre_*.jpg. Défaut : ../metholiste/uploads/membres}
        {--http-base=https://emjubilecocody.org/metho : (source=http) URL de base de l\'ancienne plateforme}
        {--match=code : Clé d\'appariement : "code" (code_membre) ou "email"}
        {--loose : (match=code) Ne pas exiger que le nom corresponde}
        {--only-missing : Ignorer les utilisateurs qui ont déjà une photo}
        {--limit=0 : Limiter le nombre de photos traitées (0 = toutes)}
        {--connection=metho_legacy : Nom de la connexion vers l\'ancienne base}';

    protected $description = 'Importe les photos de membres de l\'ancienne plateforme (metholiste) vers users.photo_path';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $source = $this->option('source');
        $match = $this->option('match');
        $loose = (bool) $this->option('loose');
        $onlyMissing = (bool) $this->option('only-missing');
        $limit = (int) $this->option('limit');
        $connection = $this->option('connection');

        if (!in_array($source, ['fs', 'http'], true)) {
            $this->error('--source doit valoir "fs" ou "http".');
            return self::FAILURE;
        }
        if (!in_array($match, ['code', 'email'], true)) {
            $this->error('--match doit valoir "code" ou "email".');
            return self::FAILURE;
        }

        $legacyUploads = rtrim(
            (string) ($this->option('legacy-uploads') ?: base_path('../metholiste/uploads/membres')),
            '/'
        );
        $httpBase = rtrim((string) $this->option('http-base'), '/');

        try {
            $rows = DB::connection($connection)
                ->table('rnm_membres')
                ->whereNull('deleted_at')
                ->whereNotNull('photo_url')
                ->where('photo_url', '<>', '')
                ->get(['id', 'code_membre', 'nom', 'prenoms', 'email', 'photo_url']);
        } catch (QueryException $e) {
            $this->error("Impossible de lire l'ancienne base via la connexion « {$connection} » : " . $e->getMessage());
            $this->line('Renseigne METHO_LEGACY_DB_* dans .env (host, database, username, password).');
            return self::FAILURE;
        }

        if ($limit > 0) {
            $rows = $rows->take($limit);
        }

        $this->info("{$rows->count()} membre(s) legacy avec une photo à traiter.");
        if ($dryRun) {
            $this->warn('MODE SIMULATION (--dry-run) : aucune écriture.');
        }

        $stats = [
            'linked' => 0,
            'no_match' => 0,
            'name_mismatch' => 0,
            'skipped_existing' => 0,
            'file_missing' => 0,
            'copy_error' => 0,
        ];
        $review = [];
        $bar = $this->output->createProgressBar($rows->count());
        $bar->start();

        foreach ($rows as $row) {
            $bar->advance();

            $basename = basename((string) (parse_url((string) $row->photo_url, PHP_URL_PATH) ?: $row->photo_url));
            if ($basename === '' || $basename === '.' || $basename === '..') {
                $stats['file_missing']++;
                $review[] = [$row->code_membre, $row->nom, $row->prenoms, 'photo_url illisible', $row->photo_url];
                continue;
            }

            // ── Résolution de l'utilisateur cible ─────────────────────────────
            $user = null;
            if ($match === 'code' && trim((string) $row->code_membre) !== '') {
                $user = User::query()->where('code_membre', trim((string) $row->code_membre))->first();
            } elseif ($match === 'email' && trim((string) $row->email) !== '') {
                $user = User::query()
                    ->whereRaw('LOWER(TRIM(email)) = ?', [mb_strtolower(trim((string) $row->email))])
                    ->first();
            }

            if (!$user) {
                $stats['no_match']++;
                $review[] = [$row->code_membre, $row->nom, $row->prenoms, 'aucun utilisateur correspondant', $basename];
                continue;
            }

            if ($match === 'code' && !$loose && !$this->namesMatch($user->nom, $row->nom)) {
                $stats['name_mismatch']++;
                $review[] = [
                    $row->code_membre,
                    "legacy: {$row->nom} {$row->prenoms}",
                    "nouveau: {$user->nom} {$user->prenom}",
                    'code identique mais nom différent (non rattaché, relancer avec --loose si OK)',
                    $basename,
                ];
                continue;
            }

            if ($onlyMissing && trim((string) $user->photo_path) !== '') {
                $stats['skipped_existing']++;
                continue;
            }

            // ── Récupération des octets de l'image ────────────────────────────
            $bytes = null;
            if ($source === 'fs') {
                $srcFile = $legacyUploads . '/' . $basename;
                if (is_file($srcFile)) {
                    $bytes = file_get_contents($srcFile) ?: null;
                }
            } else {
                $url = $httpBase . '/uploads/membres/' . rawurlencode($basename);
                $response = Http::withOptions(['verify' => true])->timeout(20)->get($url);
                if ($response->ok() && $response->body() !== '') {
                    $bytes = $response->body();
                }
            }

            if ($bytes === null) {
                $stats['file_missing']++;
                $review[] = [$row->code_membre, $row->nom, $row->prenoms, 'fichier image introuvable', $basename];
                continue;
            }

            // ── Copie + rattachement ─────────────────────────────────────────
            $ext = pathinfo($basename, PATHINFO_EXTENSION) ?: 'jpg';
            $safeCode = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $user->code_membre) ?: (string) $user->id;
            $dest = 'photos/users/legacy_' . $safeCode . '_' . $row->id . '.' . strtolower($ext);

            if (!$dryRun) {
                try {
                    Storage::disk('public')->put($dest, $bytes);
                    $user->forceFill([
                        'photo_path' => $dest,
                        'profile_photo_url' => null,
                    ])->save();
                } catch (\Throwable $e) {
                    $stats['copy_error']++;
                    $review[] = [$row->code_membre, $row->nom, $row->prenoms, 'erreur copie : ' . $e->getMessage(), $basename];
                    continue;
                }
            }

            $stats['linked']++;
        }

        $bar->finish();
        $this->newLine(2);

        $this->table(
            ['Résultat', 'Nombre'],
            [
                ['Photos rattachées' . ($dryRun ? ' (simulé)' : ''), $stats['linked']],
                ['Aucun utilisateur correspondant', $stats['no_match']],
                ['Code identique mais nom différent', $stats['name_mismatch']],
                ['Ignorés (photo déjà présente)', $stats['skipped_existing']],
                ['Fichier image introuvable', $stats['file_missing']],
                ['Erreurs de copie', $stats['copy_error']],
            ]
        );

        if ($review !== []) {
            $csv = "code_membre;colonne_2;colonne_3;motif;fichier\n";
            foreach ($review as $line) {
                $csv .= implode(';', array_map(
                    fn ($v) => '"' . str_replace('"', '""', (string) $v) . '"',
                    $line
                )) . "\n";
            }
            Storage::disk('local')->put('legacy-photos-review.csv', $csv);
            $this->warn('Cas à vérifier consignés : storage/app/private/legacy-photos-review.csv (' . count($review) . ' ligne(s)).');
        }

        return self::SUCCESS;
    }

    /**
     * Comparaison souple de deux noms de famille (casse, accents, espaces).
     */
    private function namesMatch(?string $a, ?string $b): bool
    {
        return $this->normalize($a) !== '' && $this->normalize($a) === $this->normalize($b);
    }

    private function normalize(?string $value): string
    {
        $value = mb_strtolower(trim((string) $value));
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if (is_string($ascii) && $ascii !== '') {
            $value = $ascii;
        }
        $value = preg_replace('/[^a-z0-9]+/', ' ', $value) ?? $value;

        return trim(preg_replace('/\s+/', ' ', $value) ?? $value);
    }
}
