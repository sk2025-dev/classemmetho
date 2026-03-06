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
        @page { size: A4 portrait; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 11px;
            color: #1a1e2e;
            background: #fff;
            -webkit-print-color-adjust: exact;
        }

        .page { width: 210mm; min-height: 297mm; background: #fff; }

        .f-lbl {
            display: block;
            font-size: 8px; font-weight: 700;
            letter-spacing: 1px; text-transform: uppercase;
            color: #6B46C188; margin-bottom: 2px;
        }
        .f-val { font-size: 12.5px; font-weight: 700; color: #1a1e2e; line-height: 1.3; }
        .f-empty { font-size: 11px; font-weight: 400; color: #bbb; font-style: italic; }
    </style>
</head>
<body>
<div class="page">

<table width="100%" cellpadding="0" cellspacing="0" style="min-height:297mm;">
<tr>

  {{-- ══ BANDE LATÉRALE (3 segments de couleur) ══ --}}
  <td width="7" style="padding:0;vertical-align:top;">
    <div style="height:99mm;background:#6B46C1;font-size:0;"></div>
    <div style="height:99mm;background:#1E40AF;font-size:0;"></div>
    <div style="height:99mm;background:#B6C01A;font-size:0;"></div>
  </td>

  {{-- ══ CONTENU ══ --}}
  <td style="padding:0;vertical-align:top;">

    {{-- ▓▓ HEADER ▓▓ --}}
    <table width="100%" cellpadding="0" cellspacing="0"
           style="padding:24px 38px 0 40px;border-bottom:1px solid #e8e9f5;">
      <tr>
        {{-- Logo --}}
        <td width="70" style="vertical-align:middle;padding-right:14px;padding-bottom:18px;">
          <div style="width:64px;height:64px;border:2px solid #6B46C135;border-radius:12px;background:#f3f0ff;text-align:center;padding-top:14px;overflow:hidden;">
            @if(isset($logoPath) && file_exists(public_path($logoPath)))
              <img src="{{ public_path($logoPath) }}" width="60" height="60"
                   style="object-fit:contain;border-radius:10px;">
            @else
              <span style="font-size:8px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6B46C1;line-height:1.5;">LOGO<br>EMJC</span>
            @endif
          </div>
        </td>
        {{-- Nom église --}}
        <td style="vertical-align:middle;padding-bottom:18px;">
          <div style="font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#6B46C1;line-height:1.2;margin-bottom:2px;">
            Église Méthodiste
          </div>
          <div style="font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#1E40AF;line-height:1.2;margin-bottom:5px;">
            Jubilé de Cocody
          </div>
          <div style="font-size:9px;color:#9098b4;font-style:italic;">
            Quartier Cocody, Abidjan &middot; Côte d'Ivoire &middot; +225 07 48 30 01 11
          </div>
        </td>
        {{-- Réf + date --}}
        <td style="vertical-align:middle;text-align:right;padding-bottom:18px;white-space:nowrap;">
          <div style="display:inline-block;background:#f3f0ff;border:1.5px solid #d6ccf0;border-radius:7px;padding:5px 12px;font-size:9px;font-weight:700;color:#6B46C1;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:6px;">
            {{ $reference }}
          </div>
          <br>
          <span style="font-size:10px;color:#9098b4;">Émis le {{ $dateEmission }}</span>
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
        <td style="background:#6B46C1;padding:20px 0 20px 40px;vertical-align:middle;">
          <div style="font-size:8px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:6px;">
            &#8212; Document officiel &middot; GesParoisse
          </div>
          <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;line-height:1.1;">
            Fiche de Demande Liturgique
          </div>
        </td>
        <td style="background:#1E40AF;padding:20px 38px 20px 24px;vertical-align:middle;text-align:right;white-space:nowrap;width:185px;">
          <div style="font-size:8px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:8px;">
            Type d'acte
          </div>
          <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.3);border-radius:20px;padding:6px 16px;font-size:11px;font-weight:800;color:#fff;letter-spacing:2px;text-transform:uppercase;">
            {{ strtoupper($typeActe) }}
          </div>
        </td>
      </tr>
    </table>

    {{-- ▓▓ BODY ▓▓ --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 38px 20px 40px;">
      <tr><td>

        {{-- Label section Informations --}}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
          <tr>
            <td width="4" height="16" style="background:#6B46C1;border-radius:2px;font-size:0;">&nbsp;</td>
            <td width="9">&nbsp;</td>
            <td style="font-size:8.5px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#6B46C1;white-space:nowrap;vertical-align:middle;">
              Informations
            </td>
            <td style="border-bottom:1px solid #6B46C128;">&nbsp;</td>
          </tr>
        </table>

        {{-- ── Deux cartes ── --}}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
          <tr valign="top">

            {{-- Carte Demandeur --}}
            <td width="49%" style="border:1px solid #d6ccf0;border-radius:10px;overflow:hidden;vertical-align:top;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#6B46C1;padding:10px 15px;border-radius:9px 9px 0 0;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td width="24" style="vertical-align:middle;">
                        <div style="width:20px;height:20px;background:rgba(255,255,255,0.18);border-radius:5px;text-align:center;padding-top:3px;font-size:9px;font-weight:800;color:rgba(255,255,255,0.9);">ID</div>
                      </td>
                      <td style="padding-left:8px;font-size:8.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.9);vertical-align:middle;">
                        Demandeur
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0ff;padding:2px 15px 6px;">
                <tr><td style="padding:8px 0;border-bottom:1px solid #6B46C115;">
                  <span class="f-lbl">Nom &amp; Prénom</span>
                  <span class="f-val">{{ $nomComplet !== '—' ? $nomComplet : '' }}</span>
                  @if($nomComplet === '—')<span class="f-empty">Non renseigné</span>@endif
                </td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #6B46C115;">
                  <span class="f-lbl">Téléphone</span>
                  <span class="f-val">{{ $telephone !== '—' ? $telephone : '' }}</span>
                  @if($telephone === '—')<span class="f-empty">Non renseigné</span>@endif
                </td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #6B46C115;">
                  <span class="f-lbl">Classe</span>
                  <span class="f-val">{{ $classe !== '—' ? $classe : '' }}</span>
                  @if($classe === '—')<span class="f-empty">Non renseignée</span>@endif
                </td></tr>
                <tr><td style="padding:8px 0;">
                  <span class="f-lbl">Famille</span>
                  <span class="f-val">{{ $famille !== '—' ? $famille : '' }}</span>
                  @if($famille === '—')<span class="f-empty">Non renseignée</span>@endif
                </td></tr>
              </table>
            </td>

            <td width="2%">&nbsp;</td>

            {{-- Carte Détails --}}
            <td width="49%" style="border:1px solid #c7d5f5;border-radius:10px;overflow:hidden;vertical-align:top;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1E40AF;padding:10px 15px;border-radius:9px 9px 0 0;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td width="24" style="vertical-align:middle;">
                        <div style="width:20px;height:20px;background:rgba(255,255,255,0.18);border-radius:5px;text-align:center;padding-top:3px;font-size:9px;font-weight:800;color:rgba(255,255,255,0.9);">AC</div>
                      </td>
                      <td style="padding-left:8px;font-size:8.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.9);vertical-align:middle;">
                        Détails de la demande
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff4ff;padding:2px 15px 6px;">
                <tr><td style="padding:8px 0;border-bottom:1px solid #1E40AF18;">
                  <span style="display:block;font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1E40AF88;margin-bottom:2px;">Type d'acte</span>
                  <span class="f-val">{{ strtoupper($typeActe) }}</span>
                </td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #1E40AF18;">
                  <span style="display:block;font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1E40AF88;margin-bottom:2px;">Nom du défunt / Concerné</span>
                  @if($nomConcerne !== '—')
                    <span class="f-val">{{ $nomConcerne }}</span>
                  @else
                    <span class="f-empty">Non renseigné</span>
                  @endif
                </td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #1E40AF18;">
                  <span style="display:block;font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1E40AF88;margin-bottom:2px;">Date du décès</span>
                  @if($dateDecesFormatted !== '—')
                    <span class="f-val">{{ $dateDecesFormatted }}</span>
                  @else
                    <span class="f-empty">Non renseignée</span>
                  @endif
                </td></tr>
                <tr><td style="padding:8px 0;">
                  <span style="display:block;font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1E40AF88;margin-bottom:2px;">Lieu de sépulture</span>
                  @if($lieuSepulture !== '—')
                    <span class="f-val">{{ $lieuSepulture }}</span>
                  @else
                    <span class="f-empty">Non renseigné</span>
                  @endif
                </td></tr>
              </table>
            </td>

          </tr>
        </table>

        {{-- Label Corps --}}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:9px;">
          <tr>
            <td width="4" height="16" style="background:#6B46C1;border-radius:2px;font-size:0;">&nbsp;</td>
            <td width="9">&nbsp;</td>
            <td style="font-size:8.5px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#6B46C1;white-space:nowrap;vertical-align:middle;">
              Corps de la demande
            </td>
            <td style="border-bottom:1px solid #6B46C128;">&nbsp;</td>
          </tr>
        </table>

        {{-- Corps box --}}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td width="5" style="background:#6B46C1;border-radius:3px 0 0 3px;font-size:0;">&nbsp;</td>
            <td style="background:#f3f0ff;border:1px solid #d6ccf0;border-left:none;border-radius:0 9px 9px 0;padding:16px 20px;">
              <span style="font-size:12.5px;line-height:1.9;color:#2a2e42;font-style:italic;display:block;text-align:justify;">
                {{ $corps }}
              </span>
            </td>
          </tr>
        </table>

        {{-- Label Signatures --}}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:9px;">
          <tr>
            <td width="4" height="16" style="background:#6B46C1;border-radius:2px;font-size:0;">&nbsp;</td>
            <td width="9">&nbsp;</td>
            <td style="font-size:8.5px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#6B46C1;white-space:nowrap;vertical-align:middle;">
              Signatures &amp; Visas
            </td>
            <td style="border-bottom:1px solid #6B46C128;">&nbsp;</td>
          </tr>
        </table>

        {{-- Zone signatures --}}
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48%" style="text-align:center;padding:10px 14px 0 0;border-right:1px dashed #6B46C135;">
              <div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6B46C180;margin-bottom:28px;">
                Signature du demandeur
              </div>
              <div style="height:1px;background:#6B46C150;margin-bottom:7px;"></div>
              <div style="font-size:9.5px;font-weight:600;color:#6b7280;">{{ $nomComplet }}</div>
            </td>
            <td width="4%">&nbsp;</td>
            <td width="48%" style="text-align:center;padding:10px 0 0 14px;">
              <div style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6B46C180;margin-bottom:28px;">
                Visa &amp; Cachet du Pasteur
              </div>
              <div style="height:1px;background:#6B46C150;margin-bottom:7px;"></div>
              <div style="font-size:9.5px;font-weight:600;color:#6b7280;">Pasteur responsable</div>
            </td>
          </tr>
        </table>

      </td></tr>
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
           style="background:#f3f0ff;border-top:1px solid #d6ccf0;padding:12px 38px 12px 40px;">
      <tr>
        <td style="vertical-align:middle;">
          <div style="font-size:8.5px;color:#9098b4;line-height:1.75;">
            Fiche générée automatiquement &middot; Système GesParoisse<br>
            Église Méthodiste Jubilé de Cocody &middot; Tél : +225 07 48 30 01 11
          </div>
        </td>
        <td style="vertical-align:middle;text-align:right;white-space:nowrap;">
          <span style="display:inline-block;background:#fff;border:1.5px solid #6B46C140;border-radius:20px;padding:5px 15px;font-size:8.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#6B46C1;">
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