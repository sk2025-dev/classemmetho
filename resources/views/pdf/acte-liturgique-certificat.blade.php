<!doctype html>
<html lang="fr">

<head>
    <meta charset="utf-8">
    <title>Certificat {{ $acte->reference }}</title>
    <style>
        @page {
            margin: 0;
            size: A4 landscape;
        }

        * {
            box-sizing: border-box;
        }

        html {
            width: 297mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #1a1e2e;
            font-size: 12px;
            margin: 0;
            padding: 0;
            background: #FFFFFF;
            width: 297mm;
            height: 210mm;
            overflow: hidden;
        }

        /* Certificat professionnel prestige */
        .certificate {
            background: #FFFFFF;
            width: 100%;
            height: 100%;
            position: relative;
            text-align: center;
            padding: 0;
            margin: 0;
            overflow: hidden;
            page-break-inside: avoid;
            page-break-before: avoid;
            page-break-after: avoid;
        }

        .page {
            width: 297mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
            page-break-inside: avoid;
        }

        .border-frame {
            border: 8px solid #0F2C59;
            padding: 6px;
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            page-break-inside: avoid;
            background: #FFFFFF;
        }

        .border-inner {
            border: 3px solid #C9A961;
            padding: 16px 30px;
            position: relative;
            background: #FFFFFF;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            overflow: hidden;
            page-break-inside: avoid;
        }

        .content-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            page-break-inside: avoid;
        }

        /* Décorations d'angle simplifiées */
        .corner-ornament {
            position: absolute;
            width: 40px;
            height: 40px;
            border: 0;
        }

        .corner-ornament::before,
        .corner-ornament::after {
            content: '';
            position: absolute;
            background: #C9A961;
        }

        .corner-ornament.top-left::before {
            top: 0;
            left: 0;
            width: 30px;
            height: 3px;
        }

        .corner-ornament.top-left::after {
            top: 0;
            left: 0;
            width: 3px;
            height: 30px;
        }

        .corner-ornament.top-right::before {
            top: 0;
            right: 0;
            width: 30px;
            height: 3px;
        }

        .corner-ornament.top-right::after {
            top: 0;
            right: 0;
            width: 3px;
            height: 30px;
        }

        .corner-ornament.bottom-left::before {
            bottom: 0;
            left: 0;
            width: 30px;
            height: 3px;
        }

        .corner-ornament.bottom-left::after {
            bottom: 0;
            left: 0;
            width: 3px;
            height: 30px;
        }

        .corner-ornament.bottom-right::before {
            bottom: 0;
            right: 0;
            width: 30px;
            height: 3px;
        }

        .corner-ornament.bottom-right::after {
            bottom: 0;
            right: 0;
            width: 3px;
            height: 30px;
        }

        .header {
            display: table;
            width: 100%;
            margin-bottom: 6px;
            position: relative;
        }

        .header .cell {
            display: table-cell;
            vertical-align: middle;
        }

        .logo-container {
            width: 65px;
            text-align: left;
        }

        .logo-img {
            width: 60px;
            height: auto;
            object-fit: contain;
        }

        .title-container {
            flex: 1;
            text-align: center;
            padding: 0 15px;
        }

        .title-container h1 {
            font-family: 'Georgia', serif;
            font-size: 1.5rem;
            color: #0F2C59;
            margin: 0 0 3px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
            line-height: 1.1;
            font-weight: 800;
            word-break: break-word;
        }

        .church-name {
            font-family: 'Georgia', serif;
            font-size: 0.75rem;
            color: #5A6C7D;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-top: 1px;
            font-style: italic;
        }

        .qr-container {
            width: 65px;
            text-align: right;
        }

        .qr-img {
            width: 60px;
            height: 60px;
            border: 2px solid #C9A961;
            border-radius: 4px;
            padding: 3px;
            background: white;
        }

        .divider {
            width: 100%;
            height: 1px;
            background: linear-gradient(to right, transparent 0%, #C9A961 20%, #C9A961 80%, transparent 100%);
            margin: 4px 0;
            position: relative;
        }

        .subtitle {
            font-family: 'Georgia', serif;
            font-size: 0.95rem;
            color: #5A6C7D;
            text-transform: none;
            letter-spacing: 0.5px;
            margin: 8px 0 6px 0;
            font-weight: 600;
            font-style: italic;
        }

        .recipient {
            font-family: 'Georgia', serif;
            font-size: 34px;
            font-weight: 900;
            text-align: center;
            margin: 8px 0;
            color: #0F2C59;
            line-height: 1.1;
            text-transform: uppercase;
            word-break: break-word;
            max-width: 85%;
            letter-spacing: 2px;
            position: relative;
            padding-bottom: 8px;
        }

        .recipient::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 50%;
            height: 2px;
            background: linear-gradient(to right, transparent 0%, #C9A961 30%, #C9A961 70%, transparent 100%);
        }

        .attestation-text {
            font-size: 0.85rem;
            color: #374151;
            line-height: 1.4;
            margin: 8px auto 6px auto;
            font-weight: 500;
            padding: 0 20px;
            word-break: break-word;
            text-align: center;
            max-width: 90%;
            font-style: normal;
        }

        .signature-section {
            display: table;
            width: 100%;
            margin-top: auto;
            padding-top: 10px;
            border-top: 1px solid #E5E7EB;
        }

        .signature-section .cell {
            display: table-cell;
            vertical-align: bottom;
        }

        .signature-left {
            width: 30%;
            text-align: left;
            padding: 0 10px;
        }

        .signature-center {
            width: 40%;
            text-align: center;
        }

        .signature-right {
            width: 30%;
            text-align: right;
            padding: 0 10px;
        }

        .signature-line {
            width: 150px;
            margin: 0 auto 4px auto;
            border-bottom: 2px solid #0F2C59;
            height: 25px;
        }

        .signature-label {
            font-size: 0.75rem;
            color: #6B7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }

        .signature-name {
            font-size: 1rem;
            color: #0F2C59;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
        }

        .footer-info {
            font-size: 0.85rem;
            color: #4B5563;
            font-weight: 600;
            line-height: 1.4;
        }

        .ref-number {
            font-size: 0.8rem;
            color: #6B7280;
            font-weight: 700;
            background: #F3F4F6;
            padding: 4px 10px;
            border-radius: 4px;
            display: inline-block;
            border: 1px solid #E5E7EB;
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

    // Phrases d'attestation personnalisées selon le type d'acte
    $attestationPhrases = [
    'bapteme' => 's\'est reçu le sacrement saint du baptême',
    'mariage' => 'ont uni leurs liens par le sacrement du mariage',
    'funerailles' => 'a été conduit vers la maison du Père',
    'remerciement' => 'a généreusement soutenu notre communauté',
    ];
    $attestationPhrase = $attestationPhrases[$acte->type_acte ?? ''] ?? 'a reçu cet acte liturgique';

    $fullName = trim(($acte->membre->prenom ?? '') . ' ' . ($acte->membre->nom ?? '')) ?: 'Nom et Prénom';
    $dateActe = optional($acte->date_souhaitee)->format('d/m/Y') ?? '-';
    $reference = $acte->reference ?? ('ACTE-' . $acte->id);

    // Alias de compatibilite si le template evolue avec les noms utilises ailleurs
    $nomComplet = $fullName;
    $typeActe = $typeLabel;
    $dateEmission = $dateActe !== '-' ? $dateActe : now()->format('d/m/Y');
    @endphp

    <div class="page">
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
                            <h1>CERTIFICAT D'ACTE LITURGIQUE</h1>
                            <div class="church-name">Église Méthodiste Jubilé de Cocody</div>
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

                    <div class="divider"></div>

                    <div class="content-main">
                        <div class="subtitle">Ce certificat est décerné à</div>
                        <div class="recipient">{{ strtoupper($nomComplet) }}</div>

                        <div class="attestation-text">
                            L'Église Méthodiste Jubilé de Cocody atteste solennellement que la personne mentionnée ci-dessus
                            a reçu cet acte liturgique au sein de notre communauté paroissiale le {{ $dateEmission }}.
                            Ce certificat est délivré pour servir et valoir ce que de droit.
                        </div>
                    </div>

                    <div class="signature-section">
                        <div class="cell signature-left">
                            <div class="ref-number">Réf : {{ $reference }}</div>
                        </div>
                        <div class="cell signature-center">
                            <div class="signature-label">Le Pasteur</div>
                            <div class="signature-line"></div>
                            <div class="signature-name">N'GORAN MISS</div>
                        </div>
                        <div class="cell signature-right">
                            <div class="footer-info">Fait à Cocody</div>
                            <div class="footer-info">Le {{ $dateEmission }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>

</html>