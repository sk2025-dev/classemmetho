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

// Helper pour afficher valeur vide ou réelle
$empty = fn($v, $label = 'Non renseigné') =>
$v !== '—' ? '<span style="font-size:12.5px;font-weight:700;color:#1a1e2e;">' . e($v) . '</span>'
: '<span style="font-size:11px;font-weight:400;color:#bbb;font-style:italic;">' . $label . '</span>';
@endphp
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Fiche {{ $typeActe }} — {{ $reference }}</title>
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

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 11px;
            color: #1a1e2e;
            background: #fff;
            -webkit-print-color-adjust: exact;
        }

        .page {
            width: 297mm;
            height: auto;
            background: #fff;
        }

        .f-lbl {
            display: block;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #6B46C188;
            margin-bottom: 2px;
        }

        .f-val {
            font-size: 12.5px;
            font-weight: 700;
            color: #1a1e2e;
            line-height: 1.3;
        }

        .f-empty {
            font-size: 11px;
            font-weight: 400;
            color: #bbb;
            font-style: italic;
        }
    </style>
</head>

<body>
    <div class="page">

        <table width="100%" cellpadding="0" cellspacing="0" style="height:auto;">
            <tr>

                {{-- ══ BANDE LATÉRALE (3 segments de couleur) ══ --}}
                <td width="7" style="padding:0;vertical-align:top;">
                    <div style="height:70mm;background:#6B46C1;font-size:0;"></div>
                    <div style="height:70mm;background:#1E40AF;font-size:0;"></div>
                    <div style="height:70mm;background:#B6C01A;font-size:0;"></div>
                </td>

                {{-- ══ CONTENU ══ --}}
                <td style="padding:0;vertical-align:top;">

                    {{-- ▓▓ HEADER ▓▓ --}}
                    <table width="100%" cellpadding="0" cellspacing="0"
                        style="padding:16px 50px 0 50px;border-bottom:1px solid #e8e9f5;">
                        <tr>
                            {{-- Logo --}}
                            <td width="60" style="vertical-align:middle;padding-right:18px;padding-bottom:12px;">
                                <div style="width:56px;height:56px;border:2px solid #6B46C135;border-radius:10px;background:#f3f0ff;text-align:center;padding-top:10px;overflow:hidden;">
                                    @if(isset($logoPath) && file_exists(public_path($logoPath)))
                                    <img src="{{ public_path($logoPath) }}" width="52" height="52"
                                        style="object-fit:contain;border-radius:8px;">
                                    @else
                                    <span style="font-size:7px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;color:#6B46C1;line-height:1.2;">LOGO<br>EMJC</span>
                                    @endif
                                </div>
                            </td>
                            {{-- Nom église --}}
                            <td style="vertical-align:middle;padding-bottom:12px;flex:1;">
                                <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;color:#6B46C1;line-height:1;margin-bottom:1px;">
                                    Église Méthodiste
                                </div>
                                <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;color:#1E40AF;line-height:1;margin-bottom:3px;">
                                    Jubilé de Cocody
                                </div>
                                <div style="font-size:7.5px;color:#9098b4;font-style:italic;">
                                    Quartier Cocody, Abidjan &middot; +225 07 48 30 01 11
                                </div>
                            </td>
                            {{-- Réf + date --}}
                            <td style="vertical-align:middle;text-align:right;padding-bottom:12px;white-space:nowrap;padding-left:18px;">
                                <div style="display:inline-block;background:#f3f0ff;border:1.5px solid #d6ccf0;border-radius:6px;padding:5px 11px;font-size:7.5px;font-weight:700;color:#6B46C1;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:4px;">
                                    {{ $reference }}
                                </div>
                                <br>
                                <span style="font-size:8px;color:#9098b4;">Émis le {{ $dateEmission }}</span>
                            </td>
                        </tr>
                    </table>

                    {{-- Ligne tricolore --}}
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td width="33%" height="3" style="background:#6B46C1;font-size:0;line-height:0;">&nbsp;</td>
                            <td width="33%" height="3" style="background:#1E40AF;font-size:0;line-height:0;">&nbsp;</td>
                            <td width="34%" height="3" style="background:#B6C01A;font-size:0;line-height:0;">&nbsp;</td>
                        </tr>
                    </table>

                    {{-- ▓▓ BANDEAU TITRE ▓▓ --}}
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="background:#6B46C1;padding:16px 0 16px 50px;vertical-align:middle;flex:1;">
                                <div style="font-size:7.5px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:5px;">
                                    &#8212; Document officiel &middot; GesParoisse
                                </div>
                                <div style="font-size:18px;font-weight:800;color:#fff;letter-spacing:1.2px;text-transform:uppercase;line-height:1;">
                                    CERTIFICAT D'ACTE LITURGIQUE
                                </div>
                            </td>
                            <td style="background:#1E40AF;padding:16px 50px 16px 30px;vertical-align:middle;text-align:right;white-space:nowrap;">
                                <div style="font-size:7.5px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:6px;">
                                    Type d'acte
                                </div>
                                <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.3);border-radius:18px;padding:6px 16px;font-size:10px;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;">
                                    {{ strtoupper($typeActe) }}
                                </div>
                            </td>
                        </tr>
                    </table>

                    {{-- ▓▓ BODY ▓▓ --}}
                    <table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 50px 16px 50px;">
                        <tr>
                            <td>

                                {{-- Label section Informations --}}
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                                    <tr>
                                        <td width="4" height="14" style="background:#6B46C1;border-radius:2px;font-size:0;">&nbsp;</td>
                                        <td width="8">&nbsp;</td>
                                        <td style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6B46C1;white-space:nowrap;vertical-align:middle;">
                                            Informations
                                        </td>
                                        <td style="border-bottom:1px solid #6B46C128;">&nbsp;</td>
                                    </tr>
                                </table>

                                {{-- ── Deux cartes ── --}}
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                                    <tr valign="top">

                                        {{-- Carte Demandeur --}}
                                        <td width="48%" style="border:1px solid #d6ccf0;border-radius:8px;overflow:hidden;vertical-align:top;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="background:#6B46C1;padding:8px 12px;border-radius:7px 7px 0 0;">
                                                        <table cellpadding="0" cellspacing="0">
                                                            <tr>
                                                                <td width="20" style="vertical-align:middle;">
                                                                    <div style="width:18px;height:18px;background:rgba(255,255,255,0.18);border-radius:4px;text-align:center;padding-top:2px;font-size:8px;font-weight:800;color:rgba(255,255,255,0.9);">ID</div>
                                                                </td>
                                                                <td style="padding-left:6px;font-size:7.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.9);vertical-align:middle;">
                                                                    Demandeur
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0ff;padding:1px 12px 4px;">
                                                <tr>
                                                    <td style="padding:6px 0;border-bottom:1px solid #6B46C115;">
                                                        <span style="display:block;font-size:7px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#6B46C188;margin-bottom:1px;">Nom &amp; Prénom</span>
                                                        <span style="font-size:11px;font-weight:700;color:#1a1e2e;line-height:1.2;">{{ $nomComplet !== '—' ? $nomComplet : '' }}</span>
                                                        @if($nomComplet === '—')<span class="f-empty">Non renseigné</span>@endif
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:6px 0;border-bottom:1px solid #6B46C115;">
                                                        <span style="display:block;font-size:7px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#6B46C188;margin-bottom:1px;">Téléphone</span>
                                                        <span style="font-size:11px;font-weight:700;color:#1a1e2e;line-height:1.2;">{{ $telephone !== '—' ? $telephone : '' }}</span>
                                                        @if($telephone === '—')<span class="f-empty">Non renseigné</span>@endif
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:6px 0;border-bottom:1px solid #6B46C115;">
                                                        <span style="display:block;font-size:7px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#6B46C188;margin-bottom:1px;">Classe</span>
                                                        <span style="font-size:11px;font-weight:700;color:#1a1e2e;line-height:1.2;">{{ $classe !== '—' ? $classe : '' }}</span>
                                                        @if($classe === '—')<span class="f-empty">Non renseignée</span>@endif
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:6px 0;">
                                                        <span style="display:block;font-size:7px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#6B46C188;margin-bottom:1px;">Famille</span>
                                                        <span style="font-size:11px;font-weight:700;color:#1a1e2e;line-height:1.2;">{{ $famille !== '—' ? $famille : '' }}</span>
                                                        @if($famille === '—')<span class="f-empty">Non renseignée</span>@endif
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>

                                        <td width="3%">&nbsp;</td>

                                        {{-- Carte Détails --}}
                                        <td width="49%" style="border:1px solid #c7d5f5;border-radius:8px;overflow:hidden;vertical-align:top;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="background:#1E40AF;padding:8px 12px;border-radius:7px 7px 0 0;">
                                                        <table cellpadding="0" cellspacing="0">
                                                            <tr>
                                                                <td width="20" style="vertical-align:middle;">
                                                                    <div style="width:18px;height:18px;background:rgba(255,255,255,0.18);border-radius:4px;text-align:center;padding-top:2px;font-size:8px;font-weight:800;color:rgba(255,255,255,0.9);">AC</div>
                                                                </td>
                                                                <td style="padding-left:6px;font-size:7.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.9);vertical-align:middle;">
                                                                    Détails
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff4ff;padding:1px 12px 4px;">
                                                <tr>
                                                    <td style="padding:6px 0;border-bottom:1px solid #1E40AF18;">
                                                        <span style="display:block;font-size:7px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#1E40AF88;margin-bottom:1px;">Type d'acte</span>
                                                        <span style="font-size:11px;font-weight:700;color:#1a1e2e;line-height:1.2;">{{ strtoupper($typeActe) }}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:6px 0;border-bottom:1px solid #1E40AF18;">
                                                        <span style="display:block;font-size:7px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#1E40AF88;margin-bottom:1px;">Nom du concerné</span>
                                                        @if($nomConcerne !== '—')
                                                        <span style="font-size:11px;font-weight:700;color:#1a1e2e;line-height:1.2;">{{ $nomConcerne }}</span>
                                                        @else
                                                        <span class="f-empty">Non renseigné</span>
                                                        @endif
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:6px 0;border-bottom:1px solid #1E40AF18;">
                                                        <span style="display:block;font-size:7px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#1E40AF88;margin-bottom:1px;">Date</span>
                                                        @if($dateDecesFormatted !== '—')
                                                        <span style="font-size:11px;font-weight:700;color:#1a1e2e;line-height:1.2;">{{ $dateDecesFormatted }}</span>
                                                        @else
                                                        <span class="f-empty">—</span>
                                                        @endif
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:6px 0;">
                                                        <span style="display:block;font-size:7px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#1E40AF88;margin-bottom:1px;">Lieu</span>
                                                        @if($lieuSepulture !== '—')
                                                        <span style="font-size:11px;font-weight:700;color:#1a1e2e;line-height:1.2;">{{ $lieuSepulture }}</span>
                                                        @else
                                                        <span class="f-empty">Non renseigné</span>
                                                        @endif
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>

                                    </tr>
                                </table>

                                {{-- Label Corps --}}
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;margin-top:4px;">
                                    <tr>
                                        <td width="4" height="14" style="background:#6B46C1;border-radius:2px;font-size:0;">&nbsp;</td>
                                        <td width="8">&nbsp;</td>
                                        <td style="font-size:7.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#6B46C1;white-space:nowrap;vertical-align:middle;">
                                            Corps de la demande
                                        </td>
                                        <td style="border-bottom:1px solid #6B46C128;">&nbsp;</td>
                                    </tr>
                                </table>

                                {{-- Corps box --}}
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                                    <tr>
                                        <td width="4" style="background:#6B46C1;border-radius:2px 0 0 2px;font-size:0;">&nbsp;</td>
                                        <td style="background:#f3f0ff;border:1px solid #d6ccf0;border-left:none;border-radius:0 7px 7px 0;padding:12px 16px;">
                                            <span style="font-size:11px;line-height:1.6;color:#2a2e42;font-style:italic;display:block;text-align:justify;">
                                                {{ $corps }}
                                            </span>
                                        </td>
                                    </tr>
                                </table>

                                {{-- Label Signatures --}}
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
                                    <tr>
                                        <td width="4" height="14" style="background:#6B46C1;border-radius:2px;font-size:0;">&nbsp;</td>
                                        <td width="8">&nbsp;</td>
                                        <td style="font-size:7.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#6B46C1;white-space:nowrap;vertical-align:middle;">
                                            Signatures &amp; Visas
                                        </td>
                                        <td style="border-bottom:1px solid #6B46C128;">&nbsp;</td>
                                    </tr>
                                </table>

                                {{-- Zone signatures --}}
                                <table width="100%" cellpadding="0" cellspacing="0" style="">
                                    <tr>
                                        <td width="47%" style="text-align:center;padding:8px 12px 0 0;border-right:1px dashed #6B46C135;">
                                            <div style="font-size:7px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6B46C180;margin-bottom:20px;">
                                                Signature du demandeur
                                            </div>
                                            <div style="height:1px;background:#6B46C150;margin-bottom:5px;"></div>
                                            <div style="font-size:9px;font-weight:600;color:#6b7280;">{{ $nomComplet }}</div>
                                        </td>
                                        <td width="6%">&nbsp;</td>
                                        <td width="47%" style="text-align:center;padding:8px 0 0 12px;">
                                            <div style="font-size:7px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6B46C180;margin-bottom:20px;">
                                                Visa &amp; Cachet du Pasteur
                                            </div>
                                            <div style="height:1px;background:#6B46C150;margin-bottom:5px;"></div>
                                            <div style="font-size:9px;font-weight:600;color:#6b7280;">Pasteur responsable</div>
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>
                    </table>

                    {{-- ▓▓ FOOTER ▓▓ --}}
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td width="33%" height="4" style="background:#6B46C1;font-size:0;line-height:0;">&nbsp;</td>
                            <td width="33%" height="4" style="background:#1E40AF;font-size:0;line-height:0;">&nbsp;</td>
                            <td width="34%" height="4" style="background:#B6C01A;font-size:0;line-height:0;">&nbsp;</td>
                        </tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0"
                        style="background:#f3f0ff;border-top:1px solid #d6ccf0;padding:10px 50px 10px 50px;">
                        <tr>
                            <td style="vertical-align:middle;">
                                <div style="font-size:8px;color:#9098b4;line-height:1.6;">
                                    Certificat généré automatiquement &middot; Système GesParoisse &middot; Église Méthodiste Jubilé de Cocody
                                </div>
                            </td>
                            <td style="vertical-align:middle;text-align:right;white-space:nowrap;padding-left:20px;">
                                <span style="display:inline-block;background:#fff;border:1.5px solid #6B46C140;border-radius:18px;padding:5px 14px;font-size:8px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#6B46C1;">
                                    &#x25cf;&nbsp; Acte validé
                                </span>
                            </td>
                        </tr>
                    </table>

                </td>
            </tr>
        </table>

    </div>
</body>

</html>