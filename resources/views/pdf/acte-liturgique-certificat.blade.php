<!doctype html>
<html lang="fr">

<head>
    <meta charset="utf-8">
    <title>Certificat {{ $acte->reference }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html,
        body {
            width: 297mm;
            height: 210mm;
            overflow: hidden;
            background: #fff;
            font-family: Georgia, 'Times New Roman', serif;
            color: #1a1e2e;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /*
         * ══════════════════════════════════════════════════════
         *  STRATÉGIE PLEINE PAGE (inspirée Google Cloud cert)
         *
         *  La page est découpée en ZONES VERTICALES avec des
         *  hauteurs fixes en mm qui totalisent exactement 210mm.
         *  Chaque zone a un rôle et une respiration généreuse.
         *
         *  ZONE 1 – En-tête     : 52mm  (logo + titre + lignes)
         *  ZONE 2 – Bénéficiaire: 48mm  (nom + attestation)
         *  ZONE 3 – Médiane     : 18mm  (séparateur décoratif)
         *  ZONE 4 – Signature   : 60mm  (pasteur + sceau + date)
         *  ZONE 5 – Pied        : 32mm  (réf + mention légale)
         *  TOTAL                : 210mm ✓
         * ══════════════════════════════════════════════════════
         */

        /* Wrapper page */
        .page {
            width: 297mm;
            height: 210mm;
            background: #fff;
            position: relative;
        }

        /* ── Cadre double ── */
        .frame-outer {
            position: absolute;
            top: 0mm;
            left: 0mm;
            right: 0mm;
            bottom: 0mm;
            border: 5px solid #0F1E40;
        }

        .frame-inner {
            position: absolute;
            top: 9mm;
            left: 9mm;
            right: 9mm;
            bottom: 9mm;
            border: 1.5px solid #B6C01A;
        }

        /* ── Bandes latérales tricolores ── */
        .band-left,
        .band-right {
            position: absolute;
            top: 12mm;
            bottom: 12mm;
            width: 4px;
        }

        .band-left {
            left: 12mm;
        }

        .band-right {
            right: 12mm;
        }

        /* ── Table principale : 1 colonne centrale sur toute la hauteur ── */
        /*
         * DomPDF ne supporte pas flexbox.
         * On utilise une <table> HTML avec height="210mm"
         * et des <tr> dont chaque height est fixé en mm.
         * C'est la technique la plus fiable pour remplir
         * toute la page sans vide.
         */
        .master {
            width: 297mm;
            height: 210mm;
            border-collapse: collapse;
        }

        .master td {
            padding: 0;
        }

        /* Colonnes latérales décoratives (bandes) */
        .col-side {
            width: 18mm;
        }

        /* Colonne centrale */
        .col-center {
            text-align: center;
        }

        /* ── Zones de hauteur fixes ── */
        .zone-header {
            height: 52mm;
            vertical-align: middle;
        }

        .zone-name {
            height: 48mm;
            vertical-align: middle;
        }

        .zone-separator {
            height: 14mm;
            vertical-align: middle;
        }

        .zone-signature {
            height: 64mm;
            vertical-align: middle;
        }

        .zone-footer {
            height: 32mm;
            vertical-align: bottom;
        }
    </style>
</head>

<body>

    @php
    $typeLabels = [
    'bapteme' => 'BAPTÊME',
    'mariage' => 'MARIAGE',
    // 'funerailles' => 'FUNÉRAILLES',
    // 'deces' => 'DÉCÈS',
    // 'remerciement' => 'REMERCIEMENT',
    // 'felicitations'=> 'FÉLICITATIONS',
    // 'naissance' => 'NAISSANCE',
    // 'communion' => 'COMMUNION',
    ];
    $typeLabel = $typeLabels[$acte->type_acte ?? ''] ?? strtoupper(str_replace('_', ' ', $acte->type_acte ?? 'ACTE LITURGIQUE'));

    $attestationPhrases = [
    'bapteme' => 'a reçu le sacrement saint du Baptême au sein de notre communauté paroissiale, marquant son entrée solennelle dans la famille de Dieu.',
    'mariage' => 'ont uni leurs vies par le sacrement du Mariage, témoignant de leur amour et de leur engagement devant Dieu et l\'Assemblée.',
    // 'funerailles' => 'a été conduit avec dignité et prière vers la maison du Père, en présence de ses proches et de toute la communauté.',
    // 'deces' => 'a été accompagné dans son dernier voyage par notre communauté paroissiale réunie dans la prière et la foi.',
    // 'remerciement' => 'a généreusement soutenu et contribué à la vie de notre communauté paroissiale.',
    // 'felicitations'=> 'a reçu les félicitations solennelles de l\'Église Méthodiste Jubilé de Cocody.',
    // 'naissance' => 'a été accueilli dans la joie et la grâce au sein de notre communauté paroissiale.',
    // 'communion' => 'a reçu le sacrement de la Sainte Communion, partageant le Corps et le Sang de notre Seigneur Jésus-Christ.',
    ];
    $attestation = $attestationPhrases[$acte->type_acte ?? ''] ?? 'a reçu cet acte liturgique au sein de notre communauté.';

    $fullName = trim(($acte->membre->prenom ?? '') . ' ' . ($acte->membre->nom ?? '')) ?: 'Nom et Prénom';

    // Pour le mariage : afficher les deux conjoints
    $displayName = $fullName;
    $subtitleText = "Ce certificat est décerné à";
    $mariageLieu = '';

    if ($acte->type_acte === 'mariage') {
    $details = $acte->details ?? [];
    $conjoint1 = trim((string) ($details['conjoint_1'] ?? '')) ?: '';
    $conjoint2 = trim((string) ($details['conjoint_2'] ?? '')) ?: $fullName;
    $epoux_prenom_val = trim((string) ($details['epoux_prenom'] ?? ''));
    $epoux_nom_val = trim((string) ($details['epoux_nom'] ?? ''));

    // Si conjoint_1 est vide, essayer de construire à partir de epoux_nom/epoux_prenom
    if (empty($conjoint1)) {
    $conjoint1 = trim($epoux_prenom_val . ' ' . $epoux_nom_val) ?: '';
    }

    if (!empty($conjoint1)) {
    $displayName = $conjoint1 . ' & ' . $conjoint2;
    }

    $subtitleText = '';
    $mariageLieu = trim((string) ($details['lieu'] ?? $details['lieu_mariage'] ?? ''));
    }

    $dateActe = optional($acte->date_souhaitee)->format('d/m/Y') ?? now()->format('d/m/Y');
    $reference = $acte->reference ?? ('ACTE-' . $acte->id);

    $signatureDisplayName = trim((string)($signatureName ?? ''));
    if ($signatureDisplayName === '') {
    $signatureDisplayName = trim(($acte->pasteur->prenom ?? '') . ' ' . ($acte->pasteur->nom ?? ''));
    }
    if ($signatureDisplayName === '') {
    $signatureDisplayName = "N'GORAN MISS";
    }

    $signatureTitle = trim((string)($signatureRole ?? '')) ?: 'Pasteur Principal';

    $signatureDataUri = $signaturePasteurDataUri ?? null;
    if (empty($signatureDataUri) && !empty($signaturePath) && is_string($signaturePath)) {
    if (str_starts_with($signaturePath, 'data:image/')) {
    $signatureDataUri = $signaturePath;
    } elseif (file_exists($signaturePath)) {
    $signatureExt = strtolower(pathinfo($signaturePath, PATHINFO_EXTENSION) ?: 'png');
    $signatureRaw = @file_get_contents($signaturePath);
    if ($signatureRaw !== false) {
    $signatureDataUri = 'data:image/' . $signatureExt . ';base64,' . base64_encode($signatureRaw);
    }
    }
    }
    @endphp

    <div class="page">

        {{-- ── Cadres décoratifs ── --}}
        <div class="frame-outer"></div>
        <div class="frame-inner"></div>

        {{-- ── Bandes latérales tricolores ── --}}
        {{-- GAUCHE --}}
        <div class="band-left">
            <!-- <div style="width:4px; height:33%; background:#6B46C1;"></div>
            <div style="width:4px; height:34%; background:#1E40AF;"></div>
            <div style="width:4px; height:33%; background:#B6C01A;"></div> -->
        </div>
        {{-- DROITE --}}
        <div class="band-right">
            <!-- <div style="width:4px; height:33%; background:#6B46C1;"></div>
            <div style="width:4px; height:34%; background:#1E40AF;"></div>
            <div style="width:4px; height:33%; background:#B6C01A;"></div> -->
        </div>

        {{-- ══════════════════════════════════════════════════
         TABLE MAÎTRE — découpe la page en zones de hauteur
         fixe pour remplir les 210mm de façon fiable
    ══════════════════════════════════════════════════ --}}
        <table class="master" cellpadding="0" cellspacing="0">

            {{-- ╔══════════════════════════════════════╗
             ║  ZONE 1 — EN-TÊTE  (52mm)            ║
             ║  Logo | Nom église + Titre | QR Code  ║
             ╚══════════════════════════════════════╝ --}}
            <tr>
                {{-- Colonne gauche : Logo --}}
                <td class="col-side zone-header" style="text-align:center; vertical-align:middle; padding-left:18mm;">
                    <div style="width:62px; height:62px; border:2px solid #6B46C155;
                            border-radius:10px; background:#f3f0ff;
                            margin:0 auto; overflow:hidden; padding:3px;">
                        @if(!empty($logoDataUri))
                        <img src="{{ $logoDataUri }}" width="54" height="54" style="border-radius:8px;">
                        @elseif(file_exists(public_path('images/logo.png')))
                        <img src="{{ public_path('images/logo.png') }}" width="54" height="54" style="border-radius:8px;">
                        @else
                        <div style="font-size:7px; font-weight:800; letter-spacing:1px;
                                    text-transform:uppercase; color:#6B46C1; line-height:1.5;
                                    padding-top:14px; text-align:center;">
                            LOGO<br>EMJC
                        </div>
                        @endif
                    </div>
                </td>

                {{-- Colonne centrale : Titre principal --}}
                <td class="col-center zone-header" style="padding:0 10mm;">
                    {{-- Nom de l'église --}}
                    <div style="font-size:8px; font-weight:700; letter-spacing:5px;
                            text-transform:uppercase; color:#6B46C1; margin-bottom:6mm;">
                        Église Méthodiste Jubilé de Cocody
                    </div>

                    {{-- Titre avec lignes latérales --}}
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:3mm;">
                        <tr valign="middle">
                            <td style="border-bottom:2px solid #6B46C1; width:14%; font-size:0;">&nbsp;</td>
                            <td width="8" style="font-size:0;">&nbsp;</td>
                            <td style="text-align:center; white-space:nowrap;">
                                <span style="font-size:22px; font-weight:900; letter-spacing:5px;
                                         text-transform:uppercase; color:#0F1E40;">
                                    CERTIFICAT DE {{ $typeLabel }}
                                </span>
                            </td>
                            <td width="8" style="font-size:0;">&nbsp;</td>
                            <td style="border-bottom:2px solid #6B46C1; width:14%; font-size:0;">&nbsp;</td>
                        </tr>
                    </table>

                    {{-- Ligne tricolore sous le titre --}}
                    <table width="50%" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                            <td width="33%" height="3" style="background:#6B46C1; font-size:0;">&nbsp;</td>
                            <td width="34%" height="3" style="background:#1E40AF; font-size:0;">&nbsp;</td>
                            <td width="33%" height="3" style="background:#B6C01A; font-size:0;">&nbsp;</td>
                        </tr>
                    </table>
                </td>

                {{-- Colonne droite : QR Code --}}
                <td class="col-side zone-header" style="text-align:center; vertical-align:middle; padding-right:18mm;">
                    @if(!empty($qrDataUri))
                    <img src="{{ $qrDataUri }}" width="62" height="62"
                        style="border:2px solid #B6C01A; border-radius:6px; padding:3px; background:#fff;">
                    @else
                    <div style="width:62px; height:62px; border:2px solid #B6C01A;
                                border-radius:6px; background:#f9f9f0; margin:0 auto;
                                text-align:center; padding-top:21px;">
                        <span style="font-size:7px; font-weight:700; color:#9098b4;">QR<br>CODE</span>
                    </div>
                    @endif
                    <div style="font-size:7px; color:#9098b4; margin-top:2mm; letter-spacing:0.5px;">
                        Vérification
                    </div>
                </td>
            </tr>

            {{-- ╔══════════════════════════════════════╗
             ║  ZONE 2 — BÉNÉFICIAIRE  (48mm)       ║
             ║  Sous-titre + Grand nom + Attestation ║
             ╚══════════════════════════════════════╝ --}}
            <tr>
                <td class="col-side" style="padding-left:18mm;"></td>

                <td class="col-center zone-name" style="padding:0 8mm;">

                    {{-- Sous-titre --}}
                    @if(!empty($subtitleText))
                    <div style="font-size:18px; color:#5a6478; font-style:italic;
                            margin-bottom:4mm; letter-spacing:0.5px;">
                        {{ $subtitleText }}
                    </div>
                    @endif

                    @if($acte->type_acte !== 'mariage')
                    {{-- Grand nom du bénéficiaire --}}
                    <div style="font-size:32px; font-weight:900; text-transform:uppercase;
                            letter-spacing:4px; color:#0F1E40; line-height:1.1; margin-bottom:3mm;">
                        {{ strtoupper($displayName) }}
                    </div>

                    {{-- Ligne décorative sous le nom --}}
                    <table width="40%" cellpadding="0" cellspacing="0" style="margin:0 auto 5mm;">
                        <tr>
                            <td width="33%" height="2" style="background:#6B46C160; font-size:0;">&nbsp;</td>
                            <td width="34%" height="2" style="background:#B6C01A; font-size:0;">&nbsp;</td>
                            <td width="33%" height="2" style="background:#6B46C160; font-size:0;">&nbsp;</td>
                        </tr>
                    </table>
                    @endif

                    {{-- Texte d'attestation --}}
                    <div style="font-size:{{ $acte->type_acte === 'mariage' ? '21px' : '18px' }}; color:#374151; line-height:{{ $acte->type_acte === 'mariage' ? '1.9' : '1.8' }};
                            text-align:center; max-width:85%; margin:0 auto;">
                        @if($acte->type_acte === 'mariage')
                        L'Église Méthodiste Jubilé de Cocody atteste solennellement que
                        <span style="font-weight:700; color:#0F1E40;">{{ strtoupper($displayName) }}</span>
                        ont été unis par le sacrement du Mariage, le
                        <span style="font-weight:700; color:#0F1E40;">{{ $dateActe }}</span>
                        devant Dieu et l'Assemblée
                        @if(!empty($mariageLieu))
                        à <span style="font-weight:700; color:#0F1E40;">{{ $mariageLieu }}</span>.
                        @else
                        .
                        @endif
                        @else
                        L'Église Méthodiste Jubilé de Cocody atteste solennellement que la personne
                        mentionnée ci-dessus
                        <span style="font-weight:700; color:#0F1E40;">{{ $attestation }}</span>
                        Le présent certificat est délivré pour servir et valoir ce qui lui revient de droit.
                        @endif
                    </div>

                </td>

                <td class="col-side" style="padding-right:18mm;"></td>
            </tr>

            {{-- ╔══════════════════════════════════════════════════╗
             ║  ZONE 3 — SÉPARATEUR THÉMATIQUE (14mm)           ║
             ║  Icône SVG inline selon le type d'acte liturgique ║
             ║  (DomPDF supporte SVG inline nativement)          ║
             ╚══════════════════════════════════════════════════╝ --}}
            @php
            /*
            * Chaque icône est un SVG 32×32 dessiné avec des formes
            * simples (cercles, paths, rects) compatibles DomPDF.
            * Couleurs : #1E40AF (bleu) · #6B46C1 (violet) · #B6C01A (or-vert)
            */
            $typeIcons = [

            // 💧 BAPTÊME — goutte d'eau
            'bapteme' => '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4 C16 4 7 16 7 21 C7 26 11 29 16 29 C21 29 25 26 25 21 C25 16 16 4 16 4Z"
                    fill="#1E40AF" opacity="0.85" />
                <path d="M16 4 C16 4 7 16 7 21 C7 26 11 29 16 29 C21 29 25 26 25 21 C25 16 16 4 16 4Z"
                    fill="none" stroke="#6B46C1" stroke-width="1.2" />
                <ellipse cx="12" cy="19" rx="2" ry="3" fill="#ffffff" opacity="0.4" />
            </svg>',

            // 💍 MARIAGE — bague avec pierre
            'mariage' => '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="18" r="9" fill="none" stroke="#B6C01A" stroke-width="3.5" />
                <circle cx="16" cy="18" r="5.5" fill="none" stroke="#6B46C155" stroke-width="1" />
                <polygon points="16,5 19,10 24,10 20,14 22,19 16,15 10,19 12,14 8,10 13,10"
                    fill="#6B46C1" opacity="0.9" />
                <polygon points="16,7 18.5,11 22,11 19.2,13.5 20.5,17 16,14.5 11.5,17 12.8,13.5 10,11 13.5,11"
                    fill="#B6C01A" opacity="0.7" />
            </svg>',

            // 🕊 FUNÉRAILLES — colombe stylisée
            'funerailles' => '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="17" cy="17" rx="7" ry="5" fill="#9098b4" opacity="0.8" />
                <path d="M10 17 C6 14 4 10 8 9 C10 8.5 11 10 10 12" fill="#6B46C1" opacity="0.75" />
                <path d="M14 12 C16 6 22 6 20 12" fill="#1E40AF" opacity="0.7" />
                <circle cx="21" cy="14" r="1.5" fill="#0F1E40" />
                <path d="M10 22 L16 20 L22 22" stroke="#9098b4" stroke-width="1" fill="none" />
                <path d="M14 22 L15 26 L16 22" fill="#9098b4" opacity="0.6" />
            </svg>',

            // ✝ DÉCÈS — croix latine
            'deces' => '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect x="14" y="4" width="4" height="24" rx="1" fill="#0F1E40" opacity="0.8" />
                <rect x="7" y="10" width="18" height="4" rx="1" fill="#0F1E40" opacity="0.8" />
                <rect x="14.5" y="4.5" width="3" height="23" rx="0.5" fill="#6B46C1" opacity="0.3" />
                <rect x="7.5" y="10.5" width="17" height="3" rx="0.5" fill="#6B46C1" opacity="0.3" />
            </svg>',

            // 🙏 REMERCIEMENT — étoile rayonnante
            'remerciement' => '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="6" fill="#B6C01A" opacity="0.9" />
                <line x1="16" y1="4" x2="16" y2="8" stroke="#B6C01A" stroke-width="2" stroke-linecap="round" />
                <line x1="16" y1="24" x2="16" y2="28" stroke="#B6C01A" stroke-width="2" stroke-linecap="round" />
                <line x1="4" y1="16" x2="8" y2="16" stroke="#B6C01A" stroke-width="2" stroke-linecap="round" />
                <line x1="24" y1="16" x2="28" y2="16" stroke="#B6C01A" stroke-width="2" stroke-linecap="round" />
                <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="#6B46C1" stroke-width="1.5" stroke-linecap="round" />
                <line x1="21.5" y1="21.5" x2="24.5" y2="24.5" stroke="#6B46C1" stroke-width="1.5" stroke-linecap="round" />
                <line x1="7.5" y1="24.5" x2="10.5" y2="21.5" stroke="#6B46C1" stroke-width="1.5" stroke-linecap="round" />
                <line x1="21.5" y1="10.5" x2="24.5" y2="7.5" stroke="#6B46C1" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="16" cy="16" r="3" fill="#ffffff" opacity="0.6" />
            </svg>',

            // 🌟 FÉLICITATIONS — étoile à 5 branches
            'felicitations' => '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <polygon points="16,3 19.5,12 29,12 21.5,18 24.5,28 16,22 7.5,28 10.5,18 3,12 12.5,12"
                    fill="#B6C01A" opacity="0.9" />
                <polygon points="16,6 19,13 27,13 21,18 23.5,26 16,21 8.5,26 11,18 5,13 13,13"
                    fill="#ffffff" opacity="0.25" />
                <circle cx="16" cy="16" r="3" fill="#6B46C1" opacity="0.7" />
            </svg>',

            // 👶 NAISSANCE — petit soleil / étoile naissante
            'naissance' => '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="7" fill="#B6C01A" opacity="0.9" />
                <line x1="16" y1="3" x2="16" y2="7" stroke="#B6C01A" stroke-width="2.5" stroke-linecap="round" />
                <line x1="16" y1="25" x2="16" y2="29" stroke="#B6C01A" stroke-width="2.5" stroke-linecap="round" />
                <line x1="3" y1="16" x2="7" y2="16" stroke="#B6C01A" stroke-width="2.5" stroke-linecap="round" />
                <line x1="25" y1="16" x2="29" y2="16" stroke="#B6C01A" stroke-width="2.5" stroke-linecap="round" />
                <line x1="6.5" y1="6.5" x2="9.5" y2="9.5" stroke="#1E40AF" stroke-width="2" stroke-linecap="round" />
                <line x1="22.5" y1="22.5" x2="25.5" y2="25.5" stroke="#1E40AF" stroke-width="2" stroke-linecap="round" />
                <line x1="6.5" y1="25.5" x2="9.5" y2="22.5" stroke="#1E40AF" stroke-width="2" stroke-linecap="round" />
                <line x1="22.5" y1="9.5" x2="25.5" y2="6.5" stroke="#1E40AF" stroke-width="2" stroke-linecap="round" />
                <circle cx="16" cy="16" r="4" fill="#ffffff" opacity="0.5" />
            </svg>',

            // 🍞 COMMUNION — calice / coupe
            'communion' => '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6 L23 6 L20 16 C20 20 18 22 16 22 C14 22 12 20 12 16 Z"
                    fill="#6B46C1" opacity="0.85" />
                <path d="M9 6 L23 6 L20 16 C20 20 18 22 16 22 C14 22 12 20 12 16 Z"
                    fill="none" stroke="#B6C01A" stroke-width="1.2" />
                <rect x="14.5" y="22" width="3" height="5" rx="1" fill="#6B46C1" opacity="0.8" />
                <rect x="11" y="27" width="10" height="2" rx="1" fill="#B6C01A" opacity="0.9" />
                <ellipse cx="16" cy="11" rx="4" ry="2" fill="#ffffff" opacity="0.2" />
            </svg>',
            ];

            // Icône par défaut si type inconnu : losange décoratif
            $defaultIcon = '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <polygon points="16,4 28,16 16,28 4,16" fill="none" stroke="#B6C01A" stroke-width="2" />
                <polygon points="16,8 24,16 16,24 8,16" fill="#EB992D" opacity="0.3" />
                <circle cx="16" cy="16" r="3" fill="#E48724" />
            </svg>';

            $acteIcon = $typeIcons[$acte->type_acte ?? ''] ?? $defaultIcon;
            @endphp
            <tr>
                <td class="col-side" style="padding-left:18mm;"></td>
                <td class="col-center zone-separator" style="padding:0 8mm;">
                    <table width="80%" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr valign="middle">
                            {{-- Ligne gauche --}}
                            <td style="border-bottom:1px solid #d0d4e8; font-size:0;">&nbsp;</td>

                            {{-- Petit carré décoratif gauche --}}
                            <td width="20" style="text-align:center; padding:0 6px;">
                                <div style="width:6px; height:6px; background:#6B46C155; margin:0 auto;"></div>
                            </td>

                            {{-- Icône SVG thématique centrale --}}
                            <td width="44" style="text-align:center; vertical-align:middle;">
                                {!! $acteIcon !!}
                            </td>

                            {{-- Petit carré décoratif droit --}}
                            <td width="20" style="text-align:center; padding:0 6px;">
                                <div style="width:6px; height:6px; background:#B6C01A; margin:0 auto;"></div>
                            </td>

                            {{-- Ligne droite --}}
                            <td style="border-bottom:1px solid #d0d4e8; font-size:0;">&nbsp;</td>
                        </tr>
                    </table>
                </td>
                <td class="col-side" style="padding-right:18mm;"></td>
            </tr>

            {{-- ╔══════════════════════════════════════╗
             ║  ZONE 4 — SIGNATURE  (64mm)           ║
             ║  "LE PASTEUR" + ligne + nom signataire ║
             ╚══════════════════════════════════════╝ --}}
            <tr>
                <td class="col-side" style="padding-left:18mm;"></td>

                <td class="col-center zone-signature" style="padding:0 8mm;">

                    <table width="90%" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr valign="top">

                            {{-- Signature à gauche --}}
                            <td width="40%" style="text-align:left;">

                                <div style="font-size:20px; font-weight:700; letter-spacing:2px;
                                        text-transform:uppercase; color:#9098b4; margin-bottom:8mm;">
                                    Le Pasteur
                                </div>

                                {{-- Image de signature si disponible --}}
                                @if(!empty($signatureDataUri))
                                <img src="{{ $signatureDataUri }}"
                                    style="max-width:200px; max-height:60px;
                                            display:block; margin:0 0 4mm;">
                                @else
                                <div style="height:60px; margin-bottom:4mm;"></div>
                                @endif

                                {{-- Nom du pasteur --}}
                                <div style="font-size:14px; font-weight:800; text-transform:uppercase;
                                        letter-spacing:1px; color:#0F1E40; margin-bottom:2mm;">
                                    {{ strtoupper($signatureDisplayName) }}
                                </div>

                            </td>

                            {{-- Lieu & Date à droite en bas --}}
                            <td width="60%" style="text-align:right; vertical-align:bottom; padding-bottom:6mm;">
                                <div style="font-size:20px; color:#4b5563; font-weight:600;
                                        line-height:2.2; letter-spacing:0.3px;">
                                    Fait à Cocody<br>
                                    Le {{ $dateActe }}
                                </div>
                            </td>

                        </tr>
                    </table>

                </td>

                <td class="col-side" style="padding-right:18mm;"></td>
            </tr>

            {{-- ╔══════════════════════════════════════╗
             ║  ZONE 5 — PIED DE PAGE  (32mm)       ║
             ║  Réf + mention légale centrée         ║
             ╚══════════════════════════════════════╝ --}}
            <!-- <tr>
                <td class="col-side" style="padding-left:18mm; vertical-align:bottom; padding-bottom:10mm;"></td>

                <td class="col-center zone-footer" style="padding:0 8mm; vertical-align:bottom; padding-bottom:10mm;">

                    {{-- Filet de séparation --}}
                    <table width="95%" cellpadding="0" cellspacing="0" style="margin:0 auto 4mm;">
                        <tr>
                            <td width="33%" height="1" style="background:#6B46C140; font-size:0;">&nbsp;</td>
                            <td width="34%" height="1" style="background:#B6C01A; font-size:0;">&nbsp;</td>
                            <td width="33%" height="1" style="background:#F9B01C40; font-size:0;">&nbsp;</td>
                        </tr>
                    </table>

                    {{-- Ligne réf + mention légale --}}
                    <table width="95%" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr valign="middle">

                            {{-- Badge référence --}}
                            <td width="30%" style="text-align:left;">
                                <table cellpadding="4" cellspacing="0"
                                    style="background:#f3f0ff; border:1.5px solid #6B46C135; border-radius:5px;">
                                    <tr>
                                        <td style="font-size:8px; font-weight:700; color:#6B46C1;
                                               letter-spacing:0.5px; text-transform:uppercase; white-space:nowrap;">
                                            Réf : {{ $reference }}
                                        </td>
                                    </tr>
                                </table>
                            </td>

                            {{-- Mention légale centrée --}}
                            <td width="40%" style="text-align:center;">
                                <div style="font-size:9px; color:#9098b4; letter-spacing:0.5px; line-height:1.5; font-style:italic;">
                                    Ce document est un acte officiel de l'Église Méthodiste Jubilé de Cocody.<br>
                                    Toute falsification est passible de poursuites judiciaires.
                                </div>
                            </td>

                            {{-- Sceau / logo discret --}}
                            <td width="30%" style="text-align:right;">
                                <div style="font-size:9px; color:#9098b4; letter-spacing:0.5px; font-style:italic;">
                                    emjc-paroisse.ci
                                </div>
                            </td>

                        </tr>
                    </table>

                </td>

                <td class="col-side" style="padding-right:18mm; vertical-align:bottom; padding-bottom:10mm;"></td>
            </tr>

        </table>
        {{-- ══ FIN TABLE MAÎTRE ══ --}}

    </div> -->
</body>

</html>