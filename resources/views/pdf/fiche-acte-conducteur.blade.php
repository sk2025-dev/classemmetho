@php
use Carbon\Carbon;

$actesList = $actes ?? (isset($acte) ? [$acte] : []);
$actesList = array_values($actesList);
$primaryActe = $acte ?? $actesList[0] ?? null;

$couples = [];
foreach ($actesList as $acteItem) {
    $details    = (array) ($acteItem->details ?? []);
    $membre     = $acteItem->membre;
    $classe     = $acteItem->classe;
    $family     = $acteItem->family ?? $membre?->family ?? $acteItem->createur?->family;

    $className = $classe?->nom ?? $membre?->classe?->nom ?? 'Israël';
    $member1Nom = mb_strtoupper(
        trim(($membre?->prenom ?? '') . ' ' . ($membre?->nom ?? '')), 'UTF-8'
    ) ?: 'MEMBRE NON RENSEIGNÉ';

    $member1Naissance = null;
    if (!empty($membre?->date_naissance)) {
        try { $member1Naissance = Carbon::parse($membre->date_naissance)->format('d/m/Y'); } catch (\Throwable $e) {}
    }
    if (!$member1Naissance && !empty($details['date_naissance'])) {
        try { $member1Naissance = Carbon::parse($details['date_naissance'])->format('d/m/Y'); } catch (\Throwable $e) {}
    }
    $member1Naissance = $member1Naissance ?? '—';
    $member1Contact   = $membre?->telephone ?? $family?->telephone ?? $acteItem->createur?->telephone ?? '—';
    $member1Eglise    = $details['eglise'] ?? 'Emu Jubilé';
    $member1Classe    = $className;

    $member2Prenom = trim($details['conjoint_prenom'] ?? $details['epoux_prenom'] ?? '');
    $member2Nom    = trim($details['conjoint_nom']    ?? $details['epoux_nom']    ?? '');
    $member2Full   = mb_strtoupper(trim($member2Prenom . ' ' . $member2Nom), 'UTF-8');

    $member2Naissance = null;
    $rawNaissance = $details['conjoint_date_naissance'] ?? $details['epoux_date_naissance'] ?? null;
    if ($rawNaissance) {
        try { $member2Naissance = Carbon::parse($rawNaissance)->format('d F Y'); } catch (\Throwable $e) { $member2Naissance = $rawNaissance; }
    }
    $member2Naissance = $member2Naissance ?? '—';
    $member2Contact   = $details['conjoint_contact'] ?? $details['epoux_contact'] ?? '—';
    $member2Eglise    = $details['conjoint_eglise']  ?? $details['epoux_eglise']  ?? '—';
    $member2Classe    = $details['conjoint_classe']  ?? $details['epoux_classe']  ?? '-';

    $hasPartner = $member2Full !== '';

    $couples[] = [
        'member1Nom' => $member1Nom,
        'member1Naissance' => $member1Naissance,
        'member1Contact' => $member1Contact,
        'member1Eglise' => $member1Eglise,
        'member1Classe' => $member1Classe,
        'member2Full' => $member2Full,
        'member2Naissance' => $member2Naissance,
        'member2Contact' => $member2Contact,
        'member2Eglise' => $member2Eglise,
        'member2Classe' => $member2Classe,
        'hasPartner' => $hasPartner,
    ];
}

