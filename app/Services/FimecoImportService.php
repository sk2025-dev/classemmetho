<?php

namespace App\Services;

use App\Models\Classe;
use App\Models\Cotisation;
use App\Models\Family;
use App\Models\FimecoSouscription;
use App\Models\Paiement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class FimecoImportService
{
    private const MAX_ERRORS_REPORTED = 200;
    private const MIN_ANNEE = 1900;
    private const MAX_ANNEE = 2100;

    /**
     * Importe le fichier "Etat souscription par famille.xlsx" : une ligne = le montant
     * souscrit par une famille pour une année donnée.
     */
    public function importSouscriptions(UploadedFile $file, User $importer): array
    {
        $rows = $this->readSheet($file, ['Souscription annuelle', 'Souscriptions', 'Souscription']);

        $result = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        $classeCache = [];

        DB::transaction(function () use ($rows, $importer, &$result, &$classeCache) {
            foreach ($rows as $index => $row) {
                $line = $index + 2; // +1 pour l'index 0-based, +1 pour la ligne d'en-tête

                $rawCode = trim((string) ($row['Chef familleID'] ?? ''));
                $chefNom = trim((string) ($row['Chef famille::Chef de Famille'] ?? ''));
                $annee = (int) ($row['Annee'] ?? 0);
                $montant = (int) round((float) ($row['Montant souscription annuelle'] ?? 0));

                if ($rawCode === '' || $montant <= 0) {
                    $result['skipped']++;
                    $this->addError($result, $line, $rawCode, $chefNom, $annee, 'Ligne incomplète (code famille ou montant manquant/invalide)');
                    continue;
                }

                if ($annee < self::MIN_ANNEE || $annee > self::MAX_ANNEE) {
                    $result['skipped']++;
                    $this->addError($result, $line, $rawCode, $chefNom, $annee, "Année invalide dans le fichier ({$annee})");
                    continue;
                }

                $familyId = $this->resolveFamilyId($rawCode);
                if (!$familyId) {
                    $result['skipped']++;
                    $this->addError($result, $line, $rawCode, $chefNom, $annee, 'Famille introuvable (code famille inconnu)');
                    continue;
                }

                $classeName = trim((string) ($row['Classe Methodiste::Nom Classe'] ?? ''));
                $classeId = $this->resolveClasseId($classeName, $classeCache);

                $souscription = FimecoSouscription::query()->updateOrCreate(
                    ['family_id' => $familyId, 'annee' => $annee],
                    [
                        'classe_id' => $classeId,
                        'montant_souscrit' => $montant,
                        'created_by' => $importer->id,
                    ]
                );

                if ($souscription->wasRecentlyCreated) {
                    $result['created']++;
                } else {
                    $result['updated']++;
                }
            }
        });

        return $result;
    }

    /**
     * Importe le fichier "Etat des versements annuels par famille.xlsx" : une ligne =
     * un versement réel effectué par une famille pour la FIMECO d'une année donnée.
     */
    public function importVersements(UploadedFile $file, User $importer): array
    {
        $cotisation = Cotisation::query()
            ->whereRaw('LOWER(nom) LIKE ?', ['%fimeco%'])
            ->first();

        if (!$cotisation) {
            return [
                'created' => 0,
                'duplicates' => 0,
                'skipped' => 0,
                'errors' => [[
                    'line' => null,
                    'chef_famille_id' => null,
                    'chef_nom' => null,
                    'annee' => null,
                    'reason' => "Aucune cotisation FIMECO n'existe. Créez-la avant d'importer les versements.",
                ]],
            ];
        }

        $rows = $this->readSheet($file, ['Suivi des versements annuels', 'Versements annuels', 'Versements']);

        $result = [
            'created' => 0,
            'duplicates' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        $occurrences = [];

        DB::transaction(function () use ($rows, $importer, $cotisation, &$result, &$occurrences) {
            foreach ($rows as $index => $row) {
                $line = $index + 2;

                $rawCode = trim((string) ($row['Chef FamilleID'] ?? ''));
                $chefNom = trim((string) ($row['Chef famille::Chef de Famille'] ?? ''));
                $annee = (int) ($row['Annee souscription'] ?? 0);
                $montant = (int) round((float) ($row['Montant versement'] ?? 0));
                $dateRaw = $row['Date Versement'] ?? null;

                if ($rawCode === '' || $montant <= 0) {
                    $result['skipped']++;
                    $this->addError($result, $line, $rawCode, $chefNom, $annee, 'Ligne incomplète (code famille ou montant manquant/invalide)');
                    continue;
                }

                if ($annee < self::MIN_ANNEE || $annee > self::MAX_ANNEE) {
                    $result['skipped']++;
                    $this->addError($result, $line, $rawCode, $chefNom, $annee, "Année invalide dans le fichier ({$annee})");
                    continue;
                }

                $familyId = $this->resolveFamilyId($rawCode);
                if (!$familyId) {
                    $result['skipped']++;
                    $this->addError($result, $line, $rawCode, $chefNom, $annee, 'Famille introuvable (code famille inconnu)');
                    continue;
                }

                $date = $this->parseExcelDate($dateRaw);
                if (!$date) {
                    $result['skipped']++;
                    $this->addError($result, $line, $rawCode, $chefNom, $annee, 'Date de versement manquante ou invalide');
                    continue;
                }

                [$mode, $note] = $this->normalizeModePaiement($row['Mode paiement'] ?? null);

                $key = $familyId . '|' . $date . '|' . $montant . '|' . $mode;
                $occurrences[$key] = ($occurrences[$key] ?? 0) + 1;
                $reference = 'FIMECO-' . $familyId . '-' . str_replace('-', '', $date) . '-' . $montant . '-' . $mode . '-' . $occurrences[$key];

                $paiement = Paiement::query()->firstOrCreate(
                    ['reference_recu' => $reference],
                    [
                        'family_id' => $familyId,
                        'cotisation_id' => $cotisation->id,
                        'montant' => $montant,
                        'year' => $annee,
                        'mode_paiement' => $mode,
                        'date_paiement' => $date,
                        'statut' => Paiement::STATUT_PAYE,
                        'note' => $note,
                    ]
                );

                if ($paiement->wasRecentlyCreated) {
                    $result['created']++;
                } else {
                    $result['duplicates']++;
                }
            }
        });

        return $result;
    }

    /**
     * Résout l'id de famille par correspondance exacte (trim + upper) sur code_famille.
     * Pas de correction/normalisation du code (préfixe CF, matching flou, ...).
     */
    private function resolveFamilyId(string $rawCode): ?int
    {
        $code = strtoupper(trim($rawCode));
        if ($code === '' || $code === 'NONE') {
            return null;
        }

        return Family::query()->where('code_famille', $code)->value('id');
    }

    private function resolveClasseId(string $classeName, array &$cache): ?int
    {
        if ($classeName === '') {
            return null;
        }

        $key = mb_strtolower($classeName);
        if (array_key_exists($key, $cache)) {
            return $cache[$key];
        }

        $classeId = Classe::query()->whereRaw('LOWER(nom) = ?', [$key])->value('id');
        $cache[$key] = $classeId;

        return $classeId;
    }

    /**
     * Normalise une valeur brute de mode de paiement vers un des modes officiels du
     * système. Toute valeur non reconnue (vide, aberrante) retombe sur ESPECES avec
     * une note conservant la valeur d'origine pour traçabilité.
     *
     * @return array{0: string, 1: ?string}
     */
    private function normalizeModePaiement(mixed $raw): array
    {
        $rawStr = trim((string) $raw);
        $normalized = mb_strtolower($this->stripAccents($rawStr));

        if (str_contains($normalized, 'espec')) {
            return [Paiement::MODE_ESPECES, null];
        }
        if (str_contains($normalized, 'virement')) {
            return [Paiement::MODE_VIREMENT, null];
        }
        if (str_contains($normalized, 'cheq')) {
            return [Paiement::MODE_CHEQUE, null];
        }
        if (str_contains($normalized, 'mobile') || str_contains($normalized, 'momo')
            || str_contains($normalized, 'orange') || str_contains($normalized, 'wave')
            || str_contains($normalized, 'mtn')) {
            return [Paiement::MODE_MOBILE_MONEY, null];
        }

        $note = $rawStr !== ''
            ? "Mode d'origine (import) : {$rawStr}"
            : "Mode de paiement non précisé dans le fichier importé";

        return [Paiement::MODE_ESPECES, $note];
    }

    private function stripAccents(string $value): string
    {
        $accents = ['à', 'â', 'ä', 'á', 'è', 'ê', 'ë', 'é', 'ì', 'î', 'ï', 'í', 'ò', 'ô', 'ö', 'ó', 'ù', 'û', 'ü', 'ú', 'ç', 'ñ'];
        $ascii = ['a', 'a', 'a', 'a', 'e', 'e', 'e', 'e', 'i', 'i', 'i', 'i', 'o', 'o', 'o', 'o', 'u', 'u', 'u', 'u', 'c', 'n'];

        return str_replace($accents, $ascii, $value);
    }

    private function parseExcelDate(mixed $dateValue): ?string
    {
        if (empty($dateValue)) {
            return null;
        }

        try {
            if ($dateValue instanceof \DateTimeInterface) {
                return $dateValue->format('Y-m-d');
            }

            if (is_numeric($dateValue)) {
                return ExcelDate::excelToDateTimeObject((float) $dateValue)->format('Y-m-d');
            }

            if (is_string($dateValue)) {
                foreach (['Y-m-d', 'd/m/Y', 'd-m-Y', 'Y/m/d', 'd.m.Y'] as $pattern) {
                    $date = Carbon::createFromFormat($pattern, $dateValue);
                    if ($date) {
                        return $date->format('Y-m-d');
                    }
                }

                return Carbon::parse($dateValue)->format('Y-m-d');
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }

    private function addError(array &$result, int $line, string $chefFamilleId, string $chefNom, ?int $annee, string $reason): void
    {
        if (count($result['errors']) >= self::MAX_ERRORS_REPORTED) {
            return;
        }

        $result['errors'][] = [
            'line' => $line,
            'chef_famille_id' => $chefFamilleId,
            'chef_nom' => $chefNom,
            'annee' => $annee,
            'reason' => $reason,
        ];
    }

    /**
     * Charge la première feuille correspondant à un des noms attendus (recherche
     * souple, insensible à la casse/espaces), sinon la première feuille du classeur.
     * Retourne les lignes indexées par en-tête de colonne (texte exact des en-têtes).
     */
    private function readSheet(UploadedFile $file, array $sheetNameCandidates): array
    {
        // Ces fichiers historiques comptent plusieurs milliers de lignes : on relève
        // les limites par défaut et on désactive le chargement des styles (non
        // nécessaire ici) pour réduire fortement l'empreinte mémoire du parsing.
        @ini_set('memory_limit', '512M');
        set_time_limit(180);

        $reader = IOFactory::createReaderForFile($file->getRealPath());
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($file->getRealPath());

        $sheet = null;
        foreach ($sheetNameCandidates as $candidate) {
            foreach ($spreadsheet->getSheetNames() as $actualName) {
                if ($this->normalizeSheetName($actualName) === $this->normalizeSheetName($candidate)) {
                    $sheet = $spreadsheet->getSheetByName($actualName);
                    break 2;
                }
            }
        }

        $worksheet = $sheet ?? $spreadsheet->getSheet(0);

        // formatData=false : on récupère les valeurs brutes (les cellules de date
        // restent des numéros sériels Excel, gérés par parseExcelDate()).
        $rows = $worksheet->toArray(null, true, false, false);
        if (empty($rows)) {
            return [];
        }

        $headers = array_map(fn ($h) => trim((string) $h), array_shift($rows));

        $data = [];
        foreach ($rows as $row) {
            $rowData = [];
            foreach ($headers as $colIndex => $header) {
                if ($header === '') {
                    continue;
                }
                $rowData[$header] = $row[$colIndex] ?? null;
            }
            if (array_filter($rowData, fn ($v) => $v !== null && $v !== '')) {
                $data[] = $rowData;
            }
        }

        return $data;
    }

    private function normalizeSheetName(string $name): string
    {
        return mb_strtolower(preg_replace('/[\s_-]/', '', $name));
    }
}
