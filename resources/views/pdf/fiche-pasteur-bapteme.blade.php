@php
use Carbon\Carbon;

$actesCollection = collect($actes ?? []);
$firstActe = $actesCollection->first();
$reference = $firstActe?->reference ?? ('BAPTEME-' . str_pad((string) ($firstActe?->id ?? 0), 6, '0', STR_PAD_LEFT));
$documentLabel = $documentLabel ?? 'Fiche finale des baptêmes';
$generatedAt = $generatedAt ?? now();

$classNames = $actesCollection
    ->map(function ($currentActe) {
        return $currentActe?->classe?->nom
            ?? $currentActe?->membre?->classe?->nom
            ?? $currentActe?->createur?->classe?->nom;
    })
    ->filter()
    ->unique()
    ->values();

$className = $classNames->count() > 1
    ? 'Toutes classes'
    : ($classNames->first() ?? 'Toutes classes');

$rows = $actesCollection->map(function ($currentActe, $index) {
    $details = (array) ($currentActe->details ?? []);
    $membre = $currentActe->membre;
    $family = $currentActe->family ?? $membre?->family ?? $currentActe->createur?->family;
    $classe = $currentActe->classe ?? $membre?->classe ?? $currentActe->createur?->classe;

    $dateNaissance = null;
    if (!empty($membre?->date_naissance)) {
        try {
            $dateNaissance = Carbon::parse($membre->date_naissance)->format('d/m/Y');
        } catch (\Throwable $e) {}
    }
    if (!$dateNaissance && !empty($details['date_naissance'])) {
        try {
            $dateNaissance = Carbon::parse($details['date_naissance'])->format('d/m/Y');
        } catch (\Throwable $e) {
            $dateNaissance = $details['date_naissance'];
        }
    }

    $dateSouhaitee = null;
    if (!empty($currentActe->date_souhaitee)) {
        try {
            $dateSouhaitee = Carbon::parse($currentActe->date_souhaitee)->format('d/m/Y');
        } catch (\Throwable $e) {
            $dateSouhaitee = $currentActe->date_souhaitee;
        }
    }

    return [
        'index' => $index + 1,
        'nomComplet' => mb_strtoupper(trim(($membre?->prenom ?? '') . ' ' . ($membre?->nom ?? '')), 'UTF-8') ?: 'MEMBRE NON RENSEIGNE',
        'dateNaissance' => $dateNaissance ?? '–',
        'contact' => $membre?->telephone ?? $family?->telephone ?? $currentActe->createur?->telephone ?? '–',
        'classe' => $classe?->nom ?? '–',
    ];
});

$logoSrc = $logoDataUri ?? null;
@endphp
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Liste demande de baptême {{ $reference }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 25mm 15mm 25mm 15mm;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #1a1a1a;
            font-size: 10px;
            background: #ffffff;
        }

        .header-wrapper {
            width: 95%;
            margin: 5mm auto 18px auto;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .header-table td {
            vertical-align: middle;
            padding: 0;
        }

        .logo-cell {
            width: 80px;
            text-align: center;
        }

        .logo-cell img {
            width: 65px;
            height: 65px;
            object-fit: contain;
            margin-top: 4px;
        }

        .church-cell {
            padding: 8px 8px 0;
            text-align: center;
        }

        .church-name {
            font-size: 18px;
            font-weight: 700;
            color: #5a5a5a;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            line-height: 1.15;
        }

        .church-subtitle {
            font-size: 9px;
            color: #9ca3af;
            margin-top: 5px;
        }

        .ref-cell {
            text-align: right;
            vertical-align: top;
            padding-top: 2px;
            font-size: 9px;
            color: #9ca3af;
            white-space: nowrap;
            width: 140px;
        }

        .divider-wrapper {
            width: 95%;
            margin: 0 auto;
        }

        .divider {
            border: none;
            border-top: 1.5px solid #cccccc;
            margin: 8px 0 22px 0;
        }

        .main-title-wrapper {
            width: 95%;
            margin: 0 auto 16px auto;
            text-align: center;
        }

        .main-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            text-decoration: underline;
            letter-spacing: 1.5px;
            color: #1a1a1a;
        }

        .table-wrapper {
            width: 100%;
            text-align: center;
        }

        .list-table {
            width: 95%;
            margin: 0 auto;
            border-collapse: collapse;
        }

        .list-table th {
            border: 1.5px solid #1a1a1a;
            padding: 7px 5px;
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            text-align: center;
            background-color: #ffffff;
            color: #1a1a1a;
        }

        .list-table td {
            border: 1.5px solid #1a1a1a;
            padding: 6px 7px;
            font-size: 9.5px;
            color: #1a1a1a;
            vertical-align: middle;
            text-align: center;
        }

        .td-num {
            vertical-align: middle;
            text-align: center;
            font-weight: 700;
            font-size: 10px;
            width: 5%;
        }

        .td-nom {
            text-align: left;
            width: 22%;
        }

        .col-naiss { width: 20%; }
        .col-tel   { width: 20%; }
        .col-cls   { width: 18%; }

        .footer {
            position: fixed;
            bottom: -12mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #aaaaaa;
            border-top: 1px solid #e5e7eb;
            padding-top: 4px;
        }
    </style>
</head>

<body>
    <div class="header-wrapper">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if($logoSrc)
                    <img src="{{ $logoSrc }}" alt="Logo Classe {{ $className }}">
                    @endif
                </td>
                <td class="church-cell">
                    <div class="church-name">EMUCI, TEMPLE DU JUBILE DE COCODY</div>
                    <div class="church-subtitle">Classe {{ $className }} — {{ $documentLabel }}</div>
                </td>
                <td class="ref-cell">
                    <div>Ref. {{ $reference }}</div>
                    <div>{{ Carbon::parse($generatedAt)->format('d/m/Y H:i') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="divider-wrapper">
        <hr class="divider">
    </div>

    <div class="main-title-wrapper">
        <span class="main-title">Liste de formation — baptême</span>
    </div>

    <div class="table-wrapper">
        <table class="list-table">
            <thead>
                <tr>
                    <th class="td-num">N</th>
                    <th class="td-nom" style="text-align:center;">Noms et Prénoms</th>
                    <th class="col-naiss">Date Naissance</th>
                    <th class="col-tel">Contact</th>
                    <th class="col-cls">Classe</th>
                </tr>
            </thead>
            <tbody>
                @forelse($rows as $row)
                <tr>
                    <td class="td-num">{{ str_pad((string) $row['index'], 2, '0', STR_PAD_LEFT) }}</td>
                    <td class="td-nom">{{ $row['nomComplet'] }}</td>
                    <td>{{ $row['dateNaissance'] }}</td>
                    <td>{{ $row['contact'] }}</td>
                    <td>{{ $row['classe'] }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="5">Aucune demande de baptême disponible.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="footer">
        EMUCI Temple du Jubile de Cocody &nbsp;|&nbsp;
        Genere par GesParoisse &nbsp;|&nbsp;
        Ref. {{ $reference }}
    </div>
</body>

</html>
