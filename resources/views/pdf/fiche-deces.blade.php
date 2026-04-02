@php
use Carbon\Carbon;

$details = (array) ($acte->details ?? []);
$createur = $acte->createur ?? $acte->membre ?? null;
$famille = $createur?->family?->nom ?? $acte->family?->nom ?? 'Famille inconnue';
$classe = $createur?->classe?->nom ?? $acte->classe?->nom ?? 'Classe inconnue';

$nomDemandeur = trim(($createur?->prenom ?? '') . ' ' . ($createur?->nom ?? ''));
$nomDemandeur = $nomDemandeur ?: '—';

$nomDefunt = trim((string) ($details['nom_defunt'] ?? $details['nom_concerne'] ?? $details['nom'] ?? '—'));

$dateDeces = !empty($details['date_deces'])
? (function() use ($details) {
try { return Carbon::parse($details['date_deces'])->locale('fr')->isoFormat('D MMMM YYYY'); }
catch (\Throwable $e) { return $details['date_deces']; }
})()
: '—';

$lieuDeces = trim((string) ($details['lieu_deces'] ?? $details['lieu'] ?? '—'));

$dateAnnonce = !empty($acte->date_souhaitee)
? (function() use ($acte) {
try { return Carbon::parse($acte->date_souhaitee)->locale('fr')->isoFormat('DD/MM/YYYY'); }
catch (\Throwable $e) { return '—'; }
})()
: '—';

$dateAnnonceFull = !empty($acte->date_souhaitee)
? (function() use ($acte) {
try { return Carbon::parse($acte->date_souhaitee)->locale('fr')->isoFormat('dddd D MMMM YYYY'); }
catch (\Throwable $e) { return '—'; }
})()
: '—';

$lieuAnnonce = trim((string) ($details['lieu_annonce'] ?? $details['lieu'] ?? '—'));

$motif = trim((string) ($details['contenu'] ?? $details['titre'] ?? $details['message'] ?? ''));
if ($motif === '') {
$motif = "La famille informe la communauté du rappel à Dieu de leur proche et sollicite ses prières et son soutien spirituel.";
}

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

