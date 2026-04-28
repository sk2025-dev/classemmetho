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

$lieuDeces = trim((string) ($details['lieu_deces'] ?? $details['lieu'] ?? '—'));

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

$reference = $acte->reference ?? '—';
$dateEmission = optional($acte->created_at)->format('d/m/Y') ?? now()->format('d/m/Y');

$conducteur = $acte->conducteur ?? null;
$pasteur = $acte->pasteur ?? null;

$nomConducteur = $conducteur
    ? mb_strtoupper(trim(($conducteur->prenom ?? '') . ' ' . ($conducteur->nom ?? '')), 'UTF-8')
    : null;

$nomPasteur = $pasteur
    ? mb_strtoupper(trim(($pasteur->prenom ?? '') . ' ' . ($pasteur->nom ?? '')), 'UTF-8')
    : null;

$toStorageSignatureDataUri = function (?string $signaturePath): ?string {
    if (empty($signaturePath) || !is_string($signaturePath)) {
        return null;
    }

    if (str_starts_with($signaturePath, 'data:image/')) {
        return $signaturePath;
    }

    $fullPath = storage_path('app/public/' . ltrim($signaturePath, '/'));
    if (!is_file($fullPath)) {
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

$logoTempleSrc = $logoDataUri ?? $toPublicImageDataUri(public_path('images/logo.png'));
$logoMethoSrc = $methoDataUri ?? $toPublicImageDataUri(public_path('images/metho.jpg'));
@endphp
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Annonce de Deces - {{ $reference }}</title>
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
            font-family: DejaVu Serif, "Times New Roman", serif;
            font-size: 11.2px;
            line-height: 1.68;
        }

        .page {
            padding: 6mm 8mm 4mm;
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
            font-family: DejaVu Sans, Arial, sans-serif;
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
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #5f6875;
        }

        .header-temple {
            margin-top: 8px;
            font-size: 18.5px;
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
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 25px;
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
            font-family: DejaVu Sans, Arial, sans-serif;
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
            font-family: DejaVu Sans, Arial, sans-serif;
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
            font-family: DejaVu Sans, Arial, sans-serif;
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
            font-family: DejaVu Sans, Arial, sans-serif;
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
            max-width: 120px;
            max-height: 46px;
            margin: 0 auto;
            object-fit: contain;
        }

        .signature-name {
            margin-top: 12px;
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #1f2937;
        }

        .signature-missing {
            margin-top: 18px;
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 8.9px;
            font-style: italic;
            color: #8b95a5;
        }

        .footer {
            margin-top: 10mm;
            padding-top: 3mm;
            border-top: 1px solid #dce2eb;
            text-align: center;
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 8.6px;
            color: #7b8697;
        }
    </style>
</head>

<body>
    <div class="page">
        <!-- Official church header: logo / institution / logo -->
        <table class="header-table">
            <tr>
                <td class="logo-col left">
                    @if($logoMethoSrc)
                    <img src="{{ $logoMethoSrc }}" alt="Logo Methodiste" class="logo">
                    @endif
                </td>
                <td class="header-center">
                    <div class="header-kicker">Eglise Methodiste de Cote d'Ivoire</div>
                    <div class="header-rule"></div>
                   
                    <div class="header-temple">Temple du JUBILE de Cocody</div>
                </td>
                <td class="logo-col right">
                    @if($logoTempleSrc)
                    <img src="{{ $logoTempleSrc }}" alt="Logo Temple" class="logo">
                    @endif
                </td>
            </tr>
        </table>

        <!-- Main title band -->
        <div class="title-band">
            <div class="title-label">Annonce de Deces</div>
        </div>

        <!-- Compact metadata keeps the first reading level clean -->
        <table class="meta-table">
            <tr>
                <td class="meta-label">Classe Methodiste</td>
                <td class="meta-value">{{ $classe }}</td>
            </tr>
        </table>

        <!-- Opening verse -->
        <div class="verse-card">
            <div class="verse-text">
                &laquo; J&eacute;sus lui dit : Je suis la r&eacute;surrection et la vie. Celui qui croit en moi vivra, quand m&ecirc;me il serait mort. &raquo;
            </div>
            <div class="verse-ref">Jean 11 : 25</div>
        </div>

        <!-- Main notice body -->
        <div class="notice-block">
            <p class="notice-paragraph">
                La famille <span class="family-name">{{ mb_strtoupper($famille, 'UTF-8') }}</span>
                annonce, avec une profonde tristesse, &agrave; l'ensemble de la communaut&eacute; chr&eacute;tienne,
                le rappel &agrave; Dieu de leur bien-aim&eacute;(e),
                <span class="deceased-name">{{ $nomDefunt }}</span>,
                survenu le <strong>{{ $dateDeces }}</strong> &agrave; <strong>{{ $lieuDeces }}</strong>.
            </p>
            <p class="notice-paragraph">
                En cette douloureuse &eacute;preuve, la famille sollicite vos pri&egrave;res et votre soutien spirituel.
            </p>
            <p class="notice-paragraph">
                Les informations relatives aux obs&egrave;ques vous seront communiqu&eacute;es ult&eacute;rieurement.
            </p>
        </div>

        <!-- Signature area -->
        <table class="signature-table">
            <tr>
                <td>
                    <div class="signature-role">Conducteur de la Classe</div>
                    <div class="signature-rule"></div>
                    <div class="signature-box">
                        @if($conducteurSignatureDataUri)
                        <img src="{{ $conducteurSignatureDataUri }}" alt="Signature conducteur" class="signature-image">
                        @endif
                    </div>
                    @if($nomConducteur)
                    <div class="signature-name">{{ $nomConducteur }}</div>
                    @else
                    <div class="signature-missing">Non renseigne</div>
                    @endif
                </td>
                <td>
                    <div class="signature-role">Bureau des Conducteurs</div>
                    <div class="signature-rule"></div>
                    <div class="signature-box"></div>
                    <div class="signature-name">&nbsp;</div>
                </td>
                <td>
                    <div class="signature-role">Pasteur</div>
                    <div class="signature-rule"></div>
                    <div class="signature-box">
                        @if($pasteurSignatureDataUri)
                        <img src="{{ $pasteurSignatureDataUri }}" alt="Signature pasteur" class="signature-image">
                        @endif
                    </div>
                    @if($nomPasteur)
                    <div class="signature-name">{{ $nomPasteur }}</div>
                    @else
                    <div class="signature-missing">Non renseigne</div>
                    @endif
                </td>
            </tr>
        </table>

        <!-- Footer for traceability -->
        <div class="footer">
            EMUCI - Temple du JUBILE de Cocody | Avis de deces | Ref. {{ $reference }} | Emis le {{ $dateEmission }}
        </div>
    </div>
</body>

</html>
