@php
use App\Models\ActeLiturgique;
use Carbon\Carbon;

$details = $acte->details ?? [];
$createur = $acte->createur ?? $acte->membre ?? null;
$nomComplet = trim(($createur->prenom ?? '') . ' ' . ($createur->nom ?? '')) ?: '—';
$telephone = $createur->telephone ?? $createur->telephone2 ?? '—';
$classe = $createur->classe?->nom ?? $acte->classe?->nom ?? 'Non définie';
$famille = $createur->family?->nom ?? ($acte->family?->nom ?? 'Famille inconnue');
$conducteur = $acte->conducteur ?? $acte->classe?->conducteur ?? null;
$pasteur = $acte->pasteur ?? null;
$nomConducteur = $conducteur
    ? trim(($conducteur->prenom ?? '') . ' ' . ($conducteur->nom ?? ''))
    : 'Conducteur non renseigné';
$nomPasteur = $pasteur
    ? trim(($pasteur->prenom ?? '') . ' ' . ($pasteur->nom ?? ''))
    : 'Pasteur non renseigné';

$typeActe = ActeLiturgique::getTypeOptions()[$acte->type_acte] ?? ucfirst(str_replace('_', ' ', $acte->type_acte ?? '—'));
$typeKey = strtolower((string) ($acte->type_acte ?? ''));
$titreDocument = match ($typeKey) {
    'deces', 'funerailles'                   => 'Avis de décès',
    'grace', 'remerciement', 'felicitations' => 'Demande de prière d\'action de grâce',
    'priere'                                 => 'Demande de prière d\'intercession',
    'generale', 'annonce', 'annonce_liturgique' => 'Demande de prière générale',
    'mariage'                                => 'Annonce de mariage',
    'bapteme'                                => 'Présentation de baptême',
    default                                  => 'Demande de prière',
};

$objet = match ($typeKey) {
    'deces', 'funerailles'                   => 'Décès',
    'grace', 'remerciement', 'felicitations' => 'Action de grâce',
    'priere'                                 => 'Prière d\'intercession',
    'generale', 'annonce', 'annonce_liturgique' => 'Demande de prière générale',
    'mariage'                                => 'Mariage',
    'bapteme'                                => 'Baptême',
    default                                  => $typeActe,
};

$dateCandidate    = $acte->date_souhaitee;
$_dateCarbon      = $dateCandidate ? Carbon::parse($dateCandidate) : null;
$dateAnnonce      = $_dateCarbon ? $_dateCarbon->format('d/m/Y') : '—';
$dateAnnonceTexte = $_dateCarbon
    ? $_dateCarbon->locale('fr')->isoFormat('dddd D MMMM YYYY')
    : '—';
$lieuAnnonce  = $details['lieu'] ?? $details['lieu_deces'] ?? '—';
$heureCulte   = $details['heure_culte'] ?? null;

$nomConcerne       = $details['nom_concerne'] ?? $details['nom_defunt'] ?? $details['conjoint_2'] ?? $nomComplet;
$nomPartenaire     = trim((string) ($details['conjoint_1'] ?? $details['partenaire'] ?? '')) ?: '—';
$nomMembreConcerne = trim((string) ($details['conjoint_2'] ?? $nomConcerne)) ?: $nomComplet;

$reference    = $acte->reference ?? '—';
$dateEmission = optional($acte->created_at)->format('d/m/Y') ?? now()->format('d/m/Y');

$toSignatureDataUri = function (?string $signaturePath): ?string {
    if (empty($signaturePath) || !is_string($signaturePath)) return null;
    if (str_starts_with($signaturePath, 'data:image/')) return $signaturePath;
    // Utiliser Storage facade pour gérer correctement les chemins (Windows/Linux)
    try {
        if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($signaturePath)) return null;
        $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path($signaturePath);
    } catch (\Throwable $e) {
        return null;
    }
    $raw = @file_get_contents($fullPath);
    if ($raw === false) return null;
    $ext  = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION) ?: 'png');
    $mime = match ($ext) {
        'jpg', 'jpeg' => 'image/jpeg',
        'gif'         => 'image/gif',
        'webp'        => 'image/webp',
        default       => 'image/png',
    };
    return 'data:' . $mime . ';base64,' . base64_encode($raw);
};