$logoSrc = $logoDataUri ?? null;
$methoLogoSrc = $methoDataUri ?? null;
if (!$methoLogoSrc && file_exists(public_path('images/metho.jpg'))) {
$raw = @file_get_contents(public_path('images/metho.jpg'));
if ($raw !== false) {
$ext = strtolower(pathinfo(public_path('images/metho.jpg'), PATHINFO_EXTENSION) ?: 'jpg');
$methoLogoSrc = 'data:image/' . $ext . ';base64,' . base64_encode($raw);
}
}
@endphp
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Avis de Décès — {{ $reference }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 18mm 20mm 18mm;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #111111;
            font-size: 11px;
            background: #ffffff;
            line-height: 1.5;
        }

        /* ══════════════════════════════
           EN-TÊTE  (2 logos + texte centré)
        ══════════════════════════════ */
        .header-table {
            width: 88%;
            margin: 0 auto;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .header-table td {
            vertical-align: middle;
            padding: 0;
        }

        .logo-cell {
            width: 60px;
            text-align: left;
        }

        .logo-cell img {
            width: 56px;
            height: 56px;
            object-fit: contain;
        }

        .logo-cell-right {
            width: 60px;
            text-align: right;
        }

        .logo-cell-right img {
            width: 56px;
            height: 56px;
            object-fit: contain;
        }

        .church-center {
            text-align: center;
            padding: 0 8px;
        }

        .church-center .line1 {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1a1a1a;
        }

        .church-center .separator {
            color: #888;
            margin: 1px 0;
            font-size: 10px;
        }

        .church-center .line2 {
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #1a1a1a;
        }

        .church-center .line3 {
            font-size: 15px;
            font-weight: 700;
            color: #1a1a1a;
            margin-top: 3px;
        }

        /* ══════════════════════════════
           TITRE PRINCIPAL
        ══════════════════════════════ */
        .main-title {
            text-align: center;
            font-size: 18px;
            font-weight: 800;
            text-transform: uppercase;
            color: #1a52a8;
            letter-spacing: 1.5px;
            margin: 14px 0 16px 0;
        }

        /* ══════════════════════════════
           CHAMPS PRINCIPAUX
        ══════════════════════════════ */
        .field-line {
            margin-bottom: 8px;
            font-size: 11.5px;
            line-height: 1.5;
        }

        .field-line .label {
            font-weight: 700;
            color: #111;
        }

        .field-line .value {
            color: #111;
        }

        /* ══════════════════════════════
           VERSET BIBLIQUE (encadré italique)
        ══════════════════════════════ */
        .verset-block {
            margin: 14px 0 4px 24px;
            font-style: italic;
            font-size: 11.5px;
            color: #222;
            line-height: 1.6;
        }

        .verset-ref {
            text-align: right;
            font-size: 11px;
            color: #333;
            margin-bottom: 14px;
        }

        /* ══════════════════════════════
           ANNONCE FAMILLE
        ══════════════════════════════ */
        .famille-annonce {
            font-size: 11.5px;
            margin-bottom: 10px;
            line-height: 1.6;
        }

        .famille-annonce .nom-famille {
            font-weight: 800;
            text-transform: uppercase;
        }

        /* ══════════════════════════════
           BLOC MESSAGE
        ══════════════════════════════ */
        .message-bold {
            font-weight: 700;
            font-size: 11.5px;
            margin-bottom: 4px;
            line-height: 1.5;
        }

        .message-ref {
            text-align: right;
            font-size: 11px;
            color: #333;
            margin-bottom: 16px;
        }

        /* ══════════════════════════════
           SÉPARATEUR
        ══════════════════════════════ */
        .divider {
            border: none;
            border-top: 1px solid #cccccc;
            margin: 10px 0;
        }

        /* ══════════════════════════════
           WRAPPER CONTENU CENTRÉ
        ══════════════════════════════ */
        .content-wrapper {
            width: 88%;
            margin: 0 auto;
        }

        /* ══════════════════════════════
           SIGNATURES
        ══════════════════════════════ */
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 28px;
        }

        .signature-table td {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 0 4px;
        }

        .sig-stack {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .sig-label {
            font-size: 11px;
            font-weight: 700;
            text-decoration: underline;
            color: #111;
            margin-bottom: 18px;
            display: block;
        }

        .sig-space {
            height: 54px;
            width: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            margin-bottom: 8px;
            overflow: hidden;
        }

        .sig-name {
            font-size: 11px;
            font-weight: 700;
            color: #111;
            text-transform: uppercase;
            min-height: 14px;
        }

        .sig-image {
            display: block;
            max-height: 44px;
            max-width: 120px;
            object-fit: contain;
        }

        .sig-missing {
            font-size: 10px;
            color: #ef4444;
            font-style: italic;
            display: block;
        }

        /* ══════════════════════════════
           PIED DE PAGE
        ══════════════════════════════ */
        .footer {
            position: fixed;
            bottom: -14mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #aaaaaa;
            border-top: 1px solid #e5e7eb;
            padding-top: 3px;
        }
    </style>
</head>

<body>

    {{-- ═══ EN-TÊTE ═══ --}}
    <table class="header-table">
        <tr>
            {{-- Logo gauche (Temple Jubilé) --}}
            <td class="logo-cell">
                @if($logoSrc)
                <img src="{{ $logoSrc }}" alt="Logo Temple">
                @elseif($methoLogoSrc)
                <img src="{{ $methoLogoSrc }}" alt="Logo Méthodiste">
                @endif
            </td>

            {{-- Texte centré --}}
            <td class="church-center">
                <div class="line1">Eglise Méthodiste de Côte d'Ivoire</div>
                <div class="line2">District Abidjan Nord</div>
                <div class="line3">Temple du JUBILE de Cocody</div>
            </td>

            {{-- Logo droit (Méthodiste) --}}
            <td class="logo-cell-right">
                @if($methoLogoSrc)
                <img src="{{ $methoLogoSrc }}" alt="Logo Méthodiste">
                @elseif(!empty($logoDataUriNational))
                <img src="{{ $logoDataUriNational }}" alt="Logo EMUCI">
                @elseif($logoSrc)
                <img src="{{ $logoSrc }}" alt="Logo EMUCI">
                @endif
            </td>
        </tr>
    </table>

    <div class="content-wrapper">

        {{-- ═══ TITRE ═══ --}}
        <div class="main-title">Avis de Décès</div>

        {{-- ═══ CLASSE & DATE CULTE ═══ --}}
        <div class="field-line">
            <span class="label">Classe Méthodiste :</span>
            <span class="value"> {{ $classe }}</span>
        </div>

        <div class="field-line">
            <span class="label">Pour le culte du :</span>
            <span class="value"> {{ $dateAnnonce }}</span>
            @if($dateAnnonceFull !== '—')
            <span class="value"> {{ $lieuAnnonce }}</span>
            @endif
        </div>

        {{-- ═══ VERSET D'OUVERTURE ═══ --}}
        <div class="verset-block">
            « Bien-aimés du Seigneur, nous vous faisons part du rappel à Dieu de notre frère / sœur.<br>
            Que son âme repose en paix dans la lumière éternelle de Dieu. »
        </div>
        <div class="verset-ref">Jean 11 : 25</div>

        {{-- ═══ ANNONCE FAMILLE ═══ --}}
        <div class="famille-annonce">
            La famille : <span class="nom-famille">{{ mb_strtoupper($famille, 'UTF-8') }}</span>
            a la douleur de vous annoncer le rappel à Dieu de son proche et sollicite vos prières.
        </div>

        {{-- ═══ MESSAGE / MOTIF ═══ --}}
        <div class="message-bold">
            {!! nl2br(e($motif)) !!}
        </div>
        <div class="message-ref">Cf. 1 Thessaloniciens 4 : 13-14</div>

        {{-- ═══ DÉTAILS ═══ --}}
        <div class="field-line">
            <span class="label">Nom et prénoms du défunt :</span>
            <span class="value"> {{ $nomDefunt }}</span>
        </div>

        <div class="field-line">
            <span class="label">Date du décès :</span>
            <span class="value"> {{ $dateDeces }}</span>
        </div>

        <div class="field-line">
            <span class="label">Lieu du décès :</span>
            <span class="value"> {{ $lieuDeces }}</span>
        </div>

        <div class="field-line">
            <span class="label">Demandeur / Responsable :</span>
            <span class="value"> {{ $nomDemandeur }}</span>
        </div>

        <div class="field-line">
            <span class="label">Référence :</span>
            <span class="value"> {{ $reference }} — émis le {{ $dateEmission }}</span>
        </div>

        {{-- ═══ SIGNATURES ═══ --}}
        <table class="signature-table">
            <tr>
                <td>
                    <div class="sig-stack">
                        <span class="sig-label">Conducteur de la Classe</span>
                        <div class="sig-space">
                            @if($conducteurSignatureDataUri)
                            <img src="{{ $conducteurSignatureDataUri }}" alt="Signature Conducteur" class="sig-image">
                            @endif
                        </div>
                        @if($nomConducteur)
                        <span class="sig-name">{{ $nomConducteur }}</span>
                        @else
                        <span class="sig-missing">Non renseigne</span>
                        @endif
                    </div>
                </td>
                <td>
                    <div class="sig-stack">
                        <span class="sig-label">Bureau des Conducteurs</span>
                        <div class="sig-space"></div>
                        <span class="sig-name">&nbsp;</span>
                    </div>
                </td>
                <td>
                    <div class="sig-stack">
                        <span class="sig-label">Pasteur</span>
                        <div class="sig-space">
                            @if($pasteurSignatureDataUri)
                            <img src="{{ $pasteurSignatureDataUri }}" alt="Signature Pasteur" class="sig-image">
                            @endif
                        </div>
                        @if($nomPasteur)
                        <span class="sig-name">{{ $nomPasteur }}</span>
                        @else
                        <span class="sig-missing">Non renseigne</span>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

    </div>{{-- fin .content-wrapper --}}

    {{-- ═══ PIED DE PAGE ═══ --}}
    <div class="footer">
        EMUCI – Temple du Jubilé de Cocody &nbsp;|&nbsp;
        Généré par GesParoisse &nbsp;|&nbsp;
        Réf. {{ $reference }}
    </div>

</body>

</html>
