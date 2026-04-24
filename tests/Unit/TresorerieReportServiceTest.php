<?php

namespace Tests\Unit;

use App\Services\TresorerieReportService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class TresorerieReportServiceTest extends TestCase
{
    public function test_it_resolves_monthly_and_annual_periods(): void
    {
        $service = new TresorerieReportService();
        $referenceDate = CarbonImmutable::create(2026, 4, 17, 10, 30, 0);

        $monthly = $service->resolvePeriod('monthly', null, null, $referenceDate);
        $annual = $service->resolvePeriod('annual', null, null, $referenceDate);

        $this->assertSame('monthly', $monthly['scope']);
        $this->assertSame('2026-04', $monthly['slug']);
        $this->assertSame('01/04/2026', $monthly['start_display']);
        $this->assertSame('30/04/2026', $monthly['end_display']);

        $this->assertSame('annual', $annual['scope']);
        $this->assertSame('2026', $annual['slug']);
        $this->assertSame('01/01/2026', $annual['start_display']);
        $this->assertSame('31/12/2026', $annual['end_display']);
    }

    public function test_it_builds_the_expected_workbook_structure(): void
    {
        $service = new TresorerieReportService();

        $spreadsheet = $service->makeSpreadsheet([
            'meta' => [
                'title' => 'Rapport mensuel',
                'label' => 'Avril 2026',
                'start_display' => '01/04/2026',
                'end_display' => '30/04/2026',
                'generated_at_display' => '17/04/2026 12:00',
                'scope' => 'monthly',
                'slug' => '2026-04',
            ],
            'summary' => [
                'total_paiements' => 15000,
                'total_dons' => 5000,
                'total_general' => 20000,
                'nombre_paiements' => 1,
                'nombre_dons' => 1,
                'familles_distinctes' => 1,
                'classes_distinctes' => 1,
            ],
            'paiements' => new Collection([
                [
                    'date' => '15/04/2026',
                    'famille' => 'Famille Kone',
                    'membre' => 'Marie Kone',
                    'classe' => 'Classe A',
                    'cotisation' => 'FIMECO',
                    'montant' => 15000,
                    'mode' => 'Especes',
                    'statut' => 'Paye',
                    'reference' => 'RECU-001',
                    'note' => 'Saisie manuelle',
                ],
            ]),
            'dons' => new Collection([
                [
                    'date' => '18/04/2026',
                    'famille' => 'Famille Kone',
                    'donateur' => 'Jean Kone',
                    'classe' => 'Classe A',
                    'campagne' => '-',
                    'type' => 'Libre',
                    'montant' => 5000,
                    'mode' => 'Mobile Money',
                    'reference' => 'DON-001',
                    'note' => '',
                ],
            ]),
            'classes' => new Collection([
                [
                    'classe' => 'Classe A',
                    'total_paiements' => 15000,
                    'nombre_paiements' => 1,
                    'total_dons' => 5000,
                    'nombre_dons' => 1,
                    'total_general' => 20000,
                    'familles_distinctes' => 1,
                ],
            ]),
        ]);

        $this->assertSame(
            ['Synthese', 'Paiements', 'Dons', 'Classes'],
            $spreadsheet->getAllSheets() ? array_map(fn($sheet) => $sheet->getTitle(), $spreadsheet->getAllSheets()) : [],
        );
        $this->assertSame('Rapport', $spreadsheet->getSheetByName('Synthese')->getCell('A1')->getValue());
        $this->assertSame('Rapport mensuel', $spreadsheet->getSheetByName('Synthese')->getCell('B1')->getValue());
        $this->assertSame('Date', $spreadsheet->getSheetByName('Paiements')->getCell('A1')->getValue());
        $this->assertSame('Famille Kone', $spreadsheet->getSheetByName('Paiements')->getCell('B2')->getValue());
        $this->assertSame('Donateur', $spreadsheet->getSheetByName('Dons')->getCell('C1')->getValue());
        $this->assertSame('Classe A', $spreadsheet->getSheetByName('Classes')->getCell('A2')->getValue());
    }
}
