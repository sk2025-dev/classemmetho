@php
use App\Models\ActeLiturgique;
use Carbon\Carbon;

$details = $acte->details ?? [];
$createur = $acte->createur ?? $acte->membre ?? null;
$nomComplet = trim(($createur->prenom ?? '') . ' ' . ($createur->nom ?? '')) ?: '—';
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
'deces', 'funerailles' => 'Avis de Décès',
'grace', 'remerciement', 'felicitations' => 'Demande d\'Action de Grâce',
'mariage' => 'Annonce de Mariage',
'bapteme' => 'Présentation de Baptême',
default => "Demande d'action de grace ",
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
$dateAnnonce = $_dateCarbon ? $_dateCarbon->format('d/m/Y') : '';
$dateAnnonceTexte = $_dateCarbon ? $_dateCarbon->locale('fr')->isoFormat('dddd D MMMM YYYY') : '—';
$lieuAnnonce = $details['lieu'] ?? $details['lieu_deces'] ?? '';

$nomConcerne = $details['nom_concerne'] ?? $details['nom_defunt'] ?? $details['conjoint_2'] ?? $nomComplet;
$nomPartenaire = trim((string) ($details['conjoint_1'] ?? $details['partenaire'] ?? '')) ?: '—';
$nomMembreConcerne = trim((string) ($details['conjoint_2'] ?? $nomConcerne)) ?: $nomComplet;
$messageContent = trim((string) ($details['contenu'] ?? $details['titre'] ?? ''));
$dateEvenementTexte = $_dateCarbon ? ucfirst($dateAnnonceTexte) : '—';

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

$bodyParagraphs = match ($typeKey) {
'mariage' => [
"La famille <b><i>{$famille}</i></b> demande une action de grâce pour le mariage de <b><i>{$nomMembreConcerne}</i></b>"
. ($nomPartenaire !== '—' ? " et <b><i>{$nomPartenaire}</i></b>" : '')
. " afin de rendre gloire au Seigneur pour ses nombreux bienfaits et sa fidélité dans leur vie. Elle souhaite également exprimer sa reconnaissance pour le soutien spirituel, les prières et l'encouragement de la communauté.",
],
'bapteme' => [
"La famille <b><i>{$famille}</i></b> demande une action de grâce pour la présentation du baptême de <b><i>{$nomConcerne}</i></b> afin de rendre gloire au Seigneur pour ses nombreux bienfaits et sa fidélité. Elle confie <b><i>{$nomConcerne}</i></b> à la grâce et à la protection du Seigneur, et souhaite exprimer sa reconnaissance pour le soutien spirituel, les prières et l'encouragement de la communauté.",
],
'grace', 'remerciement', 'felicitations' => [
"La famille <b><i>{$famille}</i></b> sollicite une action de grâce"
. ($messageContent !== '' ? " pour <b><i>{$messageContent}</i></b>" : '')
. " afin de rendre gloire au Seigneur pour ses nombreux bienfaits et sa fidélité dans leur vie. Elle souhaite également exprimer sa reconnaissance pour le soutien spirituel, les prières et l'encouragement de la communauté.",
],
'deces', 'funerailles' => [
"La famille <b><i>{$famille}</i></b> informe la communauté du rappel à Dieu de <b><i>{$nomConcerne}</i></b>, survenu le <b>{$dateEvenementTexte}</b>. En cette circonstance, la famille demande des prières et sollicite le soutien spirituel de la communauté afin que le Seigneur accorde le repos éternel au défunt et réconforte les cœurs de la famille éprouvée.",
],
default => [
"La famille <b><i>{$famille}</i></b> demande une action de grâce pour la présentation de {$objet}"
. ($nomConcerne !== '—' ? " concernant <b><i>{$nomConcerne}</i></b>" : '')
. " afin de rendre gloire au Seigneur pour ses nombreux bienfaits et sa fidélité. Elle souhaite exprimer sa reconnaissance pour le soutien spirituel, les prières et l'encouragement de la communauté.",
],
};

