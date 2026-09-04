@php
use Carbon\Carbon;

$details = (array) ($acte->details ?? []);
$createur = $acte->createur ?? $acte->membre ?? null;
$famille = $createur?->family?->nom ?? $acte->family?->nom ?? 'Famille inconnue';
$classe = $createur?->classe?->nom ?? $acte->classe?->nom ?? 'Classe inconnue';

$nomDefunt = trim((string) ($details['nom_defunt'] ?? $details['nom_concerne'] ?? $details['nom'] ?? '—'));

$dateDeces = !empty($details['date_deces'])
    ? (function () use ($details) {
        try {
            return Carbon::parse($details['date_deces'])->locale('fr')->isoFormat('D MMMM YYYY');
        } catch (\Throwable $e) {
            return $details['date_deces'];
        }
    })()
    : '—';

$lieuDeces = trim((string) ($details['lieu_deces'] ?? $details['lieu'] ?? ''));

$dateCulte = !empty($acte->date_souhaitee)
    ? (function () use ($acte) {
        try {
            return Carbon::parse($acte->date_souhaitee)->locale('fr')->isoFormat('D MMMM YYYY');
        } catch (\Throwable $e) {
            return $acte->date_souhaitee;
        }
    })()
    : (!empty($details['date_souhaitee_culte'])
        ? (function () use ($details) {
            try {
                return Carbon::parse($details['date_souhaitee_culte'])->locale('fr')->isoFormat('D MMMM YYYY');
            } catch (\Throwable $e) {
                return $details['date_souhaitee_culte'];
            }
        })()
        : '—');

$heureCulte = !empty($details['heure_culte'])
    ? (function () use ($details) {
        try {
            return Carbon::parse($details['heure_culte'])->format('H\hi');
        } catch (\Throwable $e) {
            return $details['heure_culte'];
        }
    })()
    : '';

$culteDisplay = $dateCulte !== '—'
    ? trim($dateCulte . ($heureCulte !== '' ? ' à ' . $heureCulte : ''))
    : '—';

$programmeEvenements = (array) ($details['programme_evenements'] ?? []);
$programmeClos = strtoupper((string) ($details['programme_statut'] ?? 'OUVERT')) === 'CLOS';

$reference = $acte->reference ?? '—';
$dateEmission = optional($acte->created_at)->format('d/m/Y') ?? now()->format('d/m/Y');

$conducteur = $acte->conducteur ?? null;
$pasteur = $acte->pasteur ?? null;
$bureauConducteur = $acte->bureauConducteur ?? null;

$nomConducteur = $conducteur
    ? mb_strtoupper(trim(($conducteur->prenom ?? '') . ' ' . ($conducteur->nom ?? '')), 'UTF-8')
    : null;

$nomPasteur = $pasteur
    ? mb_strtoupper(trim(($pasteur->prenom ?? '') . ' ' . ($pasteur->nom ?? '')), 'UTF-8')
    : null;

$nomBureauConducteur = $bureauConducteur
    ? mb_strtoupper(trim(($bureauConducteur->prenom ?? '') . ' ' . ($bureauConducteur->nom ?? '')), 'UTF-8')
    : null;

$toStorageSignatureDataUri = function (?string $signaturePath): ?string {
    if (empty($signaturePath) || !is_string($signaturePath)) {
        return null;
    }

    if (str_starts_with($signaturePath, 'data:image/')) {
        return $signaturePath;
    }

    try {
        if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($signaturePath)) return null;
        $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path($signaturePath);
    } catch (\Throwable $e) {
        return null;
    }
    $raw = @file_get_contents($fullPath);
    if ($raw === false) {
        return null;
    }

    $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION) ?: 'png');
    $mime = match ($ext) {
        'jpg', 'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        default => 'image/png',
    };

    return 'data:' . $mime . ';base64,' . base64_encode($raw);
};

$toPublicImageDataUri = function (string $absolutePath): ?string {
    if (!is_file($absolutePath)) {
        return null;
    }

    $raw = @file_get_contents($absolutePath);
    if ($raw === false) {
        return null;
    }

    $ext = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION) ?: 'png');
    $mime = match ($ext) {
        'jpg', 'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        default => 'image/png',
    };

    return 'data:' . $mime . ';base64,' . base64_encode($raw);
};