$signatureConducteurDataUri       = $signatureConducteurDataUri       ?? $toSignatureDataUri($conducteur->signature_path ?? null);
$signaturePasteurDataUri          = $signaturePasteurDataUri          ?? $toSignatureDataUri($pasteur->signature_path    ?? null);

// Bureau des Conducteurs : utiliser bureau_conducteur_id de l'acte,
// sinon chercher le premier utilisateur avec rôle bureau_conducteur.
$bureauConducteur = $acte->bureauConducteur ?? null;
if (!$bureauConducteur) {
    $bureauConducteur = \App\Models\User::where('role', 'bureau_conducteur')
        ->whereNotNull('signature_path')
        ->first();
}
$nomBureauConducteur = $bureauConducteur
    ? trim(($bureauConducteur->prenom ?? '') . ' ' . ($bureauConducteur->nom ?? ''))
    : null;
$signatureBureauConducteurDataUri = $signatureBureauConducteurDataUri ?? $toSignatureDataUri($bureauConducteur->signature_path ?? null);

// ── Lien familial du membre concerné ──────────────────────────────────────
$membreConcerne = $acte->membre ?? null;
$createurActe   = $acte->createur ?? null;
$lienFamilial   = '';
if ($membreConcerne) {
    $rel = trim((string) ($membreConcerne->relation ?? ''));
    // On évite "lui-même" / "lui meme" car c'est incorrect pour le respo de famille
    $relNorm = mb_strtolower(str_replace(['-', ' '], '', $rel), 'UTF-8');
    if ($rel !== '' && !in_array($relNorm, ['luimeme', 'luimême'], true)) {
        $lienFamilial = ucfirst($rel);
    } elseif ($createurActe && $membreConcerne->id === $createurActe->id) {
        // Même personne → afficher son rôle lisible
        $lienFamilial = match ($membreConcerne->role ?? '') {
            'responsable_famille' => 'Responsable de famille',
            'conducteur'          => 'Conducteur',
            'pasteur'             => 'Pasteur',
            'bureau_conducteur'   => 'Bureau des Conducteurs',
            default               => 'Membre de famille',
        };
    } else {
        $lienFamilial = '—';
    }
}

// ── Date / heure de validation du Conducteur (depuis l'historique) ────────
$historiqueCondValidation = null;
if ($acte->relationLoaded('historiques') && $acte->historiques->isNotEmpty()) {
    $historiqueCondValidation = $acte->historiques
        ->filter(function ($h) {
            $role   = mb_strtolower((string) ($h->acteur?->role ?? ''), 'UTF-8');
            $statut = $h->statut_nouveau ?? '';
            return $role === 'conducteur'
                && in_array($statut, ['TRANSMISE_AU_BUREAU_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR'], true);
        })
        ->sortBy('created_at')
        ->first();
}
$dateValidationCond = $historiqueCondValidation
    ? optional($historiqueCondValidation->created_at)->format('d/m/Y à H\hi')
    : null;
$nomValidateurCond  = ($historiqueCondValidation && $historiqueCondValidation->acteur)
    ? trim(($historiqueCondValidation->acteur->prenom ?? '') . ' ' . ($historiqueCondValidation->acteur->nom ?? ''))
    : null;

$dateEvenementTexte = $_dateCarbon ? ucfirst($dateAnnonceTexte) : '—';
$messageContent = trim((string) ($details['contenu'] ?? $details['titre'] ?? ''));

