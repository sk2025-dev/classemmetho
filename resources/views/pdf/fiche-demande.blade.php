@php
use App\Models\ActeLiturgique;
use Carbon\Carbon;

$details = $acte->details ?? [];
$createur = $acte->createur ?? $acte->membre ?? null;
$nomComplet = trim(($createur->prenom ?? '') . ' ' . ($createur->nom ?? '')) ?: '—';
$telephone = $createur->telephone ?? $createur->telephone2 ?? '—';
$classe = $createur->classe?->nom ?? $acte->classe?->nom ?? '—';
$famille = $createur->family?->nom ?? ($acte->family?->nom ?? '—');
$typeActe = ActeLiturgique::getTypeOptions()[$acte->type_acte] ?? ucfirst(str_replace('_', ' ', $acte->type_acte ?? '—'));
$nomConcerne = $details['nom_defunt'] ?? data_get($details, 'nom_concerne') ?? $details['nom_concerne'] ?? '—';
$dateDeces = $details['date_deces'] ?? $details['date_du_deces'] ?? null;
$dateDecesFormatted = $dateDeces ? Carbon::parse($dateDeces)->format('d/m/Y') : '—';
$lieuSepulture = $details['lieu_deces'] ?? $details['lieu_sepulture'] ?? $details['lieu_s'] ?? '—';
$corps = trim($details['contenu'] ?? $acte->message ?? '') ?: 'Pas de corps de demande renseigné.';
$reference = $acte->reference ?? '—';
$dateEmission = optional($acte->updated_at)->format('d/m/Y') ?? Carbon::now()->format('d/m/Y');
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Fiche {{ $typeActe }} — {{ $reference }}</title>
    <style>
        @page { size: A4; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background: #fff;
            color: #1a1e2e;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Variables couleurs */
        /* C1 = #6B46C1 (violet) | C2 = #1E40AF (bleu) | C3 = #B6C01A (lime) */

        .page {
            width: 210mm;
            min-height: 297mm;
            background: #fff;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* ══ DÉCO FOND ══ */
        .deco-triangle-top {
            position: absolute; top: 0; right: 0;
            width: 0; height: 0; border-style: solid;
            border-width: 0 160px 160px 0;
            border-color: transparent #6B46C112 transparent transparent;
            z-index: 0;
        }
        .deco-triangle-bottom {
            position: absolute; bottom: 60px; left: 0;
            width: 0; height: 0; border-style: solid;
            border-width: 120px 0 0 120px;
            border-color: transparent transparent transparent #B6C01A10;
            z-index: 0;
        }
        .deco-circle {
            position: absolute; top: -80px; right: -80px;
            width: 260px; height: 260px; border-radius: 50%;
            border: 35px solid #1E40AF08; z-index: 0;
        }

        /* ══ BANDE LATÉRALE ══ */
        .stripe {
            position: absolute; top: 0; left: 0;
            width: 8px; height: 100%;
            background: linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%);
            z-index: 2;
        }

        /* ══ HEADER ══ */
        .header {
            position: relative; z-index: 1;
            padding: 26px 42px 0 52px;
            background: #fff;
        }
        .header-top {
            display: flex; align-items: center;
            justify-content: space-between;
            padding-bottom: 20px;
            border-bottom: 1px solid #ebebf5;
            gap: 20px;
        }
        .header-left { display: flex; align-items: center; gap: 16px; }

        .logo-box {
            width: 66px; height: 66px; border-radius: 12px;
            background: linear-gradient(135deg, #6B46C118 0%, #1E40AF18 50%, #B6C01A18 100%);
            border: 1.5px solid #6B46C130;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; overflow: hidden;
        }
        .logo-box img { width: 100%; height: 100%; object-fit: contain; }
        .logo-placeholder {
            font-size: 8px; font-weight: 800;
            letter-spacing: 1px; text-transform: uppercase;
            color: #6B46C1; text-align: center; line-height: 1.5;
        }

        .church-main {
            font-size: 15px; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.5px;
            line-height: 1.2; margin-bottom: 4px;
            color: #1E40AF;
        }
        .church-sub { font-size: 10px; color: #8a92a8; font-style: italic; }

        .header-right { text-align: right; flex-shrink: 0; }
        .ref-badge {
            display: inline-block;
            background: linear-gradient(135deg, #6B46C114 0%, #1E40AF14 100%);
            border: 1px solid #6B46C135;
            border-radius: 6px; padding: 5px 12px;
            font-size: 10px; font-weight: 700; color: #6B46C1;
            letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 5px;
        }
        .date-info { font-size: 11px; color: #8a92a8; }

        .header-line {
            height: 3px;
            background: linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%);
            margin: 0 -42px 0 -52px;
        }

        /* ══ BANDEAU TITRE ══ */
        .title-band {
            position: relative; z-index: 1;
            background: linear-gradient(135deg, #6B46C1 0%, #1E40AF 55%, #8a9214cc 100%);
            padding: 20px 52px;
            display: flex; align-items: center;
            justify-content: space-between; overflow: hidden;
        }
        .title-band::before {
            content: ''; position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: repeating-linear-gradient(
                45deg, transparent, transparent 10px,
                rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px
            );
        }
        .title-band-left { position: relative; z-index: 1; }
        .title-doc-label {
            font-size: 8.5px; font-weight: 700;
            letter-spacing: 3px; text-transform: uppercase;
            color: rgba(255,255,255,0.6); margin-bottom: 5px;
        }
        .title-doc-name {
            font-size: 20px; font-weight: 800; color: #fff;
            letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.1;
        }
        .title-band-right { position: relative; z-index: 1; text-align: right; }
        .title-acte-label {
            font-size: 8px; font-weight: 600;
            letter-spacing: 2px; text-transform: uppercase;
            color: rgba(255,255,255,0.55); margin-bottom: 4px;
        }
        .title-acte-pill {
            display: inline-block;
            background: rgba(255,255,255,0.18);
            border: 1.5px solid rgba(255,255,255,0.35);
            border-radius: 20px; padding: 6px 18px;
            font-size: 12px; font-weight: 800; color: #fff;
            letter-spacing: 3px; text-transform: uppercase;
        }

        /* ══ BODY ══ */
        .body { position: relative; z-index: 1; padding: 24px 42px 24px 52px; flex: 1; }

        .section-label { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; }
        .section-bar {
            width: 4px; height: 16px; border-radius: 2px;
            background: linear-gradient(180deg, #6B46C1 0%, #B6C01A 100%);
            flex-shrink: 0;
        }
        .section-text {
            font-size: 9px; font-weight: 700;
            letter-spacing: 2.5px; text-transform: uppercase;
            color: #6B46C1; white-space: nowrap;
        }
        .section-line {
            flex: 1; height: 1px;
            background: linear-gradient(90deg, #6B46C130, transparent);
        }

        /* ── Cards ── */
        .info-table {
            width: 100%; border-collapse: separate;
            border-spacing: 12px 0; margin: 0 -12px 22px;
        }
        .info-card {
            width: 50%; background: #faf9ff;
            border: 1px solid #6B46C120;
            border-radius: 12px; vertical-align: top; overflow: hidden;
        }
        .card-header { padding: 11px 16px; display: flex; align-items: center; gap: 8px; }
        .info-card.violet .card-header { background: linear-gradient(135deg, #6B46C1 0%, #1E40AF 100%); }
        .info-card.lime   .card-header { background: linear-gradient(135deg, #1E40AF 0%, #4a6008 100%); }

        .card-header-icon {
            width: 22px; height: 22px; border-radius: 6px;
            background: rgba(255,255,255,0.18);
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; flex-shrink: 0;
        }
        .card-header-title {
            font-size: 9px; font-weight: 700;
            letter-spacing: 1.8px; text-transform: uppercase;
            color: rgba(255,255,255,0.9);
        }
        .card-body { padding: 0 16px; background: #faf9ff; }
        .info-row { padding: 9px 0; border-bottom: 1px solid #6B46C112; }
        .info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .info-label {
            font-size: 8.5px; font-weight: 700;
            letter-spacing: 1px; text-transform: uppercase;
            color: #6B46C180; margin-bottom: 2px;
        }
        .info-value { font-size: 13px; font-weight: 700; color: #1a1e2e; line-height: 1.3; }
        .info-value-empty { font-size: 11.5px; font-weight: 400; color: #c4c8d8; font-style: italic; }

        /* ── Corps ── */
        .corps-block { margin: 4px 0 22px; }
        .corps-inner {
            background: #faf9ff;
            border: 1px solid #6B46C120;
            border-left: 5px solid #6B46C1;
            border-radius: 0 12px 12px 0;
            padding: 18px 22px;
        }
        .corps-text {
            font-size: 13px; line-height: 1.95;
            color: #2a2e40; text-align: justify; font-style: italic;
        }

        /* ── Signatures ── */
        .sig-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .sig-cell { width: 50%; text-align: center; padding: 0 18px; }
        .sig-cell:first-child { padding-left: 0; border-right: 1px dashed #6B46C130; }
        .sig-cell:last-child  { padding-right: 0; }
        .sig-label {
            font-size: 8.5px; font-weight: 700;
            letter-spacing: 1.5px; text-transform: uppercase;
            color: #6B46C180; margin-bottom: 30px; display: block;
        }
        .sig-line {
            height: 1.5px;
            background: linear-gradient(90deg, transparent, #6B46C150, transparent);
            margin-bottom: 7px;
        }
        .sig-name { font-size: 10px; font-weight: 600; color: #6b7280; }

        /* ══ FOOTER ══ */
        .footer { position: relative; z-index: 1; overflow: hidden; }
        .footer-gradient-line {
            height: 3px;
            background: linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%);
        }
        .footer-inner {
            background: linear-gradient(135deg, #6B46C10d 0%, #1E40AF0d 50%, #B6C01A0d 100%);
            padding: 13px 42px 13px 52px;
            display: flex; align-items: center; justify-content: space-between;
            border-top: 1px solid #6B46C115;
        }
        .footer-text { font-size: 9px; color: #8a92a8; line-height: 1.7; }
        .footer-badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: linear-gradient(135deg, #6B46C118 0%, #B6C01A18 100%);
            border: 1px solid #6B46C135;
            border-radius: 20px; padding: 5px 14px; white-space: nowrap;
        }
        .badge-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: linear-gradient(135deg, #6B46C1 0%, #B6C01A 100%);
        }
        .badge-text {
            font-size: 9px; font-weight: 700;
            letter-spacing: 1.5px; text-transform: uppercase; color: #6B46C1;
        }

        /* Filigrane */
        .watermark {
            position: absolute; bottom: 70px; right: 42px;
            opacity: 0.04; z-index: 0; pointer-events: none;
        }

        @media print { body { background: #fff; } .page { margin: 0; } }
    </style>
</head>
<body>
<div class="page">

    {{-- Déco fond --}}
    <div class="deco-triangle-top"></div>
    <div class="deco-triangle-bottom"></div>
    <div class="deco-circle"></div>

    {{-- Bande latérale --}}
    <div class="stripe"></div>

    {{-- Filigrane SVG --}}
    <div class="watermark">
        <svg width="160" height="160" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" stroke="#6B46C1" stroke-width="1.5"/>
            <circle cx="50" cy="50" r="35" stroke="#1E40AF" stroke-width="1"/>
            <circle cx="50" cy="50" r="20" stroke="#B6C01A" stroke-width="0.8"/>
            <line x1="50" y1="2" x2="50" y2="98" stroke="#6B46C1" stroke-width="0.5"/>
            <line x1="2" y1="50" x2="98" y2="50" stroke="#6B46C1" stroke-width="0.5"/>
            <line x1="15" y1="15" x2="85" y2="85" stroke="#1E40AF" stroke-width="0.4"/>
            <line x1="85" y1="15" x2="15" y2="85" stroke="#1E40AF" stroke-width="0.4"/>
            <text x="50" y="46" text-anchor="middle" font-size="7" fill="#6B46C1" font-family="Arial" font-weight="bold">EMJC</text>
            <text x="50" y="56" text-anchor="middle" font-size="5" fill="#1E40AF" font-family="Arial">COCODY</text>
        </svg>
    </div>

    {{-- ══ HEADER ══ --}}
    <div class="header">
        <div class="header-top">
            <div class="header-left">
                <div class="logo-box">
                    @if(isset($logoPath) && file_exists(public_path($logoPath)))
                        <img src="{{ public_path($logoPath) }}" alt="Logo EMJC">
                    @else
                        <span class="logo-placeholder">LOGO<br>EMJC</span>
                    @endif
                </div>
                <div>
                    <div class="church-main">Église Méthodiste<br>Jubilé de Cocody</div>
                    <div class="church-sub">Quartier Cocody, Abidjan &middot; Côte d'Ivoire &middot; Tél. : +225 07 48 30 01 11</div>
                </div>
            </div>
            <div class="header-right">
                <div class="ref-badge">Réf : {{ $reference }}</div>
                <div class="date-info">Émis le {{ $dateEmission }}</div>
            </div>
        </div>
        <div class="header-line"></div>
    </div>

    {{-- ══ BANDEAU TITRE ══ --}}
    <div class="title-band">
        <div class="title-band-left">
            <div class="title-doc-label">Document officiel · GesParoisse</div>
            <div class="title-doc-name">Fiche de Demande<br>Liturgique</div>
        </div>
        <div class="title-band-right">
            <div class="title-acte-label">Type d'acte</div>
            <div class="title-acte-pill">{{ strtoupper($typeActe) }}</div>
        </div>
    </div>

    {{-- ══ BODY ══ --}}
    <div class="body">

        <table class="info-table">
            <tr>
                <td class="info-card violet">
                    <div class="card-header">
                        <div class="card-header-icon">👤</div>
                        <div class="card-header-title">Demandeur</div>
                    </div>
                    <div class="card-body">
                        <div class="info-row">
                            <div class="info-label">Nom &amp; Prénom</div>
                            <div class="{{ $nomComplet !== '—' ? 'info-value' : 'info-value-empty' }}">{{ $nomComplet }}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Téléphone</div>
                            <div class="{{ $telephone !== '—' ? 'info-value' : 'info-value-empty' }}">{{ $telephone }}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Classe</div>
                            <div class="{{ $classe !== '—' ? 'info-value' : 'info-value-empty' }}">{{ $classe }}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Famille</div>
                            <div class="{{ $famille !== '—' ? 'info-value' : 'info-value-empty' }}">{{ $famille }}</div>
                        </div>
                    </div>
                </td>
                <td class="info-card lime">
                    <div class="card-header">
                        <div class="card-header-icon">📋</div>
                        <div class="card-header-title">Détails de la demande</div>
                    </div>
                    <div class="card-body">
                        <div class="info-row">
                            <div class="info-label">Type d'acte</div>
                            <div class="info-value">{{ strtoupper($typeActe) }}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Nom du défunt / Concerné</div>
                            <div class="{{ $nomConcerne !== '—' ? 'info-value' : 'info-value-empty' }}">
                                {{ $nomConcerne !== '—' ? $nomConcerne : 'Non renseigné' }}
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Date du décès</div>
                            <div class="{{ $dateDecesFormatted !== '—' ? 'info-value' : 'info-value-empty' }}">
                                {{ $dateDecesFormatted !== '—' ? $dateDecesFormatted : 'Non renseignée' }}
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Lieu de sépulture</div>
                            <div class="{{ $lieuSepulture !== '—' ? 'info-value' : 'info-value-empty' }}">
                                {{ $lieuSepulture !== '—' ? $lieuSepulture : 'Non renseigné' }}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <div class="corps-block">
            <div class="section-label">
                <span class="section-bar"></span>
                <span class="section-text">Corps de la demande</span>
                <span class="section-line"></span>
            </div>
            <div class="corps-inner">
                <p class="corps-text">{{ $corps }}</p>
            </div>
        </div>

        <div class="section-label">
            <span class="section-bar"></span>
            <span class="section-text">Signatures &amp; Visas</span>
            <span class="section-line"></span>
        </div>
        <table class="sig-table" style="margin-top:14px">
            <tr>
                <td class="sig-cell">
                    <span class="sig-label">Signature du demandeur</span>
                    <div style="height:38px"></div>
                    <div class="sig-line"></div>
                    <div class="sig-name">{{ $nomComplet }}</div>
                </td>
                <td class="sig-cell">
                    <span class="sig-label">Visa &amp; Cachet du Pasteur</span>
                    <div style="height:38px"></div>
                    <div class="sig-line"></div>
                    <div class="sig-name">Pasteur responsable</div>
                </td>
            </tr>
        </table>

    </div>

    {{-- ══ FOOTER ══ --}}
    <div class="footer">
        <div class="footer-gradient-line"></div>
        <div class="footer-inner">
            <div class="footer-text">
                Fiche générée automatiquement par le système GesParoisse<br>
                Église Méthodiste Jubilé de Cocody &middot; Tél : +225 07 48 30 01 11
            </div>
            <div class="footer-badge">
                <span class="badge-dot"></span>
                <span class="badge-text">Acte validé</span>
            </div>
        </div>
    </div>

</div>
</body>
</html>