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
            background: #fff; color: #1a1e2e;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* ── Palette ──
           C1 = #6B46C1 (violet)
           C2 = #1E40AF (bleu)
           C3 = #B6C01A (lime)
        ─────────────── */

        .page {
            width: 210mm; min-height: 297mm;
            background: #fff; position: relative;
            display: flex; flex-direction: column; overflow: hidden;
        }

        /* ══ FOND DÉCORATIF ══ */
        .bg-arc {
            position: absolute; top: -120px; right: -120px;
            width: 340px; height: 340px; border-radius: 50%;
            border: 55px solid #6B46C109; z-index: 0;
        }
        .bg-arc-2 {
            position: absolute; top: -60px; right: -60px;
            width: 200px; height: 200px; border-radius: 50%;
            border: 30px solid #1E40AF07; z-index: 0;
        }
        .bg-corner {
            position: absolute; bottom: 0; left: 0;
            width: 140px; height: 140px;
            background: #B6C01A0b;
            clip-path: polygon(0 100%, 0 0, 100% 100%);
            z-index: 0;
        }

        /* ══ BANDE LATÉRALE ══ */
        .stripe {
            position: absolute; top: 0; left: 0;
            width: 7px; height: 100%;
            background: linear-gradient(180deg, #6B46C1 0%, #1E40AF 55%, #B6C01A 100%);
            z-index: 3;
        }

        /* ══ FILIGRANE ══ */
        .watermark {
            position: absolute; bottom: 68px; right: 38px;
            opacity: 0.038; z-index: 1; pointer-events: none;
        }

        /* ══ HEADER ══ */
        .header { position: relative; z-index: 2; padding: 26px 40px 0 50px; }
        .header-inner {
            display: flex; align-items: center;
            justify-content: space-between;
            padding-bottom: 20px; gap: 20px;
        }
        .header-left { display: flex; align-items: center; gap: 15px; }

        .logo-wrap {
            width: 64px; height: 64px; border-radius: 14px;
            background: linear-gradient(135deg, #6B46C11a, #1E40AF1a, #B6C01A1a);
            border: 2px solid #6B46C128;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; overflow: hidden;
            box-shadow: 0 4px 16px #6B46C118;
        }
        .logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
        .logo-text {
            font-size: 8px; font-weight: 800;
            letter-spacing: 1.5px; text-transform: uppercase;
            color: #6B46C1; text-align: center; line-height: 1.5;
        }

        .church-name {
            font-size: 14.5px; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.6px;
            color: #1E40AF; line-height: 1.2; margin-bottom: 4px;
        }
        .church-name span { color: #6B46C1; }
        .church-contact { font-size: 9.5px; color: #9098b4; font-style: italic; }

        .header-right { text-align: right; flex-shrink: 0; }
        .ref-pill {
            display: inline-block;
            background: linear-gradient(135deg, #6B46C112, #1E40AF12);
            border: 1.5px solid #6B46C12e;
            border-radius: 7px; padding: 5px 13px;
            font-size: 9.5px; font-weight: 700; color: #6B46C1;
            letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 5px;
        }
        .emit-date { font-size: 10.5px; color: #9098b4; }

        .header-rule { height: 1px; background: #eaebf5; margin: 0 -40px 0 -50px; position: relative; }
        .header-rule::after {
            content: ''; position: absolute;
            top: 2px; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%);
            opacity: 0.9;
        }

        /* ══ BANDEAU TITRE ══ */
        .title-band {
            position: relative; z-index: 2;
            background: linear-gradient(135deg, #6B46C1f0 0%, #1E40AFf5 60%, #4a6208ee 100%);
            padding: 22px 50px;
            display: flex; align-items: center;
            justify-content: space-between;
            overflow: hidden; min-height: 88px;
        }
        .title-band::before {
            content: ''; position: absolute; inset: 0;
            background:
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(255,255,255,0.04) 0%, transparent 40%);
        }
        .title-band::after {
            content: ''; position: absolute;
            right: -40px; top: -40px;
            width: 160px; height: 160px; border-radius: 50%;
            border: 28px solid rgba(255,255,255,0.06);
        }
        .title-left { position: relative; z-index: 1; }
        .title-sup {
            font-size: 8px; font-weight: 600;
            letter-spacing: 3.5px; text-transform: uppercase;
            color: rgba(255,255,255,0.55); margin-bottom: 6px;
            display: flex; align-items: center; gap: 8px;
        }
        .title-sup::before {
            content: ''; width: 18px; height: 1.5px;
            background: #B6C01A; display: inline-block; opacity: 0.7;
        }
        .title-main {
            font-size: 22px; font-weight: 800; color: #fff;
            letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.1;
        }
        .title-main .thin { font-weight: 300; opacity: 0.85; }

        .title-right { position: relative; z-index: 1; text-align: right; }
        .type-label {
            font-size: 8px; font-weight: 600;
            letter-spacing: 2.5px; text-transform: uppercase;
            color: rgba(255,255,255,0.5); margin-bottom: 6px;
        }
        .type-chip {
            display: inline-block;
            background: rgba(255,255,255,0.14);
            border: 1.5px solid rgba(255,255,255,0.28);
            border-radius: 25px; padding: 7px 20px;
            font-size: 11px; font-weight: 800; color: #fff;
            letter-spacing: 3px; text-transform: uppercase;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
        }

        /* ══ BODY ══ */
        .body { position: relative; z-index: 2; padding: 22px 40px 22px 50px; flex: 1; }

        .s-head { display: flex; align-items: center; gap: 10px; margin-bottom: 11px; }
        .s-bar {
            width: 3px; height: 14px; border-radius: 2px; flex-shrink: 0;
            background: linear-gradient(180deg, #6B46C1 0%, #B6C01A 100%);
        }
        .s-title {
            font-size: 8.5px; font-weight: 700;
            letter-spacing: 2.5px; text-transform: uppercase;
            color: #6B46C1; white-space: nowrap;
        }
        .s-rule { flex: 1; height: 1px; background: linear-gradient(90deg, #6B46C125, transparent); }

        /* Cards */
        .cards-row {
            display: table; width: 100%;
            border-collapse: separate; border-spacing: 13px 0;
            margin: 0 -13px 20px;
        }
        .card {
            display: table-cell; width: 50%;
            background: #f9f8ff; border-radius: 12px;
            border: 1px solid #6B46C11c; vertical-align: top;
            overflow: hidden; box-shadow: 0 2px 10px #6B46C10d;
        }
        .card-cap { padding: 10px 16px; display: flex; align-items: center; gap: 8px; }
        .card.c-violet .card-cap { background: linear-gradient(135deg, #6B46C1 0%, #1E40AF 100%); }
        .card.c-blue   .card-cap { background: linear-gradient(135deg, #1E40AF 0%, #163680 100%); }

        .cap-icon {
            width: 20px; height: 20px; border-radius: 5px;
            background: rgba(255,255,255,0.16);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; font-size: 9px; font-weight: 800;
            color: rgba(255,255,255,0.9);
        }
        .cap-title {
            font-size: 8.5px; font-weight: 700;
            letter-spacing: 2px; text-transform: uppercase;
            color: rgba(255,255,255,0.88);
        }
        .card-rows { padding: 2px 16px 4px; }
        .field { padding: 8px 0; border-bottom: 1px solid #6B46C10f; }
        .field:last-child { border-bottom: none; padding-bottom: 0; }
        .f-label {
            font-size: 8px; font-weight: 700;
            letter-spacing: 1.2px; text-transform: uppercase;
            color: #6B46C170; margin-bottom: 2px;
        }
        .f-val { font-size: 12.5px; font-weight: 700; color: #1a1e2e; line-height: 1.3; }
        .f-empty { font-size: 11px; font-weight: 400; color: #c0c4d8; font-style: italic; }

        /* Corps */
        .corps-wrap { margin: 2px 0 20px; }
        .corps-box {
            position: relative; background: #f9f8ff;
            border: 1px solid #6B46C11c;
            border-left: 5px solid #6B46C1;
            border-radius: 0 10px 10px 0;
            padding: 16px 20px;
            box-shadow: 0 2px 8px #6B46C10a;
        }
        .corps-p {
            font-size: 12.5px; line-height: 1.95;
            color: #2a2e42; text-align: justify; font-style: italic;
        }

        /* Signatures */
        .sig-row { display: table; width: 100%; border-collapse: collapse; margin-top: 13px; }
        .sig-col { display: table-cell; width: 50%; text-align: center; padding: 0 16px; }
        .sig-col:first-child { padding-left: 0; border-right: 1px dashed #6B46C128; }
        .sig-col:last-child  { padding-right: 0; }
        .sig-lbl {
            display: block; font-size: 8px; font-weight: 700;
            letter-spacing: 2px; text-transform: uppercase;
            color: #6B46C170; margin-bottom: 28px;
        }
        .sig-area { height: 36px; }
        .sig-line {
            height: 1px; margin-bottom: 7px;
            background: linear-gradient(90deg, transparent 0%, #6B46C145 50%, transparent 100%);
        }
        .sig-name { font-size: 9.5px; font-weight: 600; color: #6b7280; }

        /* ══ FOOTER ══ */
        .footer { position: relative; z-index: 2; }
        .footer-accent {
            height: 4px;
            background: linear-gradient(90deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%);
        }
        .footer-body {
            background: linear-gradient(135deg, #6B46C10a 0%, #1E40AF08 50%, #B6C01A08 100%);
            border-top: 1px solid #6B46C114;
            padding: 12px 40px 12px 50px;
            display: flex; align-items: center;
            justify-content: space-between; gap: 16px;
        }
        .footer-txt { font-size: 8.5px; color: #9098b4; line-height: 1.75; }
        .footer-stamp {
            display: flex; align-items: center; gap: 7px;
            background: linear-gradient(135deg, #6B46C115, #B6C01A15);
            border: 1.5px solid #6B46C130;
            border-radius: 25px; padding: 5px 15px; flex-shrink: 0;
        }
        .stamp-dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: linear-gradient(135deg, #6B46C1, #B6C01A);
        }
        .stamp-txt {
            font-size: 8.5px; font-weight: 800;
            letter-spacing: 2px; text-transform: uppercase; color: #6B46C1;
        }

        @media print { body { background: #fff; } .page { margin: 0; } }
    </style>
</head>
<body>
<div class="page">

    <div class="bg-arc"></div>
    <div class="bg-arc-2"></div>
    <div class="bg-corner"></div>
    <div class="stripe"></div>

    {{-- Filigrane --}}
    <div class="watermark">
        <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="47" stroke="#6B46C1" stroke-width="1.5"/>
            <circle cx="50" cy="50" r="37" stroke="#1E40AF" stroke-width="1"/>
            <circle cx="50" cy="50" r="27" stroke="#6B46C1" stroke-width="0.7"/>
            <circle cx="50" cy="50" r="17" stroke="#B6C01A" stroke-width="0.6"/>
            <line x1="50" y1="3" x2="50" y2="97" stroke="#6B46C1" stroke-width="0.5"/>
            <line x1="3" y1="50" x2="97" y2="50" stroke="#6B46C1" stroke-width="0.5"/>
            <line x1="17" y1="17" x2="83" y2="83" stroke="#1E40AF" stroke-width="0.4"/>
            <line x1="83" y1="17" x2="17" y2="83" stroke="#1E40AF" stroke-width="0.4"/>
            <text x="50" y="47" text-anchor="middle" font-size="7" fill="#6B46C1" font-family="Arial" font-weight="bold">EMJC</text>
            <text x="50" y="57" text-anchor="middle" font-size="5" fill="#1E40AF" font-family="Arial">COCODY</text>
        </svg>
    </div>

    {{-- HEADER --}}
    <div class="header">
        <div class="header-inner">
            <div class="header-left">
                <div class="logo-wrap">
                    @if(isset($logoPath) && file_exists(public_path($logoPath)))
                        <img src="{{ public_path($logoPath) }}" alt="Logo EMJC">
                    @else
                        <span class="logo-text">LOGO<br>EMJC</span>
                    @endif
                </div>
                <div>
                    <div class="church-name"><span>Église Méthodiste</span><br>Jubilé de Cocody</div>
                    <div class="church-contact">Quartier Cocody, Abidjan &middot; Côte d'Ivoire &middot; +225 07 48 30 01 11</div>
                </div>
            </div>
            <div class="header-right">
                <div class="ref-pill">{{ $reference }}</div>
                <div class="emit-date">Émis le {{ $dateEmission }}</div>
            </div>
        </div>
        <div class="header-rule"></div>
    </div>

    {{-- BANDEAU TITRE --}}
    <div class="title-band">
        <div class="title-left">
            <div class="title-sup">Document officiel &middot; GesParoisse</div>
            <div class="title-main">Fiche <span class="thin">de</span> Demande<br>Liturgique</div>
        </div>
        <div class="title-right">
            <div class="type-label">Type d'acte</div>
            <div class="type-chip">{{ strtoupper($typeActe) }}</div>
        </div>
    </div>

    {{-- BODY --}}
    <div class="body">

        <table class="cards-row">
            <tr>
                <td class="card c-violet">
                    <div class="card-cap">
                        <div class="cap-icon">ID</div>
                        <div class="cap-title">Demandeur</div>
                    </div>
                    <div class="card-rows">
                        <div class="field">
                            <div class="f-label">Nom &amp; Prénom</div>
                            <div class="{{ $nomComplet !== '—' ? 'f-val' : 'f-empty' }}">{{ $nomComplet }}</div>
                        </div>
                        <div class="field">
                            <div class="f-label">Téléphone</div>
                            <div class="{{ $telephone !== '—' ? 'f-val' : 'f-empty' }}">{{ $telephone }}</div>
                        </div>
                        <div class="field">
                            <div class="f-label">Classe</div>
                            <div class="{{ $classe !== '—' ? 'f-val' : 'f-empty' }}">{{ $classe }}</div>
                        </div>
                        <div class="field">
                            <div class="f-label">Famille</div>
                            <div class="{{ $famille !== '—' ? 'f-val' : 'f-empty' }}">{{ $famille }}</div>
                        </div>
                    </div>
                </td>
                <td class="card c-blue">
                    <div class="card-cap">
                        <div class="cap-icon">AC</div>
                        <div class="cap-title">Détails de la demande</div>
                    </div>
                    <div class="card-rows">
                        <div class="field">
                            <div class="f-label">Type d'acte</div>
                            <div class="f-val">{{ strtoupper($typeActe) }}</div>
                        </div>
                        <div class="field">
                            <div class="f-label">Nom du défunt / Concerné</div>
                            <div class="{{ $nomConcerne !== '—' ? 'f-val' : 'f-empty' }}">
                                {{ $nomConcerne !== '—' ? $nomConcerne : 'Non renseigné' }}
                            </div>
                        </div>
                        <div class="field">
                            <div class="f-label">Date du décès</div>
                            <div class="{{ $dateDecesFormatted !== '—' ? 'f-val' : 'f-empty' }}">
                                {{ $dateDecesFormatted !== '—' ? $dateDecesFormatted : 'Non renseignée' }}
                            </div>
                        </div>
                        <div class="field">
                            <div class="f-label">Lieu de sépulture</div>
                            <div class="{{ $lieuSepulture !== '—' ? 'f-val' : 'f-empty' }}">
                                {{ $lieuSepulture !== '—' ? $lieuSepulture : 'Non renseigné' }}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <div class="corps-wrap">
            <div class="s-head">
                <span class="s-bar"></span>
                <span class="s-title">Corps de la demande</span>
                <span class="s-rule"></span>
            </div>
            <div class="corps-box">
                <p class="corps-p">{{ $corps }}</p>
            </div>
        </div>

        <div class="s-head">
            <span class="s-bar"></span>
            <span class="s-title">Signatures &amp; Visas</span>
            <span class="s-rule"></span>
        </div>
        <table class="sig-row">
            <tr>
                <td class="sig-col">
                    <span class="sig-lbl">Signature du demandeur</span>
                    <div class="sig-area"></div>
                    <div class="sig-line"></div>
                    <div class="sig-name">{{ $nomComplet }}</div>
                </td>
                <td class="sig-col">
                    <span class="sig-lbl">Visa &amp; Cachet du Pasteur</span>
                    <div class="sig-area"></div>
                    <div class="sig-line"></div>
                    <div class="sig-name">Pasteur responsable</div>
                </td>
            </tr>
        </table>

    </div>

    {{-- FOOTER --}}
    <div class="footer">
        <div class="footer-accent"></div>
        <div class="footer-body">
            <div class="footer-txt">
                Fiche générée automatiquement &middot; Système GesParoisse<br>
                Église Méthodiste Jubilé de Cocody &middot; Tél : +225 07 48 30 01 11
            </div>
            <div class="footer-stamp">
                <span class="stamp-dot"></span>
                <span class="stamp-txt">Acte validé</span>
            </div>
        </div>
    </div>

</div>
</body>
</html>