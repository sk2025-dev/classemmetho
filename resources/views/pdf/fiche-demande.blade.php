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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fiche de demande {{ $typeActe }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #f4f4f5;
            font-family: 'Libre Baskerville', 'Times New Roman', Georgia, serif;
            color: #111;
            line-height: 1.6;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 18px auto;
            padding: 32px 36px;
            background: #fff;
            border-radius: 12px;
            border: 1px solid #e6e6e9;
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #c8c8c8;
            padding-bottom: 12px;
            margin-bottom: 18px;
        }

        .logo {
            width: 88px;
            height: 88px;
            background: #f1f1f3;
            border-radius: 6px;
            border: 1px solid #dcdce0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            letter-spacing: 0.2px;
            text-transform: uppercase;
            color: #5e6274;
        }

        .church-info {
            text-align: right;
            font-size: 12px;
            color: #4b4d5b;
            line-height: 1.4;
        }

        .church-info .name {
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 14px;
            color: #1f2933;
        }

        .title-group {
            text-align: center;
            margin-top: 18px;
            margin-bottom: 30px;
        }

        .title-group h1 {
            font-size: 28px;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }

        .title-group .meta {
            font-size: 13px;
            color: #444b60;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 18px;
            margin-bottom: 26px;
        }

        .card {
            background: #fff;
            border-radius: 10px;
            border: 1px solid #ececec;
            padding: 16px 18px;
            box-shadow: 0 5px 16px rgba(15, 23, 42, 0.04);
        }

        .card h2 {
            font-size: 12px;
            text-transform: uppercase;
            color: #8f93a5;
            letter-spacing: 0.4px;
            margin-bottom: 8px;
        }

        .card .row {
            font-size: 14px;
            margin-bottom: 14px;
            border-bottom: 1px dotted #d3d3d6;
            padding-bottom: 10px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .card .row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .card .label {
            text-transform: uppercase;
            font-size: 10px;
            color: #757586;
            letter-spacing: 0.3px;
        }

        .card .value {
            font-size: 15px;
            font-weight: 600;
            color: #1f2933;
        }

        .corps-section {
            border: 1px solid #1f2933;
            border-radius: 10px;
            padding: 20px 24px;
            margin-top: 6px;
            background: #fafafa;
        }

        .corps-section h3 {
            font-size: 14px;
            color: #1f2933;
            margin-bottom: 12px;
            letter-spacing: 0.4px;
            text-transform: uppercase;
        }

        .corps-section p {
            font-size: 14px;
            line-height: 1.8;
            color: #1a1c25;
            text-align: justify;
        }

        .footer {
            margin-top: 32px;
            font-size: 12px;
            color: #646472;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
        }

        .footer .signature {
            font-weight: 600;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }

        @media print {
            body {
                background: #fff;
            }

            .page {
                box-shadow: none;
                border: none;
                margin: 0;
            }
        }
    </style>
</head>

<body>
    <div class="page">
        <div class="header">
            <div class="logo">LOGO EMJC</div>
            <div class="church-info">
                <div class="name">Église Méthodiste Jubilé de Cocody</div>
                <div>Quartier Cocody, Abidjan<br>
                    Côte d’Ivoire<br>
                    Tél. : +225 07 00 00 00 00
                </div>
            </div>
        </div>

        <div class="title-group">
            <h1>FICHE DE DEMANDE LITURGIQUE</h1>
            <div class="meta">Réf : {{ $reference }} · Émis le : {{ $dateEmission }}</div>
        </div>

        <div class="cards-grid">
            <div class="card">
                <h2>Information du demandeur</h2>
                <div class="row">
                    <span class="label">Nom & prénom</span>
                    <span class="value">{{ $nomComplet }}</span>
                </div>
                <div class="row">
                    <span class="label">Téléphone</span>
                    <span class="value">{{ $telephone }}</span>
                </div>
                <div class="row">
                    <span class="label">Classe</span>
                    <span class="value">{{ $classe }}</span>
                </div>
                <div class="row">
                    <span class="label">Famille</span>
                    <span class="value">{{ $famille }}</span>
                </div>
            </div>
            <div class="card">
                <h2>Détaille de la demande</h2>
                <div class="row">
                    <span class="label">Type d'acte</span>
                    <span class="value">{{ strtoupper($typeActe) }}</span>
                </div>
                <div class="row">
                    <span class="label">Nom du défunt</span>
                    <span class="value">{{ $nomConcerne }}</span>
                </div>
                <div class="row">
                    <span class="label">Date du décès</span>
                    <span class="value">{{ $dateDecesFormatted }}</span>
                </div>
                <div class="row">
                    <span class="label">Lieu de sépulture</span>
                    <span class="value">{{ $lieuSepulture }}</span>
                </div>
            </div>
        </div>

        <div class="corps-section">
            <h3>Corps de la demande</h3>
            <p>{{ $corps }}</p>
        </div>

        <div class="footer">
            <div class="signature"> Église Méthodiste Jubilé de Cocody</div>
            <!-- <div class="signature">Acte validé par le pasteur</div> -->
        </div>
    </div>
</body>

</html>