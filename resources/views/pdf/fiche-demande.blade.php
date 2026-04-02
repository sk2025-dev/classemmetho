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
'grace', 'remerciement', 'felicitations' => 'Demande d\'action de grâce',
'mariage' => 'Annonce de mariage',
'bapteme' => 'Présentation de baptême',
default => 'Fiche d\'acte liturgique',
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
$lieuAnnonce = $details['lieu'] ?? $details['lieu_deces'] ?? '—';

$nomConcerne = $details['nom_concerne'] ?? $details['nom_defunt'] ?? $details['conjoint_2'] ?? $nomComplet;
$nomPartenaire = trim((string) ($details['conjoint_1'] ?? $details['partenaire'] ?? '')) ?: '—';
$nomMembreConcerne = trim((string) ($details['conjoint_2'] ?? $nomConcerne)) ?: $nomComplet;

$reference = $acte->reference ?? '—';
$dateEmission = optional($acte->created_at)->format('d/m/Y') ?? now()->format('d/m/Y');

$toSignatureDataUri = function (?string $signaturePath): ?string {
if (empty($signaturePath) || !is_string($signaturePath)) return null;
if (str_starts_with($signaturePath, 'data:image/')) return $signaturePath;
$fullPath = storage_path('app/public/' . ltrim($signaturePath, '/'));
if (!is_file($fullPath)) return null;
$raw = @file_get_contents($fullPath);
if ($raw === false) return null;
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

// Cases à cocher selon le type d'acte
$checkboxesActionGrace = [
'guerison' => ['label' => 'Guérison', 'checked' => in_array($typeKey, ['grace', 'remerciement'])],
'deuil' => ['label' => 'Deuil', 'checked' => in_array($typeKey, ['deces', 'funerailles'])],
'mariage' => ['label' => 'Bénédiction de Mariage', 'checked' => $typeKey === 'mariage'],
'autres' => ['label' => 'Autre(s) bienfaits(s) :', 'checked' => !in_array($typeKey, ['grace','remerciement','deces','funerailles','mariage'])],
];
$checkboxesIntercession = [
'maladie' => ['label' => 'Maladie : (Préciser)……………………………………………………', 'checked' => false],
'probleme' => ['label' => 'Autre(s) problème(s) :', 'checked' => false],
'soutien' => ['label' => 'Soutien et assistance à : (nom de la personne)……………', 'checked' => false],
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
      margin: 10mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 10.5px;
      color: #111;
      background: #fff;
      /* -webkit-print-color-adjust: exact;
            print-color-adjust: exact; */
    }

    .page {
      width: 100%;
      max-width: 210mm;
      padding: 10px 12px;
      margin: auto;
      background: #fff;
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    /* ══ EN-TÊTE style image 1 ══ */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      table-layout: fixed;
    }

    .logo-cell,
    .logo-cell-right {
      width: 72px;
      vertical-align: middle;
      padding: 0 12px;
    }

    .logo-cell img,
    .logo-cell-right img {
      width: 60px;
      max-height: 60px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }

    .church-center {
      text-align: center;
      vertical-align: middle;
      padding: 0 10px;
      line-height: 1.2;
    }

    .church-unie {
      font-size: 10.2px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #111;
      margin-bottom: 2px;
    }

    .tirets {
      font-size: 10px;
      color: #555;
      letter-spacing: 2px;
      margin: 2px 0;
    }

    .church-district {
      font-size: 10.2px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #111;
      margin-bottom: 2px;
    }

    .church-temple {
      font-size: 13px;
      font-weight: 900;
      color: #111;
      margin-top: 2px;
    }

    .logo-cell-right {
      width: 72px;
      vertical-align: middle;
      padding: 0 12px;
    }

    .logo-cell-right img {
      width: 60px;
      max-height: 60px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }

    /* ══ TITRE PRINCIPAL (bleu centré) ══ */
    .main-title {
      text-align: center;
      font-size: 16px;
      font-weight: 500;
      text-transform: uppercase;
      color: #1a52a8;
      letter-spacing: 0.8px;
      margin: 10px 0 16px 0;
    }

    /* ══ CHAMPS SIMPLES ══ */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }

    .info-table td {
      vertical-align: top;
      padding: 3px 4px;
    }

    .info-table .label-cell {
      width: 150px;
      font-size: 10.2px;
      font-weight: 700;
      white-space: nowrap;
      padding-right: 10px;
    }

    .info-table .value-cell {
      font-size: 10.2px;
      line-height: 1.4;
    }

    .field-line {
      font-size: 10.2px;
      margin-bottom: 10px;
      line-height: 1.4;
    }

    .field-line b {
      font-weight: 700;
    }

    /* ══ VERSETS (italique centré) ══ */
    .verset-group {
      margin: 10px 0 6px 0;
    }

    .verset-block {
      text-align: center;
      margin: 0 auto 4px auto;
      font-size: 10.2px;
      font-style: italic;
      font-weight: 700;
      line-height: 1.45;
      color: #111;
      max-width: 100%;
    }

    .verset-ref {
      text-align: right;
      font-size: 10px;
      color: #333;
      margin-bottom: 6px;
    }

    /* ══ SUJET ══ */
    .sujet-line {
      font-size: 11px;
      font-weight: 700;
      margin: 18px 0 8px 0;
    }

    .sujet-line span {
      text-decoration: underline;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #1a52a8;
      margin: 14px 0 8px 0;
      padding-left: 0;
    }

    .checkbox-table {
      border-collapse: collapse;
      margin-left: 24px;
      margin-bottom: 14px;
      width: calc(100% - 24px);
    }

    /* ══ SECTION TITRE (puce bleue) ══ */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #1a52a8;
      margin: 16px 0 10px 24px;
    }

    /* ══ CASES À COCHER ══ */
    .checkbox-table {
      border-collapse: collapse;
      margin-left: 28px;
      margin-bottom: 14px;
    }

    .checkbox-table td {
      vertical-align: middle;
      padding: 1px 0;
    }

    .checkbox-cell {
      width: 18px;
      padding-right: 8px !important;
    }

    .checkbox-box {
      width: 12px;
      height: 12px;
      border: 1.2px solid #333;
      display: inline-block;
      text-align: center;
      line-height: 12px;
      font-size: 10px;
      vertical-align: middle;
    }

    .checkbox-box.checked {
      font-weight: 900;
      color: #111;
    }

    .checkbox-label {
      font-size: 10.2px;
      color: #111;
    }

    /* ══ LIGNE OUI/NON ══ */
    .oui-non {
      font-size: 10px;
      margin: 10px 0 12px 28px;
      line-height: 1.4;
    }

    .non-badge {
      display: inline-block;
      border: 1px solid #333;
      border-radius: 10px;
      padding: 0 6px;
      font-size: 9.5px;
      font-weight: 700;
    }

    /* ══ MOTIF ══ */
    .motif-line {
      font-size: 10.5px;
      font-weight: 700;
      margin: 16px 0 0 0;
    }

    .motif-content {
      font-size: 10.5px;
      margin: 3px auto 0 auto;
      line-height: 1.4;
      text-align: center;
      max-width: 100%;
    }

    /* ══ CORPS LETTRE (si contenu long) ══ */
    .paragraph {
      font-size: 10.5px;
      line-height: 1.45;
      text-align: justify;
      margin-bottom: 12px;
    }

    /* ══ SIGNATURES ══ */
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .sig-table td {
      width: 33.33%;
      text-align: center;
      vertical-align: bottom;
      padding: 0 6px;
    }

    .sig-label {
      font-size: 10px;
      font-weight: 700;
      text-decoration: underline;
      display: block;
      margin-bottom: 28px;
    }

    .sig-image {
      display: block;
      max-height: 36px;
      max-width: 120px;
      margin: 0 auto;
      object-fit: contain;
    }

    .sig-name {
      font-size: 10px;
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
  </style>
</head>

<body>
  <div class="page">

    {{-- ══ EN-TÊTE  (logo gauche · texte centré · logo droit) ══ --}}
    <table class="header-table">
      <tr>
        {{-- Logo gauche --}}
        <td class="logo-cell">
          @if(!empty($logoDataUri))
          <img src="{{ $logoDataUri }}" alt="Logo">
          @elseif(file_exists(public_path('images/logo.png')))
          <img src="{{ public_path('images/logo.png') }}" alt="Logo">
          @endif
        </td>

        {{-- Texte centré --}}
        <td class="church-center">
          <div class="church-unie">Eglise Méthodiste Unie de Côte d'Ivoire</div>
          <div class="tirets">- - - - - - - - - - - - - -</div>
          <div class="church-district">District Abidjan Nord</div>
          <div class="tirets">- - - - - - - -</div>
          <div class="church-temple">Temple du JUBILE de Cocody</div>
        </td>

        {{-- Logo droit --}}
        <td class="logo-cell-right">
          @if(!empty($methoDataUri))
          <img src="{{ $methoDataUri }}" alt="Logo EMUCI">
          @elseif(file_exists(public_path('images/metho.jpg')))
          <img src="{{ public_path('images/metho.jpg') }}" alt="Logo EMUCI">
          @endif
        </td>
      </tr>
    </table>

    {{-- ══ TITRE BLEU ══ --}}
    <div class="main-title">{{ $titreDocument }}</div>

    {{-- ══ CHAMPS NOM / CLASSE / DATE ══ --}}
    <table class="info-table">
      <tr>
        <td class="label-cell">Nom et Prénoms :</td>
        <td class="value-cell">{{ $nomComplet }}</td>
      </tr>
      <tr>
        <td class="label-cell">Classe Méthodiste :</td>
        <td class="value-cell">{{ $classe }}</td>
      </tr>
      <tr>
        <td class="label-cell">Pour le culte du :</td>
        <td class="value-cell">
          {{ $dateAnnonce !== '—' ? $dateAnnonce : '' }}
          @if($lieuAnnonce !== '—') à {{ $lieuAnnonce }} @endif
        </td>
      </tr>
    </table>

    {{-- ══ VERSETS D'OUVERTURE ══ --}}
    <div class="verset-group">
      <div class="verset-block">
        « O toi qui écoutes la prière !<br>
        Tous les hommes viendront à toi. »
      </div>
      <div class="verset-ref">Psaume 65 : 3</div>
    </div>

    <div class="verset-group">
      <div class="verset-block">
        « ...tout ce que vous demanderez en mon nom, je le ferai afin que le Père<br>
        soit glorifié dans le Fils. Si vous demandez quelque chose en mon nom, je le ferai. »
      </div>
      <div class="verset-ref">Jean 14 : 13-14</div>
    </div>

    {{-- ══ SUJET ══ --}}
    <div class="sujet-line">
      <span>Sujet :</span> (cocher la case concernée)
    </div>

    {{-- ══ SECTION 1 : Action de grâce ══ --}}
    <div class="section-title">&#8226; &nbsp;Prière d'action de grâce ou de remerciement pour :</div>
    <table class="checkbox-table">
      @foreach($checkboxesActionGrace as $key => $item)
      <tr>
        <td class="checkbox-cell">
          <div class="checkbox-box {{ $item['checked'] ? 'checked' : '' }}">
            {!! $item['checked'] ? '&#10007;' : '&nbsp;' !!}
          </div>
        </td>
        <td class="checkbox-label">{{ $item['label'] }}</td>
      </tr>
      @endforeach
    </table>

    <div class="oui-non">
      Voulez-vous pour cela rendre publiquement témoignage ?&nbsp;
      <span class="non-badge">NON</span>
      &nbsp;(Pour cas exceptionnel)
    </div>

    {{-- ══ SECTION 2 : Intercession ══ --}}
    <div class="section-title">&#8226; &nbsp;Prière d'intercession pour :</div>
    <table class="checkbox-table">
      @foreach($checkboxesIntercession as $key => $item)
      <tr>
        <td class="checkbox-cell">
          <div class="checkbox-box">
            &nbsp;
          </div>
        </td>
        <td class="checkbox-label">{{ $item['label'] }}</td>
      </tr>
      @endforeach
    </table>

    {{-- ══ MOTIF / MESSAGE ══ --}}
    <div class="motif-line">
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
    @endif

    {{-- ══ SIGNATURES ══ --}}
    <table class="sig-table">
      <tr>

        {{-- Conducteur --}}
        <td>
          <span class="sig-label">Conducteur de la Classe</span>
          @if(!empty($signatureConducteurDataUri))
          <img src="{{ $signatureConducteurDataUri }}"
            alt="Signature Conducteur" class="sig-image">
          @endif
          @if($nomConducteur && $nomConducteur !== 'Conducteur non renseigné')
          <span class="sig-name">{{ mb_strtoupper($nomConducteur, 'UTF-8') }}</span>
          @else
          <span class="sig-missing">Non renseigné</span>
          @endif
        </td>

        {{-- Bureau des Conducteurs --}}
        <td>
          <span class="sig-label">Bureau des Conducteurs</span>
          <span class="sig-name">&nbsp;</span>
        </td>

        {{-- Pasteur --}}
        <td>
          <span class="sig-label">Pasteur</span>
          @if(!empty($signaturePasteurDataUri))
          <img src="{{ $signaturePasteurDataUri }}"
            alt="Signature Pasteur" class="sig-image">
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