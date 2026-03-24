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
'deces', 'funerailles' => 'Avis de décès',
'grace', 'remerciement', 'felicitations' => 'Demande d’action de grâce',
'mariage' => 'Annonce de mariage',
'bapteme' => 'Présentation de baptême',
default => 'Fiche d’acte liturgique',
};

$objet = match ($typeKey) {
'deces', 'funerailles' => 'Décès',
'grace', 'remerciement', 'felicitations' => 'Action de grâce',
'mariage' => 'Mariage',
'bapteme' => 'Baptême',
default => $typeActe,
};

$dateCandidate = $acte->date_souhaitee;
$_dateCarbon = $dateCandidate ? Carbon::parse($dateCandidate) : null;
$dateAnnonce = $_dateCarbon ? $_dateCarbon->format('d/m/Y') : '—';
$dateAnnonceTexte = $_dateCarbon
    ? $_dateCarbon->locale('fr')->isoFormat('dddd D MMMM YYYY')
    : '—';
$heureAnnonce = $details['heure'] ?? ($_dateCarbon ? $_dateCarbon->format('H\hi') : '—');
$lieuAnnonce = $details['lieu'] ?? $details['lieu_deces'] ?? '—';

// Nom de la personne concernée
$nomConcerne = $details['nom_concerne'] ?? $details['nom_defunt'] ?? $details['conjoint_2'] ?? $nomComplet;
$nomPartenaire = trim((string) ($details['conjoint_1'] ?? $details['partenaire'] ?? '')) ?: '—';
$nomMembreConcerne = trim((string) ($details['conjoint_2'] ?? $nomConcerne)) ?: $nomComplet;

$reference = $acte->reference ?? '—';
$dateEmission = optional($acte->created_at)->format('d/m/Y') ?? now()->format('d/m/Y');

$toSignatureDataUri = function (?string $signaturePath): ?string {
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

$signatureConducteurDataUri = $signatureConducteurDataUri ?? $toSignatureDataUri($conducteur->signature_path ?? null);
$signaturePasteurDataUri = $signaturePasteurDataUri ?? $toSignatureDataUri($pasteur->signature_path ?? null);

$dateEvenementTexte = $_dateCarbon ? ucfirst($dateAnnonceTexte) : '—';
$messageContent = trim((string) ($details['contenu'] ?? $details['titre'] ?? ''));

$bodyParagraphs = match ($typeKey) {
'mariage' => [
"La famille <b><i>{$famille}</i></b> sollicite une action de grâce devant l'assemblée à l'occasion du mariage de <b><i>{$nomMembreConcerne}</i></b>" . ($nomPartenaire !== '—' ? " et <b><i>{$nomPartenaire}</i></b>" : '') . ", célébré le <b>{$dateEvenementTexte}</b>.",
"Par cette démarche, la famille souhaite rendre gloire à Dieu pour cette union bénie et exprimer sa profonde reconnaissance à la communauté pour les prières, le soutien et l’accompagnement manifestés lors de cette heureuse célébration.",
],
'bapteme' => [
"La famille <b><i>{$famille}</i></b> sollicite la présentation devant l'assemblée du baptême de <b><i>{$nomConcerne}</i></b>, prévu le <b>{$dateEvenementTexte}</b>.",
"À cette occasion, la famille confie <b><i>{$nomConcerne}</i></b> à la grâce et à la protection du Seigneur, et sollicite les prières et l'accompagnement spirituel de la communauté pour sa croissance dans la foi chrétienne.",
],
'grace', 'remerciement', 'felicitations' => [
"La famille <b><i>{$famille}</i></b> sollicite une action de grâce devant l'assemblée, afin de rendre gloire à Dieu pour ses nombreux bienfaits et pour sa fidélité dans leur vie.",
"Elle souhaite également exprimer sa reconnaissance pour le soutien spirituel, les prières et l’encouragement de la communauté.",
],
'deces', 'funerailles' => [
"La famille <b><i>{$famille}</i></b> informe la communauté du rappel à Dieu de <b><i>{$nomConcerne}</i></b>, survenu le <b>{$dateEvenementTexte}</b>.",
"En cette circonstance douloureuse, la famille sollicite le soutien spirituel et les prières de l’assemblée, afin que le Seigneur accorde le repos éternel au défunt et réconforte les cœurs de la famille éprouvée.",
],
default => [
"La famille <b><i>{$famille}</i></b> sollicite auprès de la communauté la présentation de {$objet}" . ($nomConcerne !== '—' ? " concernant <b><i>{$nomConcerne}</i></b>" : '') . ", prévue le <b>{$dateEvenementTexte}</b>.",
"Par cette démarche, la famille souhaite informer l’assemblée et sollicite ses prières, son accompagnement spirituel ainsi que son soutien fraternel.",
],
};
@endphp
<!DOCTYPE html>
<html lang="fr">

<head>
  <meta charset="UTF-8">
  <title>{{ $titreDocument }} — {{ $reference }}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 11.5px;
      color: #111;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      background: #fff;
      padding: 0;
    }

    /* ── Ligne horizontale standard ── */
    .hr {
      width: 100%;
      height: 1px;
      background: #222;
      font-size: 0;
      line-height: 0;
    }

    .hr-light {
      width: 100%;
      height: 1px;
      background: #ccc;
      font-size: 0;
      line-height: 0;
    }

    /* ── Champs avec ligne de soulignement ── */
    .field-row td {
      padding: 7px 0 3px 0;
      vertical-align: bottom;
      border-bottom: 1px solid #333;
    }

    .field-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #111;
      white-space: nowrap;
      padding-right: 10px !important;
      border-bottom: none !important;
    }

    .field-value {
      font-size: 12px;
      color: #111;
      width: 100%;
    }

    /* ── Corps lettre ── */
    .body-text {
      font-size: 11.5px;
      line-height: 1.85;
      color: #111;
      text-align: justify;
    }

    /* ── Signatures ── */
    .sig-label {
      font-size: 10.5px;
      font-weight: 700;
      text-decoration: underline;
      color: #111;
      margin-bottom: 28px;
    }

    .sig-name {
      font-size: 12px;
      font-weight: 700;
      color: #111;
      text-transform: uppercase;
      margin-top: 4px;
    }
  </style>