$documentLabel = $documentLabel ?? 'Fiche du conducteur';
$generatedAt   = $generatedAt   ?? now();
$logoSrc = $logoDataUri ?? null;
$reference = $reference ?? ($primaryActe?->reference ?? ($actesList[0]->reference ?? null)) ?? 'Fiche conducteur';
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Liste Complémentaire — {{ $reference }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 18mm 16mm 22mm 16mm;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #1a1a1a;
            font-size: 11px;
            background: #ffffff;
        }

        /* ── EN-TÊTE ── */
        .header-wrapper {
            width: 90%;
            margin: 0 auto 4px auto;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .header-table td { vertical-align: middle; padding: 0; }

        .logo-cell { width: 80px; }
        .logo-cell img { width: 72px; height: 72px; object-fit: contain; }

        .church-cell { padding-left: 12px; }
        .church-name {
            font-size: 20px;
            font-weight: 700;
            color: #5a5a5a;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .church-subtitle {
            font-size: 10px;
            color: #9ca3af;
            margin-top: 2px;
        }

        .ref-cell {
            text-align: right;
            vertical-align: top;
            padding-top: 2px;
            font-size: 9px;
            color: #9ca3af;
            white-space: nowrap;
        }

        /* ── SÉPARATEUR ── */
        .divider-wrapper {
            width: 90%;
            margin: 0 auto;
        }
        .divider {
            border: none;
            border-top: 1.5px solid #cccccc;
            margin: 10px 0 28px 0;
        }

        /* ── TITRE PRINCIPAL ── */
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

        /* ── TABLEAU ── */
        .table-wrapper {
            width: 100%;
            text-align: center;
        }
        .list-table {
            width: 90%;
            margin: 0 auto;
            border-collapse: collapse;
        }

        /* En-têtes */
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

        /* Cellules données */
        .list-table td {
            border: 1.5px solid #1a1a1a;
            padding: 7px 8px;
            font-size: 10.5px;
            color: #1a1a1a;
            vertical-align: middle;
            text-align: center;
        }

        /* Numéro — centré verticalement sur les 2 lignes du couple */
        .td-num {
            vertical-align: middle;
            text-align: center;
            font-weight: 700;
            font-size: 11px;
            width: 7%;
        }

        /* Nom — aligné à gauche */
        .td-nom {
            text-align: left;
            width: 30%;
        }

        .col-naiss { width: 18%; }
        .col-tel   { width: 17%; }
        .col-egl   { width: 16%; }
        .col-cls   { width: 12%; }

        /* Séparateur visuel entre couples (ligne vide mince) */
        .separator-row td {
            border-left:  1.5px solid #1a1a1a;
            border-right: 1.5px solid #1a1a1a;
            border-top: none;
            border-bottom: none;
            height: 4px;
            background: #f0f0f0;
            padding: 0;
        }

        /* ── PIED DE PAGE ── */
        .footer {
            position: fixed;
            bottom: -16mm;
            left: 0; right: 0;
            text-align: center;
            font-size: 8px;
            color: #aaaaaa;
            border-top: 1px solid #e5e7eb;
            padding-top: 4px;
        }
    </style>
</head>
<body>

    {{-- ═══ EN-TÊTE ═══ --}}
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
                    <div class="church-subtitle">Classe {{ $className }} &nbsp;·&nbsp; {{ $documentLabel }}</div>
                </td>
                <td class="ref-cell">
                    <div>Réf. {{ $reference }}</div>
                    <div>{{ Carbon::parse($generatedAt)->format('d/m/Y H:i') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="divider-wrapper"><hr class="divider"></div>

    {{-- ═══ TITRE ═══ --}}
    <div class="main-title-wrapper">
        <span class="main-title">Liste Complémentaire</span>
    </div>

    {{-- ═══ TABLEAU ═══ --}}
    <div class="table-wrapper">
    <table class="list-table">
        <thead>
            <tr>
                <th class="td-num">N°</th>
                <th class="td-nom" style="text-align:center;">Noms et Prénoms</th>
                <th class="col-naiss">Date Naissance</th>
                <th class="col-tel">Contact</th>
                <th class="col-egl">Église</th>
                <th class="col-cls">Classe</th>
            </tr>
        </thead>
        <tbody>

            @foreach ($couples as $index => $couple)
            <tr>
                <td class="td-num" @if($couple['hasPartner']) rowspan="2" @endif>{{ str_pad($index + 1, 2, '0', STR_PAD_LEFT) }}</td>
                <td class="td-nom">{{ $couple['member1Nom'] }}</td>
                <td>{{ $couple['member1Naissance'] }}</td>
                <td>{{ $couple['member1Contact'] }}</td>
                <td>{{ $couple['member1Eglise'] }}</td>
                <td>{{ $couple['member1Classe'] }}</td>
            </tr>

            @if($couple['hasPartner'])
            <tr>
                <td class="td-nom">{{ $couple['member2Full'] }}</td>
                <td>{{ $couple['member2Naissance'] }}</td>
                <td>{{ $couple['member2Contact'] }}</td>
                <td>{{ $couple['member2Eglise'] }}</td>
                <td>{{ $couple['member2Classe'] }}</td>
            </tr>
            @endif

            @if(!$loop->last)
            <tr class="separator-row"><td colspan="6"></td></tr>
            @endif
            @endforeach

        </tbody>
    </table>
    </div>

    {{-- ═══ PIED DE PAGE ═══ --}}
    <div class="footer">
        EMUCI – Temple du Jubilé de Cocody &nbsp;|&nbsp;
        Généré par GesParoisse &nbsp;|&nbsp;
        Réf. {{ $reference }}
    </div>

</body>
</html>