$messageContentNormalized = mb_strtolower($messageContent, 'UTF-8');

$isMariage = $typeKey === 'mariage'
|| str_contains($messageContentNormalized, 'mariage')
|| str_contains($messageContentNormalized, 'union');

$isGuerison = str_contains($messageContentNormalized, 'guerison')
|| str_contains($messageContentNormalized, 'guérison')
|| str_contains($messageContentNormalized, 'maladie')
|| str_contains($messageContentNormalized, 'malade')
|| str_contains($messageContentNormalized, 'sante')
|| str_contains($messageContentNormalized, 'santé');

$isActionDeGrace = in_array($typeKey, ['grace', 'remerciement', 'felicitations'])
|| str_contains($messageContentNormalized, 'action de grace')
|| str_contains($messageContentNormalized, 'action de grâce')
|| str_contains($messageContentNormalized, 'remerciement')
|| str_contains($messageContentNormalized, 'reconnaissance')
|| str_contains($messageContentNormalized, 'gratitude');

$isAutre = !$isMariage && !$isGuerison && !$isActionDeGrace;

$checkboxesActionGrace = [
'mariage' => ['label' => 'Mariage', 'checked' => $isMariage],
'guerison' => ['label' => 'Guérison', 'checked' => $isGuerison],
'action_de_grace'=> ['label' => 'Action de grâce', 'checked' => $isActionDeGrace],
'autres' => ['label' => 'Autre(s) :', 'checked' => $isAutre],
];
$checkboxesIntercession = [
'maladie' => ['label' => 'Maladie : (Préciser)…………………………………………………………………'],
'probleme' => ['label' => 'Autre(s) problème(s) :'],
'soutien' => ['label' => 'Soutien et assistance à : (nom de la personne)……………………'],
];
@endphp
<!DOCTYPE html>
<html lang="fr">

