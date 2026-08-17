<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\UserSacrement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class FixStatutMaritalFromExcel extends Command
{
    protected $signature = 'app:fix-statut-marital
                            {file=Excel/familles_membres_03mai26.xlsx : Chemin du fichier Excel, relatif à la racine du projet}
                            {--sheet=Membre : Nom de la feuille contenant les membres}
                            {--dry-run : Simule sans écrire en base}';

    protected $description = 'Corrige le statut matrimonial (user_sacrements) à partir du fichier Excel des membres, sans toucher aux autres champs';

    public function handle(): int
    {
        $path = base_path($this->argument('file'));

        if (! file_exists($path)) {
            $this->error("Fichier introuvable : {$path}");

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $sheetName = $this->option('sheet');

        $spreadsheet = IOFactory::load($path);
        $sheet = $spreadsheet->getSheetByName($sheetName);

        if (! $sheet) {
            $this->error("Feuille « {$sheetName} » introuvable dans le fichier.");

            return self::FAILURE;
        }

        $rows = $sheet->toArray(null, true, true, true);

        $stats = [
            'total' => 0,
            'sans_valeur' => 0,
            'introuvable' => 0,
            'mis_a_jour' => 0,
            'inchange' => 0,
        ];

        DB::beginTransaction();

        foreach ($rows as $i => $row) {
            if ($i === 1) {
                continue; // en-tête
            }

            $code = trim((string) ($row['C'] ?? ''));
            $statut = trim((string) ($row['O'] ?? ''));

            if ($code === '') {
                continue;
            }

            $stats['total']++;

            if ($statut === '') {
                $stats['sans_valeur']++;

                continue;
            }

            $user = User::where('code_membre', $code)->first();

            if (! $user) {
                $stats['introuvable']++;
                $this->line("  · CODE_MEMBRE introuvable : {$code}");

                continue;
            }

            $normalized = $this->stripAccents(mb_strtolower($statut));

            $flags = [
                'est_marie' => str_contains($normalized, 'mari'),
                'est_divorce' => str_contains($normalized, 'divorc'),
                'est_veuf' => str_contains($normalized, 'veuf') || str_contains($normalized, 'veuve'),
                'dot_effectue' => str_contains($normalized, 'dot'),
            ];

            $existing = UserSacrement::where('user_id', $user->id)->first();
            $before = $existing ? [
                'est_marie' => (bool) $existing->est_marie,
                'est_divorce' => (bool) $existing->est_divorce,
                'est_veuf' => (bool) $existing->est_veuf,
                'dot_effectue' => (bool) $existing->dot_effectue,
            ] : ['est_marie' => false, 'est_divorce' => false, 'est_veuf' => false, 'dot_effectue' => false];

            if ($before === $flags) {
                $stats['inchange']++;

                continue;
            }

            if (! $dryRun) {
                UserSacrement::updateOrCreate(['user_id' => $user->id], $flags);
            }

            $stats['mis_a_jour']++;
            $this->line("  · {$code} ({$user->nom} {$user->prenom}) : \"{$statut}\" -> ".json_encode($flags));
        }

        if ($dryRun) {
            DB::rollBack();
            $this->warn('Mode --dry-run : aucune modification écrite en base.');
        } else {
            DB::commit();
        }

        $this->newLine();
        $this->info('Résumé :');
        $this->table(['Indicateur', 'Valeur'], collect($stats)->map(fn ($v, $k) => [$k, $v])->values()->all());

        return self::SUCCESS;
    }

    private function stripAccents(string $value): string
    {
        $replacements = [
            'à' => 'a', 'â' => 'a', 'ä' => 'a',
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'î' => 'i', 'ï' => 'i',
            'ô' => 'o', 'ö' => 'o',
            'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c',
        ];

        return strtr($value, $replacements);
    }
}