$bodyParagraphs = match ($typeKey) {
    'mariage' => [
        "La famille <b><i>{$famille}</i></b> sollicite une action de grâce devant l'assemblée à l'occasion du mariage de <b><i>{$nomMembreConcerne}</i></b>" . ($nomPartenaire !== '—' ? " et <b><i>{$nomPartenaire}</i></b>" : '') . ", célébré le <b>{$dateEvenementTexte}</b>.",
        "Par cette démarche, la famille souhaite rendre gloire à Dieu pour cette union bénie et exprimer sa profonde reconnaissance à la communauté pour les prières, le soutien et l'accompagnement manifestés lors de cette heureuse célébration.",
    ],
    'bapteme' => [
        "La famille <b><i>{$famille}</i></b> sollicite la présentation devant l'assemblée du baptême de <b><i>{$nomConcerne}</i></b>, prévu le <b>{$dateEvenementTexte}</b>.",
        "À cette occasion, la famille confie <b><i>{$nomConcerne}</i></b> à la grâce et à la protection du Seigneur, et sollicite les prières et l'accompagnement spirituel de la communauté pour sa croissance dans la foi chrétienne.",
    ],
    'grace', 'remerciement', 'felicitations' => [
        "La famille <b><i>{$famille}</i></b> sollicite une action de grâce devant l'assemblée, afin de rendre gloire à Dieu pour ses nombreux bienfaits et pour sa fidélité dans leur vie.",
        "Elle souhaite également exprimer sa reconnaissance pour le soutien spirituel, les prières et l'encouragement de la communauté.",
    ],
    'deces', 'funerailles' => [
        "La famille <b><i>{$famille}</i></b> informe la communauté du rappel à Dieu de <b><i>{$nomConcerne}</i></b>, survenu le <b>{$dateEvenementTexte}</b>.",
        "En cette circonstance douloureuse, la famille sollicite le soutien spirituel et les prières de l'assemblée, afin que le Seigneur accorde le repos éternel au défunt et réconforte les cœurs de la famille éprouvée.",
    ],
    default => [
        "La famille <b><i>{$famille}</i></b> sollicite auprès de la communauté la présentation de {$objet}" . ($nomConcerne !== '—' ? " concernant <b><i>{$nomConcerne}</i></b>" : '') . ", prévue le <b>{$dateEvenementTexte}</b>.",
        "Par cette démarche, la famille souhaite informer l'assemblée et sollicite ses prières, son accompagnement spirituel ainsi que son soutien fraternel.",
    ],
};


$motifKey = $details['motif'] ?? null;
$temoignagePublic = (bool) ($details['temoignage_public'] ?? false);
$temoignageLabel  = $temoignagePublic ? 'OUI' : 'NON';

$isGrace       = in_array($typeKey, ['grace', 'remerciement', 'felicitations']);
$isIntercession = in_array($typeKey, ['priere']);