<head>
  <meta charset="UTF-8">
  <title>{{ $titreDocument }}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 18mm 18mm 18mm;
    }


    body {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 5.5px;
      color: #111;
      background: #fff;
    }

    .page {
      width: 100%;
      background: #fff;
      overflow: hidden;
    }

    /* ══ EN-TÊTE ══ */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      table-layout: fixed;
    }

    .logo-cell {
      width: 80px;
      vertical-align: middle;
      text-align: center;
      padding: 0;
    }

    .logo-cell img {
      width: 72px;
      height: 72px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }

    .church-center {
      text-align: center;
      vertical-align: middle;
      padding: 0 6px;
    }

    .church-unie {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1.4;
      margin-bottom: 2px;
    }

    .tirets {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 8px;
      color: #555;
      letter-spacing: 3px;
      margin: 2px 0;
    }

    .church-district {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }

    .church-temple {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 11px;
      font-weight: 900;
      margin-top: 3px;
    }

    /* ══ TITRE ══ */
    .main-title {
      font-family: DejaVu Sans, Arial, sans-serif;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      color: #1a52a8;
      letter-spacing: 1px;
      margin: 12px 0 14px 0;
    }

    /* ══ INFO ══ */
    .info-block {
      margin-bottom: 8px;
    }

    .info-line {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 10px;
      margin-bottom: 3px;
      line-height: 1.4;
    }

    /* ══ VERSETS ══ */
    .verset-block {
      text-align: center;
      font-size: 10px;
      font-style: italic;
      font-weight: 70;
      line-height: 1.55;

      padding: 0 10px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .verset-ref {
      font-family: DejaVu Sans, Arial, sans-serif;
      text-align: right;
      font-size: 9px;
      color: #333;
      margin-bottom: 5px;
    }

    /* ══ SUJET ══ */
    .sujet-line {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 10.5px;
      font-weight: 700;
      margin: 14px 0 10px 0;
    }

    .sujet-line span {
      text-decoration: underline;
    }

    /* ══ SECTION ══ */
    .section-title {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 10.5px;
      font-weight: 700;
      color: #1a52a8;
      margin: 10px 0 8px 0;
      text-align: center;
    }

    /* ══ CHECKBOXES ══ */
    .checkbox-table {
      border-collapse: collapse;
      margin-left: 16px;
      margin-bottom: 8px;
    }

    .checkbox-table td {
      vertical-align: middle;
      padding: 3px 0;
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 10.5px;
    }

    .checkbox-cell {
      width: 22px;
      padding-right: 10px !important;
    }

    .checkbox-box {
      width: 14px;
      height: 14px;
      border: 1.2px solid #333;
      display: inline-block;
      text-align: center;
      line-height: 13px;
      font-size: 11px;
      vertical-align: middle;
    }

    /* ══ OUI/NON ══ */
    .oui-non {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 10px;
      margin: 6px 0 10px 16px;
      line-height: 1.5;
    }

    .non-badge {
      display: inline-block;
      border: 1px solid #333;
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 9.5px;
      font-weight: 700;
    }

    /* ══ MOTIF ══ */
    .motif-line {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 10.5px;
      font-weight: 700;
      margin: 14px 0 4px 0;
    }

    .motif-content {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 10.5px;
      margin: 4px 0 6px 0;
      line-height: 1.5;
      text-align: center;
    }

    /* ══ PARAGRAPHES ══ */
    .paragraph {
      font-family: DejaVu Sans, Arial, sans-serif;
      font-size: 10.5px;
      line-height: 1.6;
      text-align: center;
      margin-top: 10px;
      margin-bottom: 8px;
    }

    /* ══ SIGNATURES ══ */
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }

    .sig-table td {
      width: 33.33%;
      text-align: center;
      vertical-align: bottom;
      padding: 0 4px;
      font-family: DejaVu Sans, Arial, sans-serif;
    }

    .sig-label {
      font-size: 10px;
      font-weight: 700;
      text-decoration: underline;
      display: block;
      margin-bottom: 30px;
    }

    .sig-image {
      display: block;
      max-height: 40px;
      max-width: 110px;
      margin: 0 auto 4px auto;
      object-fit: contain;
    }

    .sig-name {
      font-size: 10px;
      font-weight: 700;
      display: block;
      margin-top: 4px;
    }

    .sig-missing {
      font-size: 9.5px;
      color: #ef4444;
      display: block;
    }
  </style>
</head>