</head>

<body>
  <div class="page">

    {{-- ══════════════════════════════════
         EN-TÊTE INSTITUTIONNEL
    ══════════════════════════════════ --}}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="padding: 28px 45px 12px 45px;">
      <tr valign="top">

        {{-- Logo --}}
        <td width="72" style="padding-right: 16px; vertical-align: top; padding-top: 4px;">
          @if(!empty($logoDataUri))
          <img src="{{ $logoDataUri }}" width="64" height="64"
            style="border-radius: 6px;">
          @elseif(file_exists(public_path('images/logo.png')))
          <img src="{{ public_path('images/logo.png') }}" width="64" height="64"
            style="border-radius: 6px;">
          @else
          <div style="width:64px;height:64px;border:1px solid #ccc;
                                border-radius:6px;text-align:center;padding-top:20px;
                                font-size:7px;font-weight:800;color:#333;">
            LOGO
          </div>
          @endif
        </td>

        {{-- Identité église --}}
        <td style="vertical-align: top;">
          <div style="font-size: 17px; font-weight: 900; text-transform: uppercase;
                            letter-spacing: 0.5px; color: #0F1E40; line-height: 1.2;
                            margin-bottom: 3px;">
            Eglise Méthodiste de Côte d'Ivoire
          </div>
          <div style="font-size: 10px; font-weight: 600; text-transform: uppercase;
                            letter-spacing: 1px; color: #555; margin-bottom: 2px;">
            District Abidjan Nord
          </div>
          <div style="font-size: 13px; font-weight: 700; font-style: italic;
                            color: #1E40AF; margin-top: 4px;">
            Temple du Jubilé de Cocody
          </div>
        </td>

        {{-- Référence discrète --}}
        <td style="vertical-align: top; text-align: right; white-space: nowrap;">
          <div style="font-size: 8.5px; color: #888; margin-bottom: 3px;">
            Réf : {{ $reference }}
          </div>
          <div style="font-size: 8.5px; color: #888;">
            Abidjan, le {{ $dateEmission }}
          </div>
        </td>

      </tr>
    </table>

    {{-- Ligne séparatrice épaisse --}}
    <div style="margin: 0 45px;">
      <div class="hr"></div>
    </div>

    {{-- ══════════════════════════════════
         TITRE ENCADRÉ CENTRÉ
    ══════════════════════════════════ --}}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="padding: 22px 45px 18px 45px;">
      <tr>
        <td style="text-align: center;">
          <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td style="border: 1.5px solid #333; padding: 10px 40px;">
                <span style="font-size: 15px; font-weight: 700;
                                         text-transform: uppercase; letter-spacing: 1.5px;
                                         color: #111; font-family: DejaVu Sans, Arial, sans-serif;">
                  {{ $titreDocument }}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    {{-- ══════════════════════════════════
         CHAMPS INFORMATIFS
    ══════════════════════════════════ --}}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="padding: 0 45px 6px 45px;">

      {{-- DEMANDEUR --}}
      <tr class="field-row">
        <td class="field-label">Demandeur :</td>
        <td class="field-value">{{ $nomComplet }}</td>
      </tr>

      {{-- Espacement --}}
      <tr>
        <td colspan="2" style="height: 6px;"></td>
      </tr>

      {{-- FAMILLE --}}
      <tr class="field-row">
        <td class="field-label">Famille :</td>
        <td class="field-value">{{ $famille }}</td>
      </tr>

      <tr>
        <td colspan="2" style="height: 6px;"></td>
      </tr>

      {{-- CLASSE --}}
      <tr class="field-row">
        <td class="field-label">Classe :</td>
        <td class="field-value">{{ $classe }}</td>
      </tr>

      <tr>
        <td colspan="2" style="height: 6px;"></td>
      </tr>

      {{-- DATE SOUHAITEE --}}
      <tr class="field-row">
        <td class="field-label">Date souhaitée :</td>
        <td class="field-value">
          {{ ucfirst($dateAnnonceTexte !== '—' ? $dateAnnonceTexte : $dateAnnonce) }}
        </td>
      </tr>

      <tr>
        <td colspan="2" style="height: 6px;"></td>
      </tr>

    </table>

    {{-- ══════════════════════════════════
         CORPS DE LA LETTRE
    ══════════════════════════════════ --}}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="padding: 22px 45px 0 45px;">
      <tr>
        <td>
          {{-- Objet --}}
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 14px;">
            <span style="font-weight: 700;">Objet : </span>{{ $objet }}
          </div>

          {{-- Formule d'appel --}}
          <div class="body-text" style="margin-bottom: 12px;">
            Chers Responsables de la communauté,
          </div>

          @foreach($bodyParagraphs as $paragraph)
          <div class="body-text" style="margin-bottom: 12px;">
            {!! $paragraph !!}
          </div>
          @endforeach

          @if(!empty($messageContent))
          <div class="body-text" style="margin-bottom: 12px;">
            <strong>Message transmis à l'assemblée :</strong><br>
            {!! nl2br(e($messageContent)) !!}
          </div>
          @endif

          {{-- Formule de politesse --}}
          <div class="body-text" style="margin-bottom: 12px;">
            Dans l'attente d'une suite favorable à notre demande, nous vous prions d'agréer,
            Madame(s) / Monsieur(s) les Responsables, l'expression de nos salutations
            respectueuses et fraternelles en Christ.
          </div>

          <div class="body-text" style="margin-bottom: 0;">
            Fait à : Abidjan.
          </div>

        </td>
      </tr>
    </table>

    {{-- ══════════════════════════════════
         SIGNATURES
    ══════════════════════════════════ --}}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="padding: 30px 45px 0 45px;">
      <tr valign="top">

        {{-- Signature Conducteur --}}
        <td width="48%" style="text-align: left;">
          <div class="sig-label">Conducteur de la Classe :</div>

          {{-- Espace signature --}}
          @if(!empty($signatureConducteurDataUri))
          <img src="{{ $signatureConducteurDataUri }}"
            style="max-width: 150px; max-height: 45px; display: block; margin-bottom: 6px;">
          @else
          <div style="height: 45px;"></div>
          @endif

          <div class="sig-name">{{ $nomConducteur }}</div>
        </td>

        {{-- Signature Pasteur / Bureau --}}
        <td width="4%"></td>
        <td width="48%" style="text-align: right;">
          <div class="sig-label">Bureau des Conducteurs / Pasteur</div>

          @if(!empty($signaturePasteurDataUri))
          <img src="{{ $signaturePasteurDataUri }}"
            style="max-width: 150px; max-height: 45px;
                                display: block; margin: 0 0 6px auto;">
          @else
          <div style="height: 45px;"></div>
          @endif

          <div class="sig-name">{{ $nomPasteur }}</div>
        </td>

      </tr>
    </table>

    {{-- ══════════════════════════════════
         FOOTER — VERSETS BIBLIQUES
    ══════════════════════════════════ --}}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="padding: 30px 45px 0 45px; margin-top: auto;">
      <tr>
        <td>
          <div class="hr"></div>
          <div style="text-align: center; padding: 10px 20px 0 20px;">
            <div style="font-size: 9px; font-style: italic; color: #333;
                                line-height: 1.7; margin-bottom: 4px;">
              Psaume 65 : 3 &laquo; O toi qui écoutes la prière ! Tous les hommes viendront à toi. &raquo;
            </div>
            <div style="font-size: 9px; font-style: italic; color: #333; line-height: 1.7;">
              Jean 14 : 13-14 &laquo; ...tout ce que vous demanderez en mon nom, je le ferai afin que le Père
              soit glorifié dans le Fils. Si vous demandez quelque chose en mon nom, je le ferai. &raquo;
            </div>
          </div>
        </td>
      </tr>
    </table>

  </div>
</body>

</html>