$conducteurSignatureDataUri = $conducteurSignatureDataUri ?? $toStorageSignatureDataUri($conducteur->signature_path ?? null);
$pasteurSignatureDataUri = $pasteurSignatureDataUri ?? $toStorageSignatureDataUri($pasteur->signature_path ?? null);
$bureauConducteurSignatureDataUri = $bureauConducteurSignatureDataUri ?? $toStorageSignatureDataUri($bureauConducteur->signature_path ?? null);

$logoTempleSrc = $logoDataUri ?? $toPublicImageDataUri(public_path('images/logo.png'));
$logoMethoSrc = $methoDataUri ?? $toPublicImageDataUri(public_path('images/metho.jpg'));

/* ── Contenu des 3 pages (lettre / nécrologie / programme) ── */

$pasteurPrincipal = trim((string) \App\Models\SiteSetting::get('pasteur_principal_nom', ''));

$membre = $acte->membre ?? null;
$nomMembre = $membre
    ? trim(($membre->prenom ?? '') . ' ' . ($membre->nom ?? ''))
    : '';

$genreMembre = strtoupper(substr((string) ($membre->genre ?? ''), 0, 1));
$fratMot = $genreMembre === 'F' ? 'sœur' : ($genreMembre === 'M' ? 'frère' : 'membre');

$genreDefunt = mb_strtolower((string) ($details['sexe_defunt'] ?? $details['genre_defunt'] ?? ''), 'UTF-8');
$defuntFeminin = str_starts_with($genreDefunt, 'f');
$defuntMasculin = str_starts_with($genreDefunt, 'm');

$lienBrut = mb_strtolower((string) ($details['lien_familial'] ?? $details['declarant_lien'] ?? $details['dec_lien'] ?? ''), 'UTF-8');
$lienBrut = strtr($lienBrut, ['é' => 'e', 'è' => 'e', 'œ' => 'oe']);

$motLien = match (true) {
    in_array($lienBrut, ['enfant', 'fils', 'fille'], true) =>
        $defuntFeminin ? 'mère' : ($defuntMasculin ? 'père' : 'parent'),
    in_array($lienBrut, ['parent', 'pere', 'mere'], true) =>
        $defuntFeminin ? 'fille' : ($defuntMasculin ? 'fils' : 'enfant'),
    in_array($lienBrut, ['conjoint', 'conjointe', 'epoux', 'epouse', 'mari', 'femme'], true) =>
        $defuntFeminin ? 'épouse' : ($defuntMasculin ? 'époux' : 'conjoint(e)'),
    in_array($lienBrut, ['frere_soeur', 'frere', 'soeur'], true) =>
        $defuntFeminin ? 'sœur' : ($defuntMasculin ? 'frère' : 'frère/sœur'),
    default => 'proche',
};

// "mère de notre frère TURKSON Christian"
$lienPhrase = $nomMembre !== ''
    ? "{$motLien} de notre {$fratMot} " . $nomMembre
    : $motLien;

$defuntMaj = mb_strtoupper((string) $nomDefunt, 'UTF-8');
$classeMaj = $classe;

$decesLieuTexte = $lieuDeces !== '' ? " à {$lieuDeces}" : '';
$nomConducteurAff = $nomConducteur ?: 'Le conducteur de la classe';

/* ── Données de l'affiche « Programme des obsèques » (page 3) ── */

$ageDefunt = null;
if (!empty($details['date_naissance_defunt']) && !empty($details['date_deces'])) {
    try {
        $ageDefunt = (int) Carbon::parse($details['date_naissance_defunt'])
            ->diffInYears(Carbon::parse($details['date_deces']));
    } catch (\Throwable $e) {
        $ageDefunt = null;
    }
}

$photoDefuntSrc = null;
if ($membre && !empty($membre->photo_path)) {
    $photoDefuntSrc = $toStorageSignatureDataUri($membre->photo_path);
}

$fmtJour = function ($iso) {
    try {
        return mb_strtoupper(Carbon::parse($iso)->locale('fr')->isoFormat('dddd D MMMM YYYY'), 'UTF-8');
    } catch (\Throwable $e) {
        return (string) $iso;
    }
};