<body>
  <div class="page">

    {{-- ══ EN-TÊTE ══ --}}
    <table class="header-table">
      <tr>
        <td class="logo-cell">
          @if(!empty($logoDataUri))
          <img src="{{ $logoDataUri }}" alt="Logo Jubilé de Cocody">
          @elseif(file_exists(public_path('images/logo.png')))
          <img src="{{ public_path('images/logo.png') }}" alt="Logo Jubilé de Cocody">
          @endif
        </td>
        <td class="church-center">
          <div class="church-unie">Eglise Méthodiste Unie de Côte d'Ivoire</div>
          <div class="tirets">- - - - - - - - - - - - - -</div>
          <div class="church-district">District Abidjan Nord</div>
          <div class="tirets">- - - - - - - -</div>
          <div class="church-temple">Temple du JUBILÉ de Cocody</div>
        </td>
        <td class="logo-cell">
          @if(!empty($methoDataUri))
          <img src="{{ $methoDataUri }}" alt="Logo EMUCI">
          @elseif(file_exists(public_path('images/metho.jpg')))
          <img src="{{ public_path('images/metho.jpg') }}" alt="Logo EMUCI">
          @endif
        </td>
      </tr>
    </table>

    {{-- ══ TITRE ══ --}}
    <div class="main-title">{{ $titreDocument }}</div>

    {{-- ══ CHAMPS ══ --}}
    <div class="info-block">
      <div class="info-line"><b>Nom et Prénoms :</b>&nbsp;&nbsp;{{ $nomComplet }}</div>
      <div class="info-line"><b>Classe Méthodiste :</b>&nbsp;&nbsp;{{ $classe }}</div>
      <div class="info-line">
        <b>Pour le culte du :</b>&nbsp;&nbsp;{{ $dateAnnonce }}
        @if($lieuAnnonce) &nbsp;à {{ $lieuAnnonce }} @endif
      </div>
    </div>

    {{-- ══ VERSETS ══ --}}
    <div class="verset-block">
      « O toi qui écoutes la prière !<br>
      Tous les hommes viendront à toi. »
    </div>
    <div class="verset-ref">Psaume 65 : 3</div>

    <div class="verset-block">
      « …tout ce que vous demanderez en mon nom, je le ferai afin que le Père<br>
      soit glorifié dans le Fils. Si vous demandez quelque chose en mon nom, je le ferai. »
    </div>
    <div class="verset-ref">Jean 14 : 13-14</div>

    {{-- ══ SUJET ══ --}}
    <div class="sujet-line"><span>Sujet :</span> (cocher la case concernée)</div>

    {{-- Section 1 --}}
    <div class="section-title">&#8226;&nbsp; Prière d'action de grâce ou de remerciement pour :</div>
    <table class="checkbox-table">
      @foreach($checkboxesActionGrace as $item)
      <tr>
        <td class="checkbox-cell">
          <div class="checkbox-box">{!! $item['checked'] ? '&#10007;' : '&nbsp;' !!}</div>
        </td>
        <td>{{ $item['label'] }}</td>
      </tr>
      @endforeach
    </table>

    <div class="oui-non">
      Voulez-vous pour cela rendre publiquement témoignage ?&nbsp;
      <span class="non-badge">NON</span>
      &nbsp;(Pour cas exceptionnel)
    </div>

    {{-- Section 2 --}}
    <div class="section-title">&#8226;&nbsp; Prière d'intercession pour :</div>
    <table class="checkbox-table">
      @foreach($checkboxesIntercession as $item)
      <tr>
        <td class="checkbox-cell">
          <div class="checkbox-box">&nbsp;</div>
        </td>
        <td>{{ $item['label'] }}</td>
      </tr>
      @endforeach
    </table>

    {{-- ══ MOTIF ══ --}}
    <div class="motif-line">
      Motif <span style="font-weight:400;">(si nécessaire, pour aider à la précision de la prière)</span>
    </div>
    @php
    $motifAffiche = !empty($messageContent) && !in_array($typeKey, ['grace','remerciement','felicitations','mariage','bapteme','deces','funerailles'])
    ? $messageContent
    : null;
    @endphp
    @if($motifAffiche)
    <div class="motif-content">{!! nl2br(e($motifAffiche)) !!}</div>
    @endif

    {{-- ══ CORPS ══ --}}
    @if(count($bodyParagraphs) > 0 && !empty(strip_tags($bodyParagraphs[0])))
    @foreach($bodyParagraphs as $p)
    <div class="paragraph">{!! $p !!}</div>
    @endforeach
    @endif

    {{-- ══ SIGNATURES ══ --}}
    <table class="sig-table">
      <tr>
        <td>
          <span class="sig-label">Conducteur de la Classe</span>
          @if(!empty($signatureConducteurDataUri))
          <img src="{{ $signatureConducteurDataUri }}" alt="Signature Conducteur" class="sig-image">
          @endif
          @if($nomConducteur && $nomConducteur !== 'Conducteur non renseigné')
          <span class="sig-name">{{ mb_strtoupper($nomConducteur, 'UTF-8') }}</span>
          @else
          <span class="sig-missing">Non renseigné</span>
          @endif
        </td>
        <!-- <td>
        <span class="sig-label">Bureau des Conducteurs</span>
        <span class="sig-name">&nbsp;</span>
      </td> -->
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