$checkboxesActionGrace = [
    'guerison' => ['label' => 'Guérison',               'checked' => $motifKey === 'guerison' || ($isGrace && !$motifKey && in_array($typeKey, ['grace','remerciement']))],
    'deuil'    => ['label' => 'Deuil',                   'checked' => $motifKey === 'deuil'],
    'mariage'  => ['label' => 'Bénédiction de Mariage',  'checked' => $motifKey === 'mariage'],
    'autres'   => ['label' => 'Autre(s) bienfaits(s) :', 'checked' => $motifKey === 'autres_bienfaits'],
];
$checkboxesIntercession = [
    'maladie'  => ['label' => 'Maladie : (Préciser)……………………………………………………',  'checked' => $motifKey === 'maladie'],
    'probleme' => ['label' => 'Autre(s) problème(s) :',                                  'checked' => $motifKey === 'autre_probleme'],
    'soutien'  => ['label' => 'Soutien et assistance à : (nom de la personne)……………', 'checked' => $motifKey === 'soutien_assistance'],
];
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $titreDocument }} — {{ $reference }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 14mm 12mm 14mm 12mm;
        }
        /* * { margin: 0; padding: 0; box-sizing: border-box; } */

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 11px;
            color: #111;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        .page {
            width: 100%;
            min-height: 100%;
            padding: 0;
        }

        /* ══ EN-TÊTE style image 1 ══ */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }
        .logo-cell {
            width: 64px;
            vertical-align: top;
            padding-top: 4px;
        }
        .logo-cell img {
            width: 58px;
            height: 58px;
            object-fit: contain;
        }
        .church-center {
            text-align: center;
            vertical-align: middle;
            padding: 0 8px;
        }
        .church-unie {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #111;
            margin-bottom: 1px;
        }
        .tirets {
            font-size: 10px;
            color: #555;
            letter-spacing: 2px;
            margin: 2px 0;
        }
        .church-district {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #111;
            margin-bottom: 1px;
        }
        .church-temple {
            font-size: 14px;
            font-weight: 900;
            color: #111;
            margin-top: 3px;
        }
        .logo-cell-right {
            width: 64px;
            text-align: right;
            vertical-align: top;
            padding-top: 4px;
        }
        .logo-cell-right img {
            width: 58px;
            height: 58px;
            object-fit: contain;
        }

        /* ══ TITRE PRINCIPAL (bleu centré) ══ */
        .main-title {
            text-align: center;
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            color: #1a52a8;
            letter-spacing: 1px;
            margin: 8px 0 8px 0;
        }

        /* ══ CHAMPS SIMPLES ══ */
        .field-line {
            font-size: 11.5px;
            margin-bottom: 5px;
            line-height: 1.6;
        }
        .field-line b { font-weight: 700; }

        /* ══ VERSETS (italique centré) ══ */
        .verset-block {
            text-align: center;
            margin: 7px 0 2px 0;
            font-size: 11px;
            font-style: italic;
            font-weight: 700;
            line-height: 1.5;
            color: #111;
            word-wrap: break-word;
        }
        .verset-ref {
            text-align: right;
            font-size: 11px;
            color: #333;
            margin-bottom: 5px;
        }

        /* ══ SUJET ══ */
        .sujet-line {
            font-size: 11.5px;
            font-weight: 700;
            margin: 6px 0 6px 0;
        }
        .sujet-line span {
            text-decoration: underline;
        }

        /* ══ SECTION TITRE (puce bleue) ══ */
        .section-title {
            font-size: 12px;
            font-weight: 700;
            color: #1a52a8;
            margin: 6px 0 4px 24px;
        }

        /* ══ CASES À COCHER ══ */
        .checkbox-table {
            border-collapse: collapse;
            margin-left: 36px;
            margin-bottom: 5px;
        }
        .checkbox-table td {
            vertical-align: middle;
            padding: 1px 0;
        }
        .checkbox-cell {
            width: 20px;
            padding-right: 10px !important;
        }
        .checkbox-box {
            width: 14px;
            height: 14px;
            border: 1.5px solid #333;
            display: inline-block;
            text-align: center;
            line-height: 13px;
            font-size: 11px;
            vertical-align: middle;
        }
        .checkbox-box.checked {
            /* Croix simulée */
            font-weight: 900;
            color: #111;
        }
        .checkbox-label {
            font-size: 11.5px;
            color: #111;
        }

        /* ══ LIGNE OUI/NON ══ */
        .oui-non {
            font-size: 11px;
            margin: 4px 0 6px 36px;
            line-height: 1.5;
        }
        .non-badge {
            display: inline-block;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 0 7px;
            font-size: 10.5px;
            font-weight: 700;
        }

        /* ══ MOTIF ══ */
        .motif-line {
            font-size: 11.5px;
            font-weight: 700;
            margin-top: 8px;
        }
        .motif-content {
            font-size: 11.5px;
            margin-top: 4px;
            line-height: 1.7;
            text-align: justify;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        /* ══ CORPS LETTRE (si contenu long) ══ */
        .paragraph {
            font-size: 11.5px;
            line-height: 1.85;
            text-align: justify;
            margin-bottom: 10px;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        /* ══ SIGNATURES ══ */
        .sig-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            page-break-inside: avoid;
        }
        .sig-table td {
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 6px;
        }
        .sig-label {
            font-size: 11px;
            font-weight: 700;
            text-decoration: underline;
            display: block;
            margin-bottom: 10px;
        }
        .sig-image {
            display: block;
            max-height: 130px;
            max-width: 250px;
            margin: 0 auto;
            object-fit: contain;
        }
        /* .sig-line {
            display: block;
            border-bottom: 1px solid #777;
            width: 80%;
            margin: 0 auto 5px auto;
            height: 1px;
        } */
        .sig-name {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            display: block;
        }
        .sig-missing {
            font-size: 9.5px;
            color: #ef4444;
            font-style: italic;
            display: block;
        }
        .sig-date {
            font-size: 9px;
            color: #555;
            font-style: italic;
            display: block;
            margin-top: 3px;
        }
    </style>
</head>
<body>
<div class="page">

    {{-- ══ EN-TÊTE  (logo gauche · texte centré · logo droit) ══ --}}
    <table class="header-table">
        <tr>
            {{-- Logo gauche --}}
        <td class="logo-cell">
          @if(!empty($methoDataUri))
          <img src="{{ $methoDataUri }}" alt="Logo EMUCI">
          @elseif(file_exists(public_path('images/metho.jpg')))
          <img src="{{ public_path('images/metho.jpg') }}" alt="Logo EMUCI">
          @endif

            {{-- Texte centré --}}
            <td class="church-center">
                <div class="church-unie">Eglise Méthodiste Unie de Côte d'Ivoire</div>
                <div class="tirets">- - - - - - - - - - - - - -</div>
                <div class="church-district">District Abidjan Nord</div>
                <div class="tirets">- - - - - - - -</div>
                <div class="church-temple">Temple du JUBILE de Cocody</div>
            </td>

            {{-- Logo droit --}}
            <!-- <td class="logo-cell-right">
                @if(!empty($methoDataUri))
                    <img src="{{ $methoDataUri }}" alt="Logo EMUCI">
                @elseif(!empty($logoDataUri))
                    <img src="{{ $logoDataUri }}" alt="Logo">
                @endif
            </td> -->
            <td class="logo-cell-right">
          @if(!empty($logoDataUri))
          <img src="{{ $logoDataUri }}" alt="Logo">
          @elseif(file_exists(public_path('images/logo.png')))
          <img src="{{ public_path('images/logo.png') }}" alt="Logo">
          @endif
        </td>
        </tr>
    </table>

    {{-- ══ TITRE BLEU ══ --}}
    <div class="main-title">{{ $titreDocument }}</div>

    {{-- ══ CHAMPS NOM / LIEN FAMILIAL / CLASSE / DATE ══ --}}
    <div class="field-line"><b>Nom et Prénoms :</b>  {{ $nomComplet }}</div>
    @if($lienFamilial && $lienFamilial !== '—')
    <div class="field-line"><b>Lien familial :</b>  {{ $lienFamilial }}</div>
    @endif
    <div class="field-line"><b>Classe Méthodiste :</b>  {{ $classe }}</div>
    <div class="field-line">
        <b>Pour le culte du :</b>
        {{ $dateAnnonce !== '—' ? $dateAnnonce : '' }}
        @if($heureCulte) à {{ $heureCulte }} @endif
        @if($lieuAnnonce !== '—') — {{ $lieuAnnonce }} @endif
    </div>
    
    {{-- ══ VERSETS D'OUVERTURE ══ --}}
    <div class="verset-block">
        « O toi qui écoutes la prière !<br>
        Tous les hommes viendront à toi. »
    </div>
    <div class="verset-ref">Psaume 65 : 3</div>

    <div class="verset-block">
        « ...tout ce que vous demanderez en mon nom, je le ferai afin que le Père<br>
        soit glorifié dans le Fils. Si vous demandez quelque chose en mon nom, je le ferai. »
    </div>
    <div class="verset-ref">Jean 14 : 13-14</div>

    <!-- {{-- ══ SUJET ══ --}} -->
    <div class="sujet-line">
        <span>Sujet :</span> (cocher la case concernée)
    </div>

    <!-- {{-- ══ SECTION 1 : Action de grâce ══ --}} -->
    <div class="section-title">&#8226; &nbsp;Prière d'action de grâce ou de remerciement pour :</div>
    <table class="checkbox-table">
        @foreach($checkboxesActionGrace as $key => $item)
        <tr>
            <td class="checkbox-cell">
                <div class="checkbox-box {{ $item['checked'] ? 'checked' : '' }}">
                    {!! $item['checked'] ? 'X' : '&nbsp;' !!}
                </div>
            </td>
            <td class="checkbox-label">{{ $item['label'] }}</td>
        </tr>
        @endforeach
    </table>

    <div class="oui-non">
        Voulez-vous pour cela rendre publiquement témoignage ?&nbsp;
        <span class="non-badge">{{ $temoignageLabel }}</span>
        &nbsp;(Pour cas exceptionnel)
    </div>

    <!-- {{-- ══ SECTION 2 : Intercession ══ --}} -->
    <div class="section-title">&#8226; &nbsp;Prière d'intercession pour :</div>
    <table class="checkbox-table">
        @foreach($checkboxesIntercession as $key => $item)
        <tr>
            <td class="checkbox-cell">
                <div class="checkbox-box {{ $item['checked'] ? 'checked' : '' }}">
                    {!! $item['checked'] ? 'X' : '&nbsp;' !!}
                </div>
            </td>
            <td class="checkbox-label">{{ $item['label'] }}</td>
        </tr>
        @endforeach
    </table>

    <!-- {{-- ══ MOTIF / MESSAGE ══ --}} -->
    <!-- <div class="motif-line">
        Motif <span style="font-weight:400;">(si nécessaire, pour aider à la précision de la prière)</span>
    </div>

    @if(!empty($messageContent))
        <div class="motif-content">{!! nl2br(e($messageContent)) !!}</div>
    @endif

    @if(count($bodyParagraphs) > 0 && !empty(strip_tags($bodyParagraphs[0])))
        <div style="margin-top: 8px;">
            @foreach($bodyParagraphs as $p)
                <div class="paragraph">{!! $p !!}</div>
            @endforeach
        </div>
    @endif -->
    {{-- ══ SECTION MOTIF DU MESSAGE ══ --}}
    <div class="motif-line" style="margin-top: 8px;">Motif / Message :</div>
    <div style="margin-top: 4px; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; min-height: 36px; font-size: 11.5px; line-height: 1.6;">
        @if(!empty($messageContent))
            {!! nl2br(e($messageContent)) !!}
        @else
            &nbsp;
        @endif
    </div>

    <div style="margin-top: 4px;">

    <!-- Signatures (3 colonnes : Conducteur · Bureau des Conducteurs · Pasteur) -->
    <table class="sig-table">
        <tr>

            <!-- Conducteur de la Classe -->
            <td>
                <span class="sig-label">Conducteur de la Classe</span>
                @if(!empty($signatureConducteurDataUri))
                    <img src="{{ $signatureConducteurDataUri }}" alt="Signature Conducteur" class="sig-image">
                @endif
                @if($nomValidateurCond)
                    <span class="sig-name">{{ mb_strtoupper($nomValidateurCond, 'UTF-8') }}</span>
                @elseif($nomConducteur && $nomConducteur !== 'Conducteur non renseigné')
                    <span class="sig-name">{{ mb_strtoupper($nomConducteur, 'UTF-8') }}</span>
                @else
                    <span class="sig-missing">Non renseigné</span>
                @endif
            </td>

            <!-- Bureau des Conducteurs -->
            <td>
                <span class="sig-label">Bureau des Conducteurs</span>
                @if(!empty($signatureBureauConducteurDataUri))
                    <img src="{{ $signatureBureauConducteurDataUri }}" alt="Signature Bureau" class="sig-image">
                @endif
                @if(!empty($nomBureauConducteur))
                    <span class="sig-name">{{ mb_strtoupper($nomBureauConducteur, 'UTF-8') }}</span>
                @else
                    <span class="sig-missing">Non renseigné</span>
                @endif
            </td>

            <!-- Pasteur -->
            <td>
                <span class="sig-label">Pasteur</span>
                @if(!empty($signaturePasteurDataUri))
                    <img src="{{ $signaturePasteurDataUri }}" alt="Signature Pasteur" class="sig-image">
                @endif
                @if($nomPasteur && $nomPasteur !== 'Pasteur non renseigné')
                    <span class="sig-name">{{ mb_strtoupper($nomPasteur, 'UTF-8') }}</span>
                @else
                    <span class="sig-missing">Non renseigné</span>
                @endif
            </td>

        </tr>
    </table>

</div>
</body>
</html>