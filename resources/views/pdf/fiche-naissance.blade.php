@php
use Carbon\Carbon;

$details = $acte->details ?? [];
$createur = $acte->createur ?? $acte->membre ?? null;
$famille = $createur->family->nom ?? ($acte->family->nom ?? '');
$classe = $createur->classe->nom ?? ($acte->classe->nom ?? '');
$dateCulte = !empty($acte->date_souhaitee) ? Carbon::parse($acte->date_souhaitee)->format('d/m/Y') : '';
$heureCulte = $details['heure'] ?? '';
$nomEnfant = $details['nom_enfant'] ?? ($details['nom_concerne'] ?? '');
$dateLieuNaissance = $details['date_naissance'] ?? ($details['lieu_naissance'] ?? '');

$conducteur = $acte->conducteur ?? null;
$pasteur = $acte->pasteur ?? null;
$membre = $acte->membre ?? $createur;

$nomConducteur = $conducteur
? trim(($conducteur->prenom ?? '') . ' ' . ($conducteur->nom ?? ''))
: '';
$nomPasteur = $pasteur
? trim(($pasteur->prenom ?? '') . ' ' . ($pasteur->nom ?? ''))
: '';

$normalise = function (?string $value): string {
if (!is_string($value) || $value === '') {
return '';
}

$value = trim($value);
return function_exists('mb_strtolower') ? mb_strtolower($value) : strtolower($value);
};

$familyUsers = collect();
if ($membre && $membre->family) {
$familyUsers = $membre->family->users->filter(function ($user) use ($membre) {
return $user && $user->id !== $membre->id;
})->values();
}

$fullName = function ($user): string {
if (!$user) {
return '';
}

return trim(($user->prenom ?? '') . ' ' . ($user->nom ?? ''));
};

$findParentByRelation = function (array $keywords) use ($familyUsers, $normalise, $fullName): string {
foreach ($familyUsers as $user) {
$relation = $normalise($user->relation ?? '');
if ($relation === '') {
continue;
}

foreach ($keywords as $keyword) {
if (str_contains($relation, $normalise($keyword))) {
$name = $fullName($user);
if ($name !== '') {
return $name;
}
}
}
}

return '';
};

$findParentByGenre = function (array $keywords) use ($familyUsers, $normalise, $fullName): string {
foreach ($familyUsers as $user) {
$genre = $normalise($user->genre ?? '');
if ($genre === '') {
continue;
}

foreach ($keywords as $keyword) {
if (str_contains($genre, $normalise($keyword))) {
$name = $fullName($user);
if ($name !== '') {
return $name;
}
}
}
}

return '';
};

$pereDb = $findParentByRelation(['pere', 'pere biologique', 'papa']);
if ($pereDb === '') {
$pereDb = $findParentByGenre(['masculin', 'homme', 'male']);
}

$mereDb = $findParentByRelation(['mere', 'mere biologique', 'maman']);
if ($mereDb === '') {
$mereDb = $findParentByGenre(['feminin', 'femme', 'female']);
}

$pere = trim((string) ($details['nom_pere'] ?? '')) ?: $pereDb;
$mere = trim((string) ($details['nom_mere'] ?? '')) ?: $mereDb;
$officiant = $nomPasteur !== '' ? $nomPasteur : 'Pasteur non renseigne';

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

