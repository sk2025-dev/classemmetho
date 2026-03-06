<!doctype html>
<html lang="fr">

<head>
    <meta charset="utf-8">
    <title>Certificat {{ $acte->reference }}</title>
    <style>
        @page {
            margin: 24px;
            size: A4 landscape;
        }

        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #1a1e2e;
            font-size: 12px;
            background: #f8f9fa;
        }

        /* Certificat professionnel moderne */
        .certificate {
            background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
            width: 100%;
            max-width: 850px;
            position: relative;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
            text-align: center;
            padding: 0;
            margin: 0 auto;
        }

        .border-frame {
            border: 8px solid #1A365D;
            padding: 8px;
            position: relative;
        }

        .border-inner {
            border: 3px solid #D4AF37;
            padding: 35px 45px;
            position: relative;
            background: #fff;
        }

        /* Décorations d'angle */
        .corner-ornament {
            position: absolute;
            width: 60px;
            height: 60px;
        }
        .corner-ornament.top-left {
            top: -3px;
            left: -3px;
            border-top: 3px solid #D4AF37;
            border-left: 3px solid #D4AF37;
        }
        .corner-ornament.top-right {
            top: -3px;
            right: -3px;
            border-top: 3px solid #D4AF37;
            border-right: 3px solid #D4AF37;
        }
        .corner-ornament.bottom-left {
            bottom: -3px;
            left: -3px;
            border-bottom: 3px solid #D4AF37;
            border-left: 3px solid #D4AF37;
        }
        .corner-ornament.bottom-right {
            bottom: -3px;
            right: -3px;
            border-bottom: 3px solid #D4AF37;
            border-right: 3px solid #D4AF37;
        }

        .header {
            display: table;
            width: 100%;
            margin-bottom: 25px;
            border-bottom: 2px solid #D4AF37;
            padding-bottom: 18px;
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
            font-family: 'Georgia', serif;
            font-size: 2.2rem;
            color: #1A365D;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 4px;
            line-height: 1.2;
            font-weight: 700;
        }

        .qr-container {
            width: 80px;
            text-align: right;
        }

        .qr-img {
            width: 90px;
            height: 90px;
            border: 2px solid #1A365D;
            border-radius: 4px;
            padding: 4px;
            background: white;
        }

        .subtitle {
            font-family: 'Georgia', serif;
            font-size: 0.85rem;
            color: #2C5282;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 18px;
            font-weight: 600;
        }

        .recipient-name {
            font-family: 'Georgia', serif;
            font-size: 3rem;
            color: #1A365D;
            margin: 15px 0 25px 0;
            line-height: 1.2;
            font-weight: 700;
            font-style: italic;
        }

        .body-text {
            font-size: 1.05rem;
            color: #444;
            line-height: 1.9;
            margin-bottom: 35px;
            min-height: 55px;
            font-style: italic;
            padding: 0 25px;
        }

        .footer {
            display: table;
            width: 100%;
            margin-top: 20px;
            /* reduced spacing to bring date closer */
        }

        .signature-block {
            text-align: right;
            margin-top: 25px;
            margin-bottom: 15px;
            padding-right: 20px;
        }

        .signature-block .stamp-real-img {
            max-width: 130px;
            max-height: 70px;
            opacity: 0.85;
            position: static;
            transform: none;
        }
        
        .signature-role {
            font-size: 0.9rem;
            color: #1A365D;
            font-weight: 600;
            margin-top: 5px;
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
            width: 33%;
            text-align: left;
            padding-bottom: 10px;
        }

        .footer-center {
            width: 33%;
            text-align: center;
            border-top: 2px solid #D4AF37;
            padding-top: 10px;
        }
        
        .footer-center:before {
            content: "ÉGLISE MÉTHODISTE JUBILÉ DE COCODY";
            font-size: 0.75rem;
            color: #2C5282;
            font-weight: 600;
            letter-spacing: 1px;
        }

        .footer-right {
            width: 33%;
            text-align: right;
            padding-bottom: 10px;
        }

        .date-display {
            font-weight: 600;
            color: #1A365D;
            font-size: 0.9rem;
            line-height: 1.6;
        }
        
        .reference-display {
            font-size: 0.75rem;
            color: #666;
            margin-top: 5px;
            font-style: italic;
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
            <span class="corner-ornament top-left"></span>
            <span class="corner-ornament top-right"></span>
            <span class="corner-ornament bottom-left"></span>
            <span class="corner-ornament bottom-right"></span>
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
                        <div>
                            <div class="date-display">Fait le {{ now()->format('d/m/Y') }}</div>
                            <div class="reference-display">Réf : {{ $reference }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>

</html>