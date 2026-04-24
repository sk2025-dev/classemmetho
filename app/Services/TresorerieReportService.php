<?php

namespace App\Services;

use App\Models\Don;
use App\Models\Paiement;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use InvalidArgumentException;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TresorerieReportService
{
    public function resolvePeriod(
        string $scope = 'monthly',
        ?string $month = null,
        ?int $year = null,
        ?CarbonImmutable $now = null
    ): array {
        $now ??= CarbonImmutable::now();

        if ($scope === 'annual') {
            $resolvedYear = $year ?: (int) $now->year;
            $start = CarbonImmutable::create($resolvedYear, 1, 1, 0, 0, 0)->startOfDay();
            $end = $start->endOfYear();

            return [
                'scope' => 'annual',
                'title' => 'Rapport annuel',
                'label' => 'Annee ' . $resolvedYear,
                'slug' => (string) $resolvedYear,
                'start' => $start,
                'end' => $end,
                'start_display' => $start->format('d/m/Y'),
                'end_display' => $end->format('d/m/Y'),
            ];
        }

        if ($scope !== 'monthly') {
            throw new InvalidArgumentException('Unsupported treasury report scope.');
        }

        $resolvedMonth = $month ?: $now->format('Y-m');
        $start = CarbonImmutable::createFromFormat('Y-m', $resolvedMonth);

        if (! $start) {
            throw new InvalidArgumentException('Invalid month format. Expected Y-m.');
        }

        $start = $start->startOfMonth();
        $end = $start->endOfMonth();

        return [
            'scope' => 'monthly',
            'title' => 'Rapport mensuel',
            'label' => ucfirst($start->locale('fr')->translatedFormat('F Y')),
            'slug' => $start->format('Y-m'),
            'start' => $start,
            'end' => $end,
            'start_display' => $start->format('d/m/Y'),
            'end_display' => $end->format('d/m/Y'),
        ];
    }

    public function buildReport(array $period): array
    {
        $startDate = $period['start']->toDateString();
        $endDate = $period['end']->toDateString();

        $paiements = Paiement::query()
            ->with([
                'family:id,nom,classe_id',
                'family.classe:id,nom',
                'user:id,prenom,nom,classe_id',
                'user.classe:id,nom',
                'cotisation:id,nom',
            ])
            ->whereBetween('date_paiement', [$startDate, $endDate])
            ->orderBy('date_paiement')
            ->orderBy('id')
            ->get()
            ->map(fn(Paiement $paiement) => $this->mapPaiement($paiement))
            ->values();

        $dons = Don::query()
            ->with([
                'family:id,nom,classe_id',
                'family.classe:id,nom',
                'user:id,prenom,nom,classe_id',
                'user.classe:id,nom',
                'campagne:id,titre,classe_id',
                'campagne.classe:id,nom',
            ])
            ->whereBetween('date_don', [$startDate, $endDate])
            ->orderBy('date_don')
            ->orderBy('id')
            ->get()
            ->map(fn(Don $don) => $this->mapDon($don))
            ->values();

        $classes = $this->buildClassesSummary($paiements, $dons);

        $famillesDistinctes = $paiements
            ->pluck('famille')
            ->merge($dons->pluck('famille'))
            ->filter(fn($value) => filled($value) && $value !== 'Famille inconnue')
            ->unique()
            ->count();

        $classesDistinctes = $classes->count();

        return [
            'meta' => [
                ...$period,
                'generated_at_display' => now()->format('d/m/Y H:i'),
            ],
            'summary' => [
                'total_paiements' => (int) $paiements->sum('montant'),
                'total_dons' => (int) $dons->sum('montant'),
                'total_general' => (int) ($paiements->sum('montant') + $dons->sum('montant')),
                'nombre_paiements' => $paiements->count(),
                'nombre_dons' => $dons->count(),
                'familles_distinctes' => $famillesDistinctes,
                'classes_distinctes' => $classesDistinctes,
            ],
            'paiements' => $paiements,
            'dons' => $dons,
            'classes' => $classes,
        ];
    }

    public function makeSpreadsheet(array $report): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $this->buildSummarySheet($spreadsheet, $report);
        $this->buildPaiementsSheet($spreadsheet, collect($report['paiements'] ?? []));
        $this->buildDonsSheet($spreadsheet, collect($report['dons'] ?? []));
        $this->buildClassesSheet($spreadsheet, collect($report['classes'] ?? []));

        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    public function streamExcel(array $report): StreamedResponse
    {
        $spreadsheet = $this->makeSpreadsheet($report);
        $scope = (string) data_get($report, 'meta.scope', 'monthly');
        $slug = (string) data_get($report, 'meta.slug', now()->format('Y-m'));
        $filename = sprintf('rapport-tresorerie-%s-%s.xlsx', $scope, $slug);

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function mapPaiement(Paiement $paiement): array
    {
        $membre = trim((string) (($paiement->user?->prenom ?? '') . ' ' . ($paiement->user?->nom ?? '')));

        return [
            'date' => optional($paiement->date_paiement)->format('d/m/Y'),
            'famille' => $paiement->family?->nom ?? 'Famille inconnue',
            'membre' => $membre !== '' ? $membre : '-',
            'classe' => $paiement->user?->classe?->nom
                ?? $paiement->family?->classe?->nom
                ?? 'Sans classe',
            'cotisation' => $paiement->cotisation?->nom ?? 'Paiement libre',
            'montant' => (int) $paiement->montant,
            'mode' => $this->formatMode($paiement->mode_paiement),
            'statut' => $this->formatPaiementStatus($paiement->statut),
            'reference' => $paiement->reference_recu ?? '-',
            'note' => $paiement->note ?? '',
        ];
    }

    private function mapDon(Don $don): array
    {
        $donateur = trim((string) (($don->user?->prenom ?? '') . ' ' . ($don->user?->nom ?? '')));

        return [
            'date' => optional($don->date_don)->format('d/m/Y'),
            'famille' => $don->family?->nom ?? 'Famille inconnue',
            'donateur' => $donateur !== '' ? $donateur : ($don->family?->nom ?? 'Anonyme'),
            'classe' => $don->user?->classe?->nom
                ?? $don->family?->classe?->nom
                ?? $don->campagne?->classe?->nom
                ?? 'Sans classe',
            'campagne' => $don->campagne?->titre ?? '-',
            'type' => ucfirst(strtolower((string) ($don->type ?? 'LIBRE'))),
            'montant' => (int) $don->montant,
            'mode' => $this->formatMode($don->mode_paiement),
            'reference' => $don->reference_recu ?? '-',
            'note' => $don->note ?? '',
        ];
    }

    private function buildClassesSummary(Collection $paiements, Collection $dons): Collection
    {
        $classNames = $paiements
            ->pluck('classe')
            ->merge($dons->pluck('classe'))
            ->filter(fn($value) => filled($value))
            ->unique()
            ->values();

        return $classNames
            ->map(function (string $className) use ($paiements, $dons) {
                $classPaiements = $paiements->where('classe', $className);
                $classDons = $dons->where('classe', $className);

                $familles = $classPaiements
                    ->pluck('famille')
                    ->merge($classDons->pluck('famille'))
                    ->filter(fn($value) => filled($value) && $value !== 'Famille inconnue')
                    ->unique();

                $totalPaiements = (int) $classPaiements->sum('montant');
                $totalDons = (int) $classDons->sum('montant');

                return [
                    'classe' => $className,
                    'total_paiements' => $totalPaiements,
                    'nombre_paiements' => $classPaiements->count(),
                    'total_dons' => $totalDons,
                    'nombre_dons' => $classDons->count(),
                    'total_general' => $totalPaiements + $totalDons,
                    'familles_distinctes' => $familles->count(),
                ];
            })
            ->sortByDesc('total_general')
            ->values();
    }

    private function buildSummarySheet(Spreadsheet $spreadsheet, array $report): void
    {
        $sheet = new Worksheet($spreadsheet, 'Synthese');
        $spreadsheet->addSheet($sheet);

        $summary = $report['summary'] ?? [];
        $meta = $report['meta'] ?? [];

        $rows = [
            ['Rapport', data_get($meta, 'title', 'Rapport tresorerie')],
            ['Periode', data_get($meta, 'label', '-')],
            ['Du', data_get($meta, 'start_display', '-')],
            ['Au', data_get($meta, 'end_display', '-')],
            ['Genere le', data_get($meta, 'generated_at_display', '-')],
            [],
            ['Indicateur', 'Valeur'],
            ['Total paiements', (int) ($summary['total_paiements'] ?? 0)],
            ['Total dons', (int) ($summary['total_dons'] ?? 0)],
            ['Total general', (int) ($summary['total_general'] ?? 0)],
            ['Nombre de paiements', (int) ($summary['nombre_paiements'] ?? 0)],
            ['Nombre de dons', (int) ($summary['nombre_dons'] ?? 0)],
            ['Familles contributrices', (int) ($summary['familles_distinctes'] ?? 0)],
            ['Classes concernees', (int) ($summary['classes_distinctes'] ?? 0)],
        ];

        $sheet->fromArray($rows, null, 'A1');
        $this->styleHeaderRow($sheet, 7, 'A', 'B');
        $this->formatCurrencyColumn($sheet, 'B', 8, 10);
        $this->autoSizeColumns($sheet, 2);
    }

    private function buildPaiementsSheet(Spreadsheet $spreadsheet, Collection $paiements): void
    {
        $sheet = new Worksheet($spreadsheet, 'Paiements');
        $spreadsheet->addSheet($sheet);

        $headers = ['Date', 'Famille', 'Membre', 'Classe', 'Cotisation', 'Montant', 'Mode', 'Statut', 'Reference', 'Note'];
        $sheet->fromArray($headers, null, 'A1');

        $rows = $paiements
            ->map(fn(array $row) => [
                $row['date'] ?? '',
                $row['famille'] ?? '',
                $row['membre'] ?? '',
                $row['classe'] ?? '',
                $row['cotisation'] ?? '',
                (int) ($row['montant'] ?? 0),
                $row['mode'] ?? '',
                $row['statut'] ?? '',
                $row['reference'] ?? '',
                $row['note'] ?? '',
            ])
            ->all();

        if ($rows !== []) {
            $sheet->fromArray($rows, null, 'A2');
            $this->formatCurrencyColumn($sheet, 'F', 2, count($rows) + 1);
        }

        $this->styleHeaderRow($sheet, 1, 'A', 'J');
        $this->finalizeDataSheet($sheet, 10);
    }

    private function buildDonsSheet(Spreadsheet $spreadsheet, Collection $dons): void
    {
        $sheet = new Worksheet($spreadsheet, 'Dons');
        $spreadsheet->addSheet($sheet);

        $headers = ['Date', 'Famille', 'Donateur', 'Classe', 'Campagne', 'Type', 'Montant', 'Mode', 'Reference', 'Note'];
        $sheet->fromArray($headers, null, 'A1');

        $rows = $dons
            ->map(fn(array $row) => [
                $row['date'] ?? '',
                $row['famille'] ?? '',
                $row['donateur'] ?? '',
                $row['classe'] ?? '',
                $row['campagne'] ?? '',
                $row['type'] ?? '',
                (int) ($row['montant'] ?? 0),
                $row['mode'] ?? '',
                $row['reference'] ?? '',
                $row['note'] ?? '',
            ])
            ->all();

        if ($rows !== []) {
            $sheet->fromArray($rows, null, 'A2');
            $this->formatCurrencyColumn($sheet, 'G', 2, count($rows) + 1);
        }

        $this->styleHeaderRow($sheet, 1, 'A', 'J');
        $this->finalizeDataSheet($sheet, 10);
    }

    private function buildClassesSheet(Spreadsheet $spreadsheet, Collection $classes): void
    {
        $sheet = new Worksheet($spreadsheet, 'Classes');
        $spreadsheet->addSheet($sheet);

        $headers = [
            'Classe',
            'Total paiements',
            'Nombre paiements',
            'Total dons',
            'Nombre dons',
            'Total general',
            'Familles distinctes',
        ];

        $sheet->fromArray($headers, null, 'A1');

        $rows = $classes
            ->map(fn(array $row) => [
                $row['classe'] ?? '',
                (int) ($row['total_paiements'] ?? 0),
                (int) ($row['nombre_paiements'] ?? 0),
                (int) ($row['total_dons'] ?? 0),
                (int) ($row['nombre_dons'] ?? 0),
                (int) ($row['total_general'] ?? 0),
                (int) ($row['familles_distinctes'] ?? 0),
            ])
            ->all();

        if ($rows !== []) {
            $sheet->fromArray($rows, null, 'A2');
            $this->formatCurrencyColumn($sheet, 'B', 2, count($rows) + 1);
            $this->formatCurrencyColumn($sheet, 'D', 2, count($rows) + 1);
            $this->formatCurrencyColumn($sheet, 'F', 2, count($rows) + 1);
        }

        $this->styleHeaderRow($sheet, 1, 'A', 'G');
        $this->finalizeDataSheet($sheet, 7);
    }

    private function styleHeaderRow(Worksheet $sheet, int $row, string $fromColumn, string $toColumn): void
    {
        $range = sprintf('%s%d:%s%d', $fromColumn, $row, $toColumn, $row);

        $sheet->getStyle($range)->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($range)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('1D4ED8');
    }

    private function formatCurrencyColumn(Worksheet $sheet, string $column, int $startRow, int $endRow): void
    {
        if ($endRow < $startRow) {
            return;
        }

        $sheet
            ->getStyle(sprintf('%s%d:%s%d', $column, $startRow, $column, $endRow))
            ->getNumberFormat()
            ->setFormatCode(NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1);
    }

    private function finalizeDataSheet(Worksheet $sheet, int $columnCount): void
    {
        $sheet->freezePane('A2');
        $this->autoSizeColumns($sheet, $columnCount);
    }

    private function autoSizeColumns(Worksheet $sheet, int $columnCount): void
    {
        for ($index = 1; $index <= $columnCount; $index++) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($index))->setAutoSize(true);
        }
    }

    private function formatMode(?string $mode): string
    {
        return match ($mode) {
            Paiement::MODE_ESPECES => 'Especes',
            Paiement::MODE_VIREMENT => 'Virement',
            default => 'Mobile Money',
        };
    }

    private function formatPaiementStatus(?string $status): string
    {
        return match ($status) {
            Paiement::STATUT_PARTIELLEMENT_PAYE => 'Partiellement paye',
            Paiement::STATUT_EN_RETARD => 'En retard',
            Paiement::STATUT_ANNULE => 'Annule',
            default => 'Paye',
        };
    }
}
