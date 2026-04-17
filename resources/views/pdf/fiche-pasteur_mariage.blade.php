@php
use Carbon\Carbon;

$actesCollection = collect($actes ?? [isset($acte) ? $acte : null])->filter();
$firstActe = $actesCollection->first();
$reference = $firstActe?->reference ?? ('ACTE-' . str_pad((string) ($firstActe?->id ?? 0), 6, '0', STR_PAD_LEFT));
$documentLabel = $documentLabel ?? 'Fiche finale des mariages';
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

$member1Naissance = null;
if (!empty($membre?->date_naissance)) {
try {
$member1Naissance = Carbon::parse($membre->date_naissance)->format('d/m/Y');
} catch (\Throwable $e) {
}
}
if (!$member1Naissance && !empty($details['date_naissance'])) {
try {
$member1Naissance = Carbon::parse($details['date_naissance'])->format('d/m/Y');
} catch (\Throwable $e) {
$member1Naissance = $details['date_naissance'];
}
}

$member2Prenom = trim((string) ($details['conjoint_prenom'] ?? $details['epoux_prenom'] ?? ''));
$member2Nom = trim((string) ($details['conjoint_nom'] ?? $details['epoux_nom'] ?? ''));
$member2Full = mb_strtoupper(trim($member2Prenom . ' ' . $member2Nom), 'UTF-8');

$member2Naissance = null;
$rawNaissance = $details['conjoint_date_naissance'] ?? $details['epoux_date_naissance'] ?? null;
if ($rawNaissance) {
try {
$member2Naissance = Carbon::parse($rawNaissance)->format('d/m/Y');
} catch (\Throwable $e) {
$member2Naissance = $rawNaissance;
}
}

return [
'index' => $index + 1,
'member1Nom' => mb_strtoupper(trim(($membre?->prenom ?? '') . ' ' . ($membre?->nom ?? '')), 'UTF-8') ?: 'MEMBRE NON RENSEIGNE',
'member1Naissance' => $member1Naissance ?? '�',
'member1Contact' => $membre?->telephone ?? $family?->telephone ?? $currentActe->createur?->telephone ?? '�',
'member1Eglise' => $details['eglise'] ?? 'Emu Jubile',
'member1Classe' => $classe?->nom ?? '�',
'member2Full' => $member2Full,
'member2Naissance' => $member2Naissance ?? '�',
'member2Contact' => $details['conjoint_contact'] ?? $details['epoux_contact'] ?? '�',
'member2Eglise' => $details['conjoint_eglise'] ?? $details['epoux_eglise'] ?? '�',
'member2Classe' => $details['conjoint_classe'] ?? $details['epoux_classe'] ?? '-',
'hasPartner' => $member2Full !== '',
];
});

$logoSrc = $logoDataUri ?? null;
@endphp
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Liste demande d'acte de mariage {{ $reference }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 30mm 20mm 30mm 20mm;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #1a1a1a;
            font-size: 11px;
            background: #ffffff;
        }

        .header-wrapper {
            width: 90%;
            margin: 7mm auto 20px auto;
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
            width: 88px;
            text-align: center;
        }

        .logo-cell img {
            width: 72px;
            height: 72px;
            object-fit: contain;
            margin-top: 5px;
        }

        .church-cell {
            padding: 10px 8px 0;
            text-align: center;
        }

        .church-name {
            font-size: 20px;
            font-weight: 700;
            color: #5a5a5a;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            line-height: 1.15;
        }

        .church-subtitle {
            font-size: 10px;
            color: #9ca3af;
            margin-top: 6px;
        }

        .ref-cell {
            text-align: right;
            vertical-align: top;
            padding-top: 2px;
            font-size: 9px;
            color: #9ca3af;
            white-space: nowrap;
        }

        .divider-wrapper {
            width: 90%;
            margin: 0 auto;
        }

        .divider {
            border: none;
            border-top: 1.5px solid #cccccc;
            margin: 10px 0 28px 0;
        }

        .main-title-wrapper {
            width: 90%;
            margin: 0 auto 18px auto;
            text-align: center;
        }

        .main-title {
            font-size: 15px;
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
            width: 90%;
            margin: 0 auto;
            border-collapse: collapse;
        }

        .list-table th {
            border: 1.5px solid #1a1a1a;
            padding: 8px 6px;
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            text-align: center;
            background-color: #ffffff;
            color: #1a1a1a;
        }

        .list-table td {
            border: 1.5px solid #1a1a1a;
            padding: 7px 8px;
            font-size: 10.5px;
            color: #1a1a1a;
            vertical-align: middle;
            text-align: center;
        }

        .td-num {
            vertical-align: middle;
            text-align: center;
            font-weight: 700;
            font-size: 11px;
            width: 7%;
        }

        .td-nom {
            text-align: left;
            width: 30%;
        }

        .col-naiss {
            width: 18%;
        }

        .col-tel {
            width: 17%;
        }

        .col-egl {
            width: 16%;
        }

        .col-cls {
            width: 12%;
        }

        .separator-row td {
            border-left: 1.5px solid #1a1a1a;
            border-right: 1.5px solid #1a1a1a;
            border-top: none;
            border-bottom: none;
            height: 4px;
            background: #f0f0f0;
            padding: 0;
        }

        .footer {
            position: fixed;
            bottom: -16mm;
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
                    <div class="church-subtitle">Classe {{ $className }} {{ $documentLabel }}</div>
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
        <span class="main-title">Liste Complementaire</span>
    </div>

    <div class="table-wrapper">
        <table class="list-table">
            <thead>
                <tr>
                    <th class="td-num">N</th>
                    <th class="td-nom" style="text-align:center;">Noms et Prenoms</th>
                    <th class="col-naiss">Date Naissance</th>
                    <th class="col-tel">Contact</th>
                    <th class="col-egl">Eglise</th>
                    <th class="col-cls">Classe</th>
                </tr>
            </thead>
            <tbody>
                @forelse($rows as $row)
                <tr>
                    <td class="td-num" @if($row['hasPartner']) rowspan="2" @endif>
                        {{ str_pad((string) $row['index'], 2, '0', STR_PAD_LEFT) }}
                    </td>
                    <td class="td-nom">{{ $row['member1Nom'] }}</td>
                    <td>{{ $row['member1Naissance'] }}</td>
                    <td>{{ $row['member1Contact'] }}</td>
                    <td>{{ $row['member1Eglise'] }}</td>
                    <td>{{ $row['member1Classe'] }}</td>
                </tr>
                @if($row['hasPartner'])
                <tr>
                    <td class="td-nom">{{ $row['member2Full'] }}</td>
                    <td>{{ $row['member2Naissance'] }}</td>
                    <td>{{ $row['member2Contact'] }}</td>
                    <td>{{ $row['member2Eglise'] }}</td>
                    <td>{{ $row['member2Classe'] }}</td>
                </tr>
                @endif
                @if(!$loop->last)
                <tr class="separator-row">
                    <td colspan="6"></td>
                </tr>
                @endif
                @empty
                <tr>
                    <td colspan="6">Aucun mariage disponible.</td>
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