$programmeParJour = [];
foreach ($programmeEvenements as $ev) {
    $dfin = !empty($ev['date_fin']) && ($ev['date_fin'] !== ($ev['date_debut'] ?? null));
    $label = $dfin
        ? 'DU ' . $fmtJour($ev['date_debut'] ?? null) . ' AU ' . $fmtJour($ev['date_fin'])
        : $fmtJour($ev['date_debut'] ?? null);

    $hd = !empty($ev['heure'])
        ? (function () use ($ev) { try { return Carbon::createFromFormat('H:i', substr((string) $ev['heure'], 0, 5))->format('H\hi'); } catch (\Throwable $e) { return (string) $ev['heure']; } })()
        : '';
    $hf = !empty($ev['heure_fin'])
        ? (function () use ($ev) { try { return Carbon::createFromFormat('H:i', substr((string) $ev['heure_fin'], 0, 5))->format('H\hi'); } catch (\Throwable $e) { return (string) $ev['heure_fin']; } })()
        : '';

    $programmeParJour[$label][] = [
        'heure' => $hf !== '' ? ($hd . ' - ' . $hf) : $hd,
        'libelle' => $ev['libelle'] ?? '',
        'lieu' => $ev['lieu'] ?? '',
    ];
}

$lieuPrincipal = '';
foreach (array_reverse($programmeEvenements) as $ev) {
    if (!empty($ev['lieu'])) { $lieuPrincipal = $ev['lieu']; break; }
}
if ($lieuPrincipal === '') {
    $lieuPrincipal = $lieuDeces;
}