$signatureConducteurDataUri = $toSignatureDataUri($conducteur->signature_path ?? null);
$signaturePasteurDataUri = $toSignatureDataUri($pasteur->signature_path ?? null);
@endphp
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Presentation de nouveau-ne</title>
    <style>
        @page {
            margin: 20mm;
        }

        body {
            margin: 0;
            color: #111;
            background: #fff;
            font-family: "Times New Roman", Times, serif;
            font-size: 13px;
            line-height: 1.45;
        }

        .sheet {
            position: relative;
            padding: 14mm 12mm;
        }

        .content {
            width: 100%;
        }

        .header {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .header td {
            border: none;
            vertical-align: top;
            padding: 0;
        }

        .head-left,
        .head-right {
            width: 90px;
            text-align: center;
        }

        .logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
        }

        .logo-sub {
            margin-top: 2px;
            font-size: 10px;
            letter-spacing: 0.6px;
        }

        .church {
            text-align: center;
            font-size: 11px;
            line-height: 1.28;
        }

        .church .inst {
            font-variant: small-caps;
            letter-spacing: 0.9px;
            font-weight: 700;
        }

        .church .line {
            letter-spacing: 1px;
            color: #444;
        }

        .church .temple {
            font-weight: 700;
            font-size: 18px;
        }

        .title {
            margin: 18px 0 20px;
            text-align: center;
            color: #1857d6;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.5px;
        }

        .field {
            margin: 10px 0;
        }

        .field .label {
            font-weight: 700;
        }

        .field .dots {
            display: inline-block;
            border-bottom: 1px dotted #666;
            min-width: 330px;
            padding-bottom: 1px;
            margin-left: 6px;
        }

        .field .dots.small {
            min-width: 120px;
        }

        .field .dots.tiny {
            min-width: 80px;
        }

        .verse-1 {
            margin: 14px 0 8px;
            padding-left: 18px;
            font-style: italic;
            text-align: justify;
        }

        .verse-ref-right {
            text-align: right;
            margin-top: 4px;
            font-style: normal;
        }

        .family-block {
            margin: 14px 0;
            text-align: justify;
        }

        .family-block .fam-name {
            font-weight: 700;
        }

        .verse-2 {
            margin: 10px 0 14px;
            text-align: justify;
            font-weight: 700;
        }

        .verse-2-ref {
            text-align: right;
            margin-top: 4px;
            font-style: normal;
            font-weight: 400;
        }

        .blank-field {
            margin: 14px 0;
        }

        .blank-label {
            display: block;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .blank-line {
            display: inline-block;
            border-bottom: 1px dotted #666;
            width: 100%;
            height: 16px;
        }

        .inline-field {
            margin: 12px 0;
            font-weight: 700;
        }

        .inline-field .value {
            font-weight: 400;
            margin-left: 6px;
        }

        .signature-zone {
            margin-top: 30px;
            width: 100%;
            border-collapse: collapse;
        }

        .signature-zone td {
            border: none;
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 0 8px;
        }

        .sig-stack {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .sig-space {
            height: 56px;
            width: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            overflow: hidden;
            margin-top: 10px;
            margin-bottom: 6px;
        }

        .sig-image {
            max-height: 54px;
            max-width: 120px;
            object-fit: contain;
        }

        .sig-label {
            text-decoration: underline;
            font-weight: 700;
            font-size: 12px;
            margin-bottom: 6px;
        }

        .sig-name {
            margin-top: 0;
            font-size: 11px;
            font-weight: 700;
            min-height: 14px;
        }
    </style>
</head>

<body>
    <div class="sheet">
        <div class="content">
            <table class="header">
                <tr>
                    <td class="head-left">
                        @if(!empty($logoDataUri))
                        <img src="{{ $logoDataUri }}" alt="Logo église" class="logo">
                        @elseif(file_exists(public_path('images/logo.png')))
                        <img src="{{ public_path('images/logo.png') }}" alt="Logo église" class="logo">
                        @endif
                        <div class="logo-sub"></div>
                    </td>
                    <td class="church">
                        <div class="inst">EGLISE METHODISTE DE COTE D'IVOIRE</div>
                        <div class="line">---------------</div>
                        <div class="inst">DISTRICT ABIDJAN NORD</div>
                        <div class="line">--------</div>
                        <div class="temple">Temple du JUBILE de Cocody</div>
                    </td>
                    <td class="head-right">
                        @if(!empty($methoDataUri))
                        <img src="{{ $methoDataUri }}" alt="Logo jubilé" class="logo">
                        @elseif(file_exists(public_path('images/metho.jpg')))
                        <img src="{{ public_path('images/metho.jpg') }}" alt="Logo jubilé" class="logo">
                        @endif
                    </td>
                </tr>
            </table>

            <div class="title">PRESENTATION DE NOUVEAU-NE</div>

            <div class="field">
                <span class="label">Classe Méthodiste :</span>
                <span>{{ $classe }}</span>
            </div>
            <div class="field">
                <span class="label">Pour le culte du :</span>
                <span>{{ $dateCulte }}</span>
                <span class="label">à</span>
                <span>{{ $heureCulte }}</span>
            </div>

            <div class="verse-1">
                <div>« Lorsque l'enfant sera sevré, je le mènerai, afin qu'il soit</div>
                <div>présenté devant l'Éternel et qu'il reste là pour toujours. »</div>
                <div class="verse-ref-right">1Samuel 1 : 22</div>
            </div>

            <div class="family-block">
                La famille : <span class="fam-name">{{ strtoupper($famille) }}</span> est heureuse de présenter son nouveau-né au Seigneur.
            </div>

            <div class="verse-2">
                <div>
                    Afin qu'il croisse "en sagesse, en stature et en grâce, devant Dieu et devant les hommes."
                </div>
                <div class="verse-2-ref">Cf. Luc 2 : 52</div>
            </div>

            <div class="inline-field">
                Nom et prénoms de l'enfant :
                <span class="value">{{ $nomEnfant }}</span>
            </div>
            <div class="inline-field">
                Date et lieu de naissance :
                <span class="value">{{ $dateLieuNaissance }}</span>
            </div>
            <div class="inline-field">
                Nom et prénoms du père :
                <span class="value">{{ $pere }}</span>
            </div>
            <div class="inline-field">
                Nom et prénoms de la mère :
                <span class="value">{{ $mere }}</span>
            </div>
            <div class="inline-field">
                Nom et prénoms de l'officiant du jour :
                <span class="value">{{ $officiant }}</span>
            </div>

            <table class="signature-zone">
                <tr>
                    <td>
                        <div class="sig-stack">
                            <div class="sig-label">Conducteur de la Classe</div>
                            <div class="sig-space">
                                @if(!empty($signatureConducteurDataUri))
                                <img src="{{ $signatureConducteurDataUri }}" alt="Signature conducteur" class="sig-image">
                                @endif
                            </div>
                            <div class="sig-name">{{ $nomConducteur }}</div>
                        </div>
                    </td>
                    <td>
                        <div class="sig-stack">
                            <div class="sig-label">Bureau des Conducteurs</div>
                            <div class="sig-space"></div>
                            <div class="sig-name"></div>
                        </div>
                    </td>
                    <td>
                        <div class="sig-stack">
                            <div class="sig-label">Pasteur</div>
                            <div class="sig-space">
                                @if(!empty($signaturePasteurDataUri))
                                <img src="{{ $signaturePasteurDataUri }}" alt="Signature pasteur" class="sig-image">
                                @endif
                            </div>
                            <div class="sig-name">{{ $nomPasteur }}</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>

</html>