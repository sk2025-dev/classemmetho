<!doctype html>
<html lang="fr">

<head>
    <meta charset="utf-8">
    <title>Certificat {{ $acte->reference }}</title>
    <style>
        @page {
            margin: 24px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #1f2937;
            font-size: 12px;
        }

        /* structuration identique au composant React fourni */
        .certificate {
            background-color: #ffffff;
            width: 100%;
            max-width: 850px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            text-align: center;
            padding: 5px;
        }

        .border-frame {
            border: 15px solid #0f2c5c;
            padding: 5px;
        }

        .border-inner {
            border: 3px solid #c5a059;
            padding: 40px 50px;
        }

        .header {
            display: table;
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
        }

        .header .cell {
            display: table-cell;
            vertical-align: top;
        }

        .logo-container {
            width: 80px;
            text-align: left;
        }

        .logo-img {
            width: 80px;
            height: auto;
            object-fit: contain;
        }

        .title-container {
            flex: 1;
        }

        .title-container h1 {
            font-family: 'Cinzel', serif;
            font-size: 2.5rem;
            color: #0f2c5c;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            line-height: 1.1;
        }

        .qr-container {
            width: 80px;
            text-align: right;
        }

        .qr-img {
            width: 100px;
            height: 100px;
            border: 1px solid #ddd;
            padding: 2px;
            background: white;
        }

        .subtitle {
            font-family: 'Lato', sans-serif;
            font-size: 0.9rem;
            color: #c5a059;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 20px;
            font-weight: 700;
        }

        .recipient-name {
            font-family: 'Great Vibes', cursive;
            font-size: 3.5rem;
            color: #0f2c5c;
            margin: 10px 0 30px 0;
            line-height: 1;
        }

        .body-text {
            font-size: 1.1rem;
            color: #555;
            line-height: 1.8;
            margin-bottom: 50px;
            min-height: 60px;
        }

        .footer {
            display: table;
            width: 100%;
            margin-top: 20px;
            /* reduced spacing to bring date closer */
        }

        .signature-block {
            text-align: right;
            margin-top: 20px;
            margin-bottom: 20px;
        }

        .signature-block .stamp-real-img {
            max-width: 150px;
            max-height: 80px;
            opacity: 0.9;
            position: static;
            transform: none;
        }

        /* landscape orientation adjustables */
        @page {
            size: A4 landscape;
        }

        .footer .cell {
            display: table-cell;
            vertical-align: bottom;
        }

        .footer-left {
            width: 30%;
            text-align: left;
            padding-bottom: 10px;
        }

        .footer-center {
            width: 30%;
            text-align: center;
        }

        .footer-right {
            width: 30%;
            text-align: right;
            height: 120px;
            position: relative;
            display: flex;
            justify-content: flex-end;
            align-items: center;
        }

        .stamp-real-img {
            width: 110px;
            height: auto;
            opacity: 0.85;
            transform: rotate(-15deg);
            position: absolute;
            bottom: 0;
            right: 0;
            z-index: 10;
        }

        .date-display {
            font-weight: bold;
            color: #333;
            font-size: 1rem;
            line-height: 1.5;
            margin-top: -10px;
            /* remonter la date */
        }
    </style>
</head>

<body>
    @php
    $typeLabels = [
    'bapteme' => 'BAPTÊME',
    'mariage' => 'MARIAGE',
    'funerailles' => 'FUNÉRAILLES',
    'remerciement' => 'REMERCIEMENT',
    // garder seuil générique en cas d'autres types
    ];
    $typeLabel = $typeLabels[$acte->type_acte ?? ''] ?? 'ACTE LITURGIQUE';

    $typeTexts = [
    'bapteme' => 'Pour avoir reçu le sacrement saint du baptême au sein de notre communauté paroissiale, marquant son entrée dans la famille de Dieu.',
    'mariage' => 'Pour avoir uni leurs liens par le sacrement du mariage, témoignant de leur amour et de leur engagement devant Dieu et l’Assemblée.',
    'funerailles' => 'Pour avoir accompagné avec dignité et prière le défunt vers la maison du Père, en présence de ses proches et de la communauté.',
    'remerciement' => 'Pour exprimer notre profonde gratitude envers le généreux soutien et les prières offerts pour la vie de notre paroisse.',
    ];
    $bodyText = $typeTexts[$acte->type_acte ?? ''] ?? '';

    $fullName = trim(($acte->membre->prenom ?? '') . ' ' . ($acte->membre->nom ?? '')) ?: 'Nom et Prénom';
    $dateActe = optional($acte->date_souhaitee)->format('d/m/Y') ?? '-';
    $reference = $acte->reference ?? ('ACTE-' . $acte->id);
    @endphp

    <div class="certificate">
        <div class="border-frame">
            <div class="border-inner">
                <div class="header">
                    <div class="cell logo-container">
                        {{-- utiliser dataUri si fourni, sinon importer le fichier public/images/logo.png --}}
                        @if(!empty($logoDataUri))
                        <img src="{{ $logoDataUri }}" class="logo-img" alt="Logo">
                        @elseif(file_exists(public_path('images/logo.png')))
                        <img src="{{ asset('images/logo.png') }}" class="logo-img" alt="Logo">
                        @else
                        <div class="note">Logo</div>
                        @endif
                    </div>
                    <div class="cell title-container">
                        <h1>CERTIFICAT DE<br>{{ $typeLabel }}</h1>
                    </div>
                    <div class="cell qr-container">
                        {{-- toujours afficher le QR qui pointe vers le certificat (data-uri) --}}
                        @if(!empty($qrDataUri))
                        <img src="{{ $qrDataUri }}" class="qr-img" alt="QR Code vers certificat">
                        @else
                        <div class="note">Réf : {{ $reference }}</div>
                        @endif
                    </div>
                </div>

                <div class="subtitle">Ce certificat est fièrement décerné à</div>
                <div class="recipient-name">{{ $fullName }}</div>
                <div class="body-text">{{ $bodyText }}</div>

                @if(!empty($signaturePath))
                <div class="signature-block">
                    <img src="{{ $signaturePath }}" class="stamp-real-img" alt="Signature du pasteur">
                    @if(!empty($signatureName))
                    <div class="signature-role">{{ $signatureName }}</div>
                    @endif
                    <div class="signature-role">{{ $signatureRole }}</div>
                </div>
                @endif

                <div class="footer">
                    <div class="footer-left"></div>
                    <div class="footer-center"></div>
                    <div class="footer-right">
                        <div class="date-display">Fait le : {{ now()->format('d/m/Y H:i') }} à Abidjan</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>

</html>