$contactsTel = collect([
    optional($acte->createur)->telephone,
    optional($acte->membre)->telephone,
    optional($acte->conducteur)->telephone,
])->filter()->map(fn ($t) => trim((string) $t))->filter()->unique()->take(2)->implode('  /  ');
@endphp
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Annonce Décès - {{ $reference }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 14mm 16mm 16mm 16mm;
        }

        /* Base document settings kept simple for dompdf reliability. */
        body {
            margin: 0;
            color: #1a1a1a;
            background: #ffffff;
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 14px;
            line-height: 1.6;
        }

        .page {
            padding: 3mm 8mm;
        }

        .doc-footer {
            position: fixed;
            left: 0; right: 0; bottom: 4mm;
            text-align: center;
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 9.5px;
            color: #7b8697;
            padding-top: 3mm;
            border-top: 1px solid #dce2eb;
        }
        .sheet { width: 100%; border-collapse: collapse; }
        .sheet > tbody > tr > td {
            vertical-align: bottom; /* corps + signature poussés vers le bas de page */
            padding-bottom: 8mm;    /* dégagement au-dessus du pied CONTACTS */
        }

        /* Header uses a table for stable PDF alignment with two logos and centered text. */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin: 4mm 0 7mm;
        }

        .header-table td {
            vertical-align: middle;
            padding: 0;
        }

        .logo-col {
            width: 80px;
        }

        .logo-col.left {
            text-align: left;
        }

        .logo-col.right {
            text-align: right;
        }

        .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
        }

        .header-center {
            text-align: center;
            padding: 0 12px;
        }

        .header-kicker {
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 1.1px;
            text-transform: uppercase;
            color: #2e3742;
        }

        .header-rule {
            width: 74px;
            height: 1px;
            margin: 5px auto;
            background: #b5bfce;
        }

        .header-sub {
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #5f6875;
        }

        .header-temple {
            margin-top: 8px;
            font-size: 16px;
            font-weight: 700;
            color: #1d2736;
        }

        /* Strong title band gives the document an official identity. */
        .title-band {
            margin: 0 0 7mm;
            padding: 2.5mm 0 3.5mm;
            text-align: center;
        }

        .title-label {
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 17px;
            font-weight: 800;
            letter-spacing: 1.8px;
            text-transform: uppercase;
            color: #C90714;
        }

        /* Metadata block keeps the top information compact and aligned. */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 7mm;
        }

        .meta-table td {
            padding: 6px 4px;
            vertical-align: top;
        }

        .meta-label {
            width: 155px;
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 9.3px;
            font-weight: 700;
            letter-spacing: .8px;
            text-transform: uppercase;
            color: #4b5563;
        }

        .meta-value {
            font-size: 11.3px;
            font-weight: 600;
            color: #1f2937;
        }

        /* Quote section introduces the notice and adds hierarchy. */
        .verse-card {
            margin: 0 0 7mm;
            padding: 4.5mm 5mm 4mm 7mm;
            border-left: 3px solid #264f9e;
            background: #f8fafc;
        }

        .verse-text {
            font-style: italic;
            color: #374151;
        }

        .verse-ref {
            margin-top: 5px;
            text-align: right;
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 9.3px;
            font-weight: 700;
            color: #6b7280;
        }

        /* Main notice block mirrors an official church circular. */
        .notice-block {
            margin-bottom: 6mm;
            padding: 0;
            background: #ffffff;
        }

        .notice-paragraph {
            margin: 0 0 4.2mm;
            text-align: justify;
        }

        .notice-paragraph:last-child {
            margin-bottom: 0;
        }

        .family-name,
        .deceased-name {
            font-weight: 700;
        }

        .support-block {
            margin-bottom: 6mm;
            padding: 1mm 0 0;
        }

        .support-line {
            margin: 0 0 3mm;
            font-weight: 700;
        }

        .support-ref {
            text-align: right;
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 9.3px;
            font-weight: 700;
            color: #6b7280;
        }

        /* Signatures are table-based for robust PDF placement and consistent alignment. */
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18mm;
        }

        .signature-table td {
            width: 33.33%;
            padding: 0 10px;
            text-align: center;
            vertical-align: top;
        }

        .signature-role {
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 9.6px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .8px;
            color: #374151;
        }

        .signature-rule {
            width: 120px;
            height: 1px;
            margin: 9px auto 16px;
            background: transparent;
        }

        .signature-box {
            height: 64px;
            text-align: center;
        }

        .signature-image {
            display: block;
            max-width: 250px;
            max-height: 130px;
            margin: 0 auto;
            object-fit: contain;
        }

        .signature-name {
            margin-top: 12px;
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #1f2937;
        }

        .signature-missing {
            margin-top: 18px;
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 8.9px;
            font-style: italic;
            color: #8b95a5;
        }

        .footer {
            margin-top: 10mm;
            padding-top: 3mm;
            border-top: 1px solid #dce2eb;
            text-align: center;
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 9.5px;
            color: #7b8697;
        }

        .page-break { page-break-after: always; }

        /* Gabarit pleine hauteur : en-tête en haut, corps centré, signature en bas. */
        .sheet-layout { width: 100%; height: 252mm; border-collapse: collapse; }
        .sheet-layout td { padding: 0; }
        .sheet-top { vertical-align: top; }
        .sheet-mid { vertical-align: middle; }
        .sheet-bot { vertical-align: bottom; }

        .letter-addressee {
            width: 62%;
            margin: 4mm 0 8mm auto;
            text-align: center;
            font-size: 12px;
            line-height: 1.5;
        }
        .letter-addressee .rev { font-weight: 700; }

        .letter-object {
            margin: 2mm 0 6mm;
            font-weight: 700;
            text-decoration: underline;
        }

        .letter-body p { font-size: 14px; line-height: 1.7; margin: 0 0 4.5mm; text-align: justify; }

        .sign-block {
            margin-top: 4mm;
            text-align: center;
        }
        .sign-block .sign-role {
            font-weight: 700;
            text-decoration: underline;
            margin-bottom: 4mm;
        }
        .sign-block .sign-img {
            display: block;
            max-width: 180px;
            max-height: 90px;
            margin: 0 auto 4px;
            object-fit: contain;
        }
        .sign-block .sign-name {
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-weight: 800;
            font-size: 12px;
            text-transform: uppercase;
        }

        /* ── Programme des obsèques (page 3) ── */
        .poster { padding: 4mm 2mm 6mm; }
        .poster-title { text-align: center; margin-bottom: 4mm; }
        .poster-title .sub {
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 1.6px;
            text-transform: uppercase;
            color: #0f2557;
        }
        .poster-hr {
            width: 64px; height: 2px; background: #b8860b; margin: 3mm auto 0;
        }
        .poster-identity td { vertical-align: middle; padding: 0 4mm; }
        .poster-photo {
            width: 110px; height: 138px; border: 3px solid #b8860b;
        }
        .poster-name {
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 15px; font-weight: 800; color: #0f2557; letter-spacing: .5px;
        }
        .poster-name-sub {
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-size: 10px; text-transform: uppercase; letter-spacing: .8px;
            margin-top: 1.5mm; color: #4b5563;
        }
        .day-band {
            background: #b8860b; color: #ffffff;
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-weight: 800; font-size: 11.5px; letter-spacing: 1px;
            padding: 2.6mm 4mm; margin: 6mm 0 0; text-transform: uppercase;
        }
        .ev-table { width: 100%; border-collapse: collapse; }
        .ev-table td {
            padding: 2.8mm 3mm; vertical-align: top; border-bottom: 1px solid #e2e6ec;
        }
        .ev-time {
            width: 96px; font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-weight: 800; font-size: 12px; color: #0f2557; white-space: nowrap;
        }
        .ev-desc { font-size: 11.3px; color: #1f2937; }
        .ev-desc .ev-lieu {
            display: block; font-size: 9.6px; color: #6b7280; margin-top: 1mm;
        }
        .poster-box { margin-top: 5mm; }
        .poster-box .k {
            font-family: Arial, "DejaVu Sans", Helvetica, sans-serif;
            font-weight: 800; color: #b8860b; font-size: 11.5px; letter-spacing: 1px;
        }
        .poster-box .v { color: #1f2937; font-size: 11.5px; }
        .poster-empty {
            margin: 10mm auto 0; max-width: 130mm; text-align: center;
            font-style: italic; color: #374151; font-size: 16px; line-height: 1.7;
        }
    </style>
</head>

<body>
    @php
        $enTete = '<table class="header-table"><tr>'
            . '<td class="logo-col left">' . ($logoMethoSrc ? '<img src="' . $logoMethoSrc . '" class="logo">' : '') . '</td>'
            . '<td class="header-center">'
            . '<div class="header-kicker">Eglise Methodiste de Cote d\'Ivoire</div>'
            . '<div class="header-rule"></div>'
            . '<div class="header-sub">District Abidjan Nord</div>'
            . '<div class="header-rule"></div>'
            . '<div class="header-temple">Temple du JUBILE de Cocody</div>'
            . '</td>'
            . '<td class="logo-col right">' . ($logoTempleSrc ? '<img src="' . $logoTempleSrc . '" class="logo">' : '') . '</td>'
            . '</tr></table>';

        $signature = '<div class="sign-block"><div class="sign-role">Pour les conducteurs de la classe</div>'
            . ($conducteurSignatureDataUri ? '<img src="' . $conducteurSignatureDataUri . '" class="sign-img">' : '')
            . '<div class="sign-name">' . e($nomConducteurAff) . '</div></div>';
    @endphp

    <div class="doc-footer">CONTACTS — israelclasse@gmail.com · www.classeisrael.org · Facebook : classeisraeljubile</div>

    {{-- ═══════════════ PAGE 1 — LETTRE AU PASTEUR ═══════════════ --}}
    <div class="page page-break">
        {!! $enTete !!}
        <div style="height:10mm"></div>
        @if($pasteurPrincipal !== '')
            <div class="letter-addressee">
                <span class="rev">Révérend {{ $pasteurPrincipal }}</span><br>
                Pasteur Principal du Jubilé de Cocody
            </div>
        @endif
        <div class="letter-object">Objet : Décès</div>
        <div class="letter-body">
            <p>Révérend Pasteur,</p>
            <p>Que la grâce et la paix du Seigneur Jésus-Christ, soient avec vous.</p>
            <p>
                La classe {{ $classeMaj }} a le regret de vous annoncer le décès de
                <strong>{{ $defuntMaj }}</strong>, {{ $lienPhrase }}, membre de la Classe {{ $classeMaj }}.
            </p>
            <p>Décès survenu le <strong>{{ $dateDeces }}</strong>{{ $decesLieuTexte }}.</p>
        </div>
        <table class="sheet"><tr><td style="height:420px">{!! $signature !!}</td></tr></table>
    </div>

    {{-- ═══════════════ PAGE 2 — NÉCROLOGIE ═══════════════ --}}
    <div class="page page-break">
        {!! $enTete !!}
        <div class="title-band"><div class="title-label">Nécrologie</div></div>
        <div style="height:8mm"></div>
        <div class="letter-body">
            <p>
                Le Conseil de l'Église{{ $pasteurPrincipal !== '' ? ', le Révérend ' . $pasteurPrincipal . ',' : ',' }}
                la Classe {{ $classeMaj }}, ont le regret de vous annoncer le décès de
                <strong>{{ $defuntMaj }}</strong>, {{ $lienPhrase }}, membre de la Classe {{ $classeMaj }}.
            </p>
            <p style="margin-top:7mm">Décès survenu le <strong>{{ $dateDeces }}</strong>{{ $decesLieuTexte }}.</p>
        </div>
        <table class="sheet"><tr><td style="height:400px">{!! $signature !!}</td></tr></table>
    </div>

    {{-- ═══════════════ PAGE 3 — PROGRAMME DES OBSÈQUES ═══════════════ --}}
    <div class="page poster">
        <table class="header-table">
            <tr>
                <td class="logo-col left">
                    @if($logoMethoSrc)<img src="{{ $logoMethoSrc }}" alt="Logo Methodiste" class="logo">@endif
                </td>
                <td class="header-center">
                    <div class="header-kicker">Eglise Methodiste de Cote d'Ivoire</div>
                    <div class="header-rule"></div>
                    <div class="header-sub">District Abidjan Nord</div>
                    <div class="header-rule"></div>
                    <div class="header-temple">Temple du JUBILE de Cocody</div>
                </td>
                <td class="logo-col right">
                    @if($logoTempleSrc)<img src="{{ $logoTempleSrc }}" alt="Logo Temple" class="logo">@endif
                </td>
            </tr>
        </table>

        <table class="sheet"><tr><td style="height:800px;vertical-align:middle;padding-bottom:0">
            <div class="poster-title">
                <div class="sub">Programme des obsèques</div>
                <div class="poster-hr"></div>
            </div>

            <table class="poster-identity" style="width:100%;border-collapse:collapse;margin-top:6mm">
                <tr>
                    <td style="width:130px">
                        @if($photoDefuntSrc)
                            <img src="{{ $photoDefuntSrc }}" alt="Photo" class="poster-photo">
                        @endif
                    </td>
                    <td>
                        @if($defuntMaj !== '' && $defuntMaj !== '—')
                            <div class="poster-name">{{ $defuntMaj }}</div>
                        @endif
                        @if($nomMembre !== '')
                            <div class="poster-name-sub">{{ ucfirst($motLien) }} de {{ $nomMembre }}</div>
                        @endif
                        @if($ageDefunt)
                            <div class="poster-name-sub">
                                {{ $defuntFeminin ? 'Décédée' : 'Décédé' }} dans sa {{ $ageDefunt }}<sup>e</sup> année
                            </div>
                        @endif
                    </td>
                </tr>
            </table>

            @if(count($programmeParJour))
                @foreach($programmeParJour as $jour => $evenements)
                    <div class="day-band">{{ $jour }}</div>
                    <table class="ev-table">
                        @foreach($evenements as $ev)
                            <tr>
                                <td class="ev-time">{{ $ev['heure'] !== '' ? $ev['heure'] : '—' }}</td>
                                <td class="ev-desc">
                                    {{ $ev['libelle'] }}
                                    @if(!empty($ev['lieu']))<span class="ev-lieu">{{ $ev['lieu'] }}</span>@endif
                                </td>
                            </tr>
                        @endforeach
                    </table>
                @endforeach

                @if($lieuPrincipal !== '')
                    <div class="poster-box">
                        <span class="k">LIEU :</span> <span class="v">{{ $lieuPrincipal }}</span>
                    </div>
                @endif
                @if(!$programmeClos)
                    <p style="margin-top:6mm;font-style:italic;font-size:11px;color:#6b7280">
                        Programme provisoire, susceptible d'être modifié.
                    </p>
                @endif
            @else
                <div class="poster-empty">
                    Le programme des obsèques sera communiqué ultérieurement.
                </div>
            @endif
        </td></tr></table>
    </div>
</body>

</html>
