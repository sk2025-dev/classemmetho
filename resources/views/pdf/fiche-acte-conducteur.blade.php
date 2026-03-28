@php
use Carbon\Carbon;

$details = (array) ($acte->details ?? []);
$membre = $acte->membre;
$classe = $acte->classe;
$family = $acte->family ?? $membre?->family ?? $acte->createur?->family;
$conducteur = $acte->conducteur ?? $classe?->conducteur;
$pasteur = $acte->pasteur;
$reference = $acte->reference ?? ('ACTE-' . $acte->id);
$documentLabel = $documentLabel ?? 'Fiche du conducteur';
$generatedAt = $generatedAt ?? now();

$memberName = trim(($membre?->prenom ?? '') . ' ' . ($membre?->nom ?? '')) ?: 'Membre non renseigne';
$memberBirthdate = !empty($membre?->date_naissance)
    ? Carbon::parse($membre->date_naissance)->format('d/m/Y')
    : (!empty($details['date_naissance']) ? Carbon::parse($details['date_naissance'])->format('d/m/Y') : '—');
$memberPhone = $membre?->telephone ?? $family?->telephone ?? $acte->createur?->telephone ?? '—';
$memberChurch = $details['eglise'] ?? 'Emu Jubile';
$className = $classe?->nom ?? $membre?->classe?->nom ?? '—';

$rows = [[
    'numero' => '01',
    'nom' => $memberName,
    'naissance' => $memberBirthdate,
    'contact' => $memberPhone,
    'eglise' => $memberChurch,
    'classe' => $className,
]];

$partnerName = trim(($details['epoux_prenom'] ?? '') . ' ' . ($details['epoux_nom'] ?? ''));
if ($partnerName !== '') {
    $rows[] = [
        'numero' => str_pad((string) (count($rows) + 1), 2, '0', STR_PAD_LEFT),
        'nom' => $partnerName,
        'naissance' => !empty($details['epoux_nat']) ? $details['epoux_nat'] : '—',
        'contact' => $details['epoux_contact'] ?? '—',
        'eglise' => $details['epoux_eglise'] ?? '—',
        'classe' => 'Hors classe',
    ];
}

$logoSrc = $logoDataUri ?? null;
$nomConducteur = trim(($conducteur?->prenom ?? '') . ' ' . ($conducteur?->nom ?? '')) ?: 'Conducteur non renseigne';
$nomPasteur = trim(($pasteur?->prenom ?? '') . ' ' . ($pasteur?->nom ?? '')) ?: 'Pasteur non renseigne';
$familyLabel = $family?->nom ?? 'Famille non renseignee';
$typeActe = ucfirst(str_replace('_', ' ', (string) $acte->type_acte));
$dateSouhaitee = !empty($acte->date_souhaitee) ? Carbon::parse($acte->date_souhaitee)->format('d/m/Y') : '—';
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $documentLabel }} - {{ $reference }}</title>
    <style>
        @page { size: A4 portrait; margin: 18mm 14mm 20mm; }
        body { font-family: DejaVu Sans, Arial, sans-serif; color: #1f2937; font-size: 11px; }
        .header-table, .meta-table, .list-table, .signature-table { width: 100%; border-collapse: collapse; }
        .logo-box { width: 86px; vertical-align: top; }
        .logo-box img { width: 72px; height: 72px; object-fit: contain; }
        .church-title { font-size: 18px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
        .church-subtitle { font-size: 11px; color: #9ca3af; margin-top: 4px; }
        .ref-box { text-align: right; font-size: 10px; color: #6b7280; vertical-align: top; }
        .main-title { margin: 26px 0 14px; text-align: center; font-size: 16px; font-weight: 700; text-transform: uppercase; text-decoration: underline; }
        .meta-table td { padding: 5px 8px; border: 1px solid #d1d5db; }
        .meta-label { width: 24%; font-weight: 700; background: #f9fafb; }
        .section-title { margin: 16px 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #374151; }
        .list-table th, .list-table td { border: 1px solid #4b5563; padding: 7px 6px; }
        .list-table th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; }
        .list-table td { font-size: 10.5px; }
        .text-center { text-align: center; }
        .note-box { margin-top: 14px; border: 1px solid #d1d5db; background: #fcfcfc; padding: 10px 12px; line-height: 1.55; }
        .signature-table { margin-top: 34px; }
        .signature-table td { width: 50%; vertical-align: top; }
        .signature-title { font-size: 11px; font-weight: 700; margin-bottom: 48px; }
        .signature-name { font-size: 11px; font-weight: 700; text-transform: uppercase; }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td class="logo-box">
                @if($logoSrc)
                    <img src="{{ $logoSrc }}" alt="Logo">
                @endif
            </td>
            <td>
                <div class="church-title">EMUCI, TEMPLE DU JUBILE DE COCODY</div>
                <div class="church-subtitle">Classe {{ $className }} - {{ $documentLabel }}</div>
            </td>
            <td class="ref-box">
                <div>Ref. {{ $reference }}</div>
                <div>{{ Carbon::parse($generatedAt)->format('d/m/Y H:i') }}</div>
            </td>
        </tr>
    </table>

    <div class="main-title">Liste complementaire</div>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Type d'acte</td>
            <td>{{ $typeActe }}</td>
            <td class="meta-label">Date choisie</td>
            <td>{{ $dateSouhaitee }}</td>
        </tr>
        <tr>
            <td class="meta-label">Famille</td>
            <td>{{ $familyLabel }}</td>
            <td class="meta-label">Responsable</td>
            <td>{{ trim(($acte->createur?->prenom ?? '') . ' ' . ($acte->createur?->nom ?? '')) ?: '—' }}</td>
        </tr>
    </table>

    <div class="section-title">Membres concernes</div>
    <table class="list-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 7%;">N&deg;</th>
                <th style="width: 34%;">Noms et prenoms</th>
                <th style="width: 18%;">Date naissance</th>
                <th style="width: 18%;">Contact</th>
                <th style="width: 13%;">Eglise</th>
                <th style="width: 10%;">Classe</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                <tr>
                    <td class="text-center">{{ $row['numero'] }}</td>
                    <td>{{ $row['nom'] }}</td>
                    <td>{{ $row['naissance'] }}</td>
                    <td>{{ $row['contact'] }}</td>
                    <td>{{ $row['eglise'] }}</td>
                    <td>{{ $row['classe'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="note-box">
        <strong>Observations :</strong>
        {{ trim((string) ($details['observations'] ?? $details['commentaire'] ?? $details['message'] ?? 'Aucune observation renseignee.')) }}
    </div>

    <table class="signature-table">
        <tr>
            <td>
                <div class="signature-title">Conducteur de la classe</div>
                <div class="signature-name">{{ $nomConducteur }}</div>
            </td>
            <td style="text-align: right;">
                <div class="signature-title">Pasteur</div>
                <div class="signature-name">{{ $nomPasteur }}</div>
            </td>
        </tr>
    </table>
</body>
</html>
