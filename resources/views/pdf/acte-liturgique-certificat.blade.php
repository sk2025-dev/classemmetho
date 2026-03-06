<!doctype html>
<html lang='fr'>

<head>
    <meta charset='utf-8'>
    <title>Certificat {{ $acte->reference }}</title>
    <style>
        @page {
            margin: 0;
            size: A4 landscape;
        }

        * {
            box-sizing: border-box;
        }

        html,
        body {
            margin: 0;
            padding: 0;
            width: 297mm;
            height: 210mm;
            background: #0b1028;
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #0f2c59;
        }

        body {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .page {
            width: 297mm;
            height: 210mm;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .certificate {
            width: 282mm;
            height: 194mm;
            border: 6px solid #0f2c59;
            padding: 8px;
            background: #ffffff;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
        }

        .inner {
            width: 100%;
            height: 100%;
            border: 3px solid #c9a961;
            padding: 18px 30px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            background: linear-gradient(180deg, #ffffff 0%, #fdfdf5 100%);
        }

        .inner::before,
        .inner::after {
            content: '';
            position: absolute;
            width: 60px;
            height: 60px;
            border: 2px solid #c9a961;
        }

        .inner::before {
            top: -1px;
            left: -1px;
            border-right: none;
            border-bottom: none;
        }

        .inner::after {
            bottom: -1px;
            right: -1px;
            border-left: none;
            border-top: none;
        }

        .top-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        .logo-container,
        .qr-container {
            width: 70px;
            height: 70px;
        }

        .logo-img,
        .qr-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 8px;
        }

        .top-badge {
            flex: 1;
            text-align: center;
        }

        .top-badge span {
            display: block;
            font-size: 0.8rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #4b566f;
        }

        .top-badge strong {
            font-size: 1rem;
            letter-spacing: 3px;
            color: #0f2c59;
        }

        .title-block {
            text-align: center;
            margin-top: 8px;
        }

        .title-block h1 {
            margin: 0;
            font-size: 2.2rem;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #172a57;
        }

        .title-block .type-label {
            font-size: 1rem;
            letter-spacing: 3px;
            color: #c07e08;
            margin-top: 4px;
        }

        .title-block .location {
            font-size: 0.85rem;
            margin-top: 6px;
            color: #5a647d;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .gold-line {
            width: 180px;
            height: 6px;
            margin: 10px auto;
            background: linear-gradient(90deg, transparent 0%, #c9a961 40%, #c9a961 60%, transparent 100%);
            border-radius: 4px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin: 12px 0 6px;
        }

        .info-card {
            border: 1px solid rgba(15, 44, 89, 0.1);
            padding: 8px 12px;
            border-radius: 6px;
            background: #fbfbfb;
            min-height: 56px;
        }

        .info-label {
            font-size: 0.75rem;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 2px;
        }

        .info-value {
            font-size: 1rem;
            font-weight: 700;
            color: #0f2c59;
            line-height: 1.2;
        }

        .attestation {
            margin-top: 10px;
            padding: 12px 24px;
            border-radius: 10px;
            background: linear-gradient(145deg, #0f2c59, #12296b);
            color: #fdf6e3;
            font-size: 0.95rem;
            line-height: 1.5;
            text-align: center;
            font-weight: 500;
            letter-spacing: 0.5px;
        }

        .signature-section {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 20px;
            margin-top: 24px;
            align-items: flex-end;
        }

        .signature-block {
            text-align: center;
        }

        .signature-label {
            font-size: 0.75rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 4px;
        }

        .signature-line {
            width: 160px;
            height: 2px;
            margin: 0 auto 5px;
            background: #0f2c59;
        }

        .signature-name {
            font-size: 1rem;
            letter-spacing: 1px;
            color: #0f2c59;
            font-weight: 700;
        }

        .footer-note {
            margin-top: 10px;
            font-size: 0.75rem;
            color: #4b5563;
            text-align: center;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .reference-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            border: 1px solid #c9a961;
            color: #0f2c59;
            font-size: 0.75rem;
            font-weight: 700;
            margin-top: 4px;
        }
    </style>
</head>

<body>
    @php
    $details = $acte->details ?? [];
    $createur = $acte->createur ?? $acte->membre ?? null;
    $nomComplet = trim(($createur->prenom ?? '') . ' ' . ($createur->nom ?? '')) ?: 'Nom et prénom';
    $reference = $acte->reference ?? ('ACTE-' . $acte->id);
    $dateActe = optional($acte->date_souhaitee)->format('d/m/Y') ?? '-';
    $dateEmission = $dateActe !== '-' ? $dateActe : now()->format('d/m/Y');
    $classeNom = $acte->classe?->nom ?? $createur->classe?->nom ?? '—';
    $conducteurNom = trim(($acte->conducteur->prenom ?? '') . ' ' . ($acte->conducteur->nom ?? '')) ?: '—';
    $pasteurNom = trim(($acte->pasteur->prenom ?? '') . ' ' . ($acte->pasteur->nom ?? '')) ?: '—';
    $lieuActe = $details['lieu'] ?? $details['lieu_deces'] ?? $details['lieu_sepulture'] ?? '—';

    $typeLabels = [
        'bapteme' => 'BAPTÊME',
        'mariage' => 'MARIAGE',
        'funerailles' => 'FUNÉRAILLES',
        'remerciement' => 'REMERCIEMENT',
    ];
    $typeLabel = $typeLabels[$acte->type_acte ?? ''] ?? 'ACTE LITURGIQUE';

    $attestationPhrases = [
        'bapteme' => 'a reçu le sacrement saint du baptême',
        'mariage' => 'a uni ses liens par le sacrement du mariage',
        'funerailles' => 'a été conduit vers la maison du Père',
        'remerciement' => 'a généreusement soutenu notre communauté',
    ];
    $attestationPhrase = $attestationPhrases[$acte->type_acte ?? ''] ?? 'a participé à cet acte liturgique';
    $attestationDate = $dateActe !== '-' ? $dateActe : $dateEmission;

    $infoCards = [
        'Type d’acte' => $typeLabel,
        'Référence' => $reference,
        'Date souhaitée' => $dateActe !== '-' ? $dateActe : 'À confirmer',
        'Classe / Groupe' => $classeNom,
        'Lieu prévu' => $lieuActe,
        'Responsable' => $conducteurNom,
    ];
    @endphp

    <div class='page'>
        <div class='certificate'>
            <div class='inner'>
                <div class='top-row'>
                    <div class='logo-container'>
                        @if(!empty($logoDataUri))
                        <img src='{{ $logoDataUri }}' class='logo-img' alt='Logo'>
                        @elseif(file_exists(public_path('images/logo.png')))
                        <img src='{{ asset('images/logo.png') }}' class='logo-img' alt='Logo'>
                        @else
                        <div></div>
                        @endif
                    </div>
                    <div class='top-badge'>
                        <span>Certificat officiel</span>
                        <strong>Acte liturgique</strong>
                        <span class='reference-badge'>Réf {{ $reference }}</span>
                    </div>
                    <div class='qr-container'>
                        @if(!empty($qrDataUri))
                        <img src='{{ $qrDataUri }}' class='qr-img' alt='QR Code'>
                        @else
                        <div class='reference-badge'>QR indisponible</div>
                        @endif
                    </div>
                </div>

                <div class='title-block'>
                    <div class='type-label'>{{ $typeLabel }}</div>
                    <h1>Certificat d’acte liturgique</h1>
                    <div class='location'>Église Méthodiste Jubilé de Cocody</div>
                </div>

                <div class='gold-line'></div>

                <div class='info-grid'>
                    @foreach($infoCards as $label => $value)
                    <div class='info-card'>
                        <div class='info-label'>{{ $label }}</div>
                        <div class='info-value'>{{ $value }}</div>
                    </div>
                    @endforeach
                </div>

                <div class='attestation'>
                    La présente attestation confirme que {{ strtoupper($nomComplet) }} {{ $attestationPhrase }} au sein de notre commune paroissiale le {{ $attestationDate }}. Ce document est délivré pour valoir ce que de droit et reste vérifiable via le code QR ci-dessus.
                </div>

                <div class='signature-section'>
                    <div class='signature-block'>
                        <div class='signature-label'>Le Conducteur</div>
                        <div class='signature-line'></div>
                        <div class='signature-name'>{{ $conducteurNom }}</div>
                    </div>
                    <div class='signature-block'>
                        <div class='signature-label'>Le Pasteur</div>
                        <div class='signature-line'></div>
                        <div class='signature-name'>{{ $pasteurNom }}</div>
                    </div>
                    <div class='signature-block'>
                        <div class='signature-label'>Lieu & date</div>
                        <div class='signature-line'></div>
                        <div class='signature-name'>Cocody · {{ $dateEmission }}</div>
                    </div>
                </div>

                <div class='footer-note'>
                    Émis par l’Église Méthodiste Jubilé de Cocody · Certificat digital authentifiable
                </div>
            </div>
        </div>
    </div>
</body>

</html>
