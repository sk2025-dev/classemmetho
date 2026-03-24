<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class AnnuaireExport implements FromArray, WithHeadings, WithStyles, WithTitle
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function array(): array
    {
        $exportData = [];

        foreach ($this->data as $user) {
            $exportData[] = [
                $user['full_name'],
                $user['email'] ?? '',
                $user['telephone'] ?? '',
                $user['role'],
                $user['classe'] ?? '',
                $user['fonction'] ?? '',
                $user['family_code'] ?? '',
                $user['is_active'] ? 'Actif' : 'Inactif',
                $user['created_at_formatted'] ?? '',
            ];
        }

        return $exportData;
    }

    public function headings(): array
    {
        return [
            'Nom Complet',
            'Email',
            'Téléphone',
            'Rôle',
            'Classe',
            'Fonction',
            'Code Famille',
            'Statut',
            'Date Création',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => ['fillType' => Fill::FILL_GRADIENT_LINEAR, 'rotation' => 90, 'startColor' => ['rgb' => '2563EB'], 'endColor' => ['rgb' => '1E40AF']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function title(): string
    {
        return 'Annuaire Paroisse';
    }
}
