<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Reçu de don {{ $don->reference_recu }}</title>
    <style>
        @page { size: A4 portrait; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            width: 210mm;
            height: 297mm;
            background: #fff;
            font-family: Arial, Helvetica, sans-serif;
            color: #1a1e2e;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .page {
            width: 210mm;
            height: 297mm;
            position: relative;
            overflow: hidden;
        }

        .frame-outer {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border: 5px solid #0F1E40;
        }
        .frame-inner {
            position: absolute;
            top: 7mm; left: 7mm; right: 7mm; bottom: 7mm;
            border: 1.5px solid #B6C01A;
        }

        /* Table maître : 297mm de haut, colonnes latérales décoratives */
        .master {
            width: 210mm;
            height: 297mm;
            border-collapse: collapse;
        }
        .master td { padding: 0; }
        .col-side { width: 12mm; }

        /* ── ZONE EN-TÊTE ── */
        .zone-header { height: 38mm; vertical-align: middle; }
        .church-name {
            font-size: 7px; font-weight: 700; letter-spacing: 3px;
            text-transform: uppercase; color: #6B46C1; margin-bottom: 2mm;
        }
        .doc-title {
            font-size: 18px; font-weight: 900; letter-spacing: 4px;
            text-transform: uppercase; color: #0F1E40;
        }

        /* ── ZONE MONTANT ── */
        .zone-amount { height: 36mm; vertical-align: middle; }
        .amount-box {
            background: #f3f0ff;
            border: 2px solid #6B46C1;
            border-radius: 6px;
            text-align: center;
            padding: 4mm 0;
        }
        .amount-label {
            font-size: 8px; letter-spacing: 2px; color: #6B46C1;
            text-transform: uppercase; font-weight: 700;
        }
        .amount-value {
            font-size: 28px; font-weight: 900; color: #0F1E40; margin-top: 1mm;
        }
        .amount-currency { font-size: 13px; font-weight: 700; color: #6B46C1; }

        /* ── ZONE INFOS ── */
        .zone-info { height: 90mm; vertical-align: top; padding-top: 4mm; }
        .section-title {
            font-size: 7px; font-weight: 700; letter-spacing: 3px;
            text-transform: uppercase; color: #6B46C1; margin-bottom: 2mm;
        }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
        .info-table td {
            padding: 2mm 3mm;
            font-size: 10px;
            border-bottom: 1px solid #f0f0f5;
        }
        .info-label { color: #6b7280; width: 38%; font-weight: 600; }
        .info-value { color: #0F1E40; font-weight: 700; }

        /* ── ZONE FOOTER ── */
        .zone-footer { height: 38mm; vertical-align: bottom; padding-bottom: 6mm; }
        .footer-mention {
            font-size: 7.5px; color: #9098b4; font-style: italic; line-height: 1.6;
        }
        .ref-badge {
            background: #f3f0ff; border: 1px solid #6B46C155;
            border-radius: 4px; padding: 1.5mm 3mm;
            font-size: 7.5px; font-weight: 700; color: #6B46C1;
            letter-spacing: 0.5px; text-transform: uppercase;
            display: inline-block; margin-top: 2mm;
        }
        .stamp-box {
            border: 2px dashed #B6C01A; border-radius: 6px;
            width: 34mm; height: 20mm; text-align: center; padding-top: 6mm;
            float: right;
        }
        .stamp-text { font-size: 7px; color: #B6C01A; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

        /* ── SEPARATEUR ── */
        .zone-sep { height: 7mm; vertical-align: middle; }
        .sep-line { border-bottom: 1px solid #d0d4e8; font-size: 0; height: 1px; }

        /* ── Bande tricolore ── */
        .triband { width: 55%; border-collapse: collapse; margin: 2mm auto 0; }
        .triband td { height: 3px; font-size: 0; }
    </style>
</head>
<body>
<div class="page">
    <div class="frame-outer"></div>
    <div class="frame-inner"></div>

    <table class="master" cellpadding="0" cellspacing="0">

        {{-- ══ EN-TÊTE : logo | titre | QR ══ --}}
        <tr>
            <td class="col-side zone-header"></td>

            <td class="col-center zone-header" style="text-align:center;">
                <div class="church-name">Église Méthodiste Jubilé de Cocody</div>
                <div class="doc-title">REÇU DE DON</div>
                <table class="triband" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="33%" style="background:#6B46C1;"></td>
                        <td width="34%" style="background:#1E40AF;"></td>
                        <td width="33%" style="background:#B6C01A;"></td>
                    </tr>
                </table>
            </td>

            <td class="col-side zone-header" style="text-align:center;">
                @if(!empty($qrDataUri))
                    <img src="{{ $qrDataUri }}" width="50" height="50"
                         style="border:2px solid #B6C01A; border-radius:5px; padding:2px; background:#fff;">
                    <div style="font-size:6px;color:#9098b4;margin-top:1mm;text-align:center;">Vérification</div>
                @endif
            </td>
        </tr>

        {{-- ══ SÉPARATEUR ══ --}}
        <tr>
            <td class="col-side"></td>
            <td class="col-center zone-sep">
                <div class="sep-line"></div>
            </td>
            <td class="col-side"></td>
        </tr>

        {{-- ══ MONTANT ══ --}}
        <tr>
            <td class="col-side"></td>
            <td class="col-center zone-amount">
                <div class="amount-box">
                    <div class="amount-label">Montant du don</div>
                    <div class="amount-value">
                        {!! number_format($don->montant, 0, ',', '&nbsp;') !!}
                        <span class="amount-currency">F CFA</span>
                    </div>
                </div>
            </td>
            <td class="col-side"></td>
        </tr>

        {{-- ══ INFOS DONATEUR + TRANSACTION ══ --}}
        <tr>
            <td class="col-side"></td>
            <td class="col-center zone-info">

                <div class="section-title">Informations du donateur</div>
                <table class="info-table" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="info-label">Nom</td>
                        <td class="info-value">{{ $don->nom_donateur ?: 'Anonyme' }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Numéro</td>
                        <td class="info-value">{{ $don->numero_donateur ?: '-' }}</td>
                    </tr>
                </table>

                <div class="section-title">Détails de la transaction</div>
                <table class="info-table" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="info-label">Date</td>
                        <td class="info-value">{{ $don->date_don->format('d/m/Y') }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Mode de paiement</td>
                        <td class="info-value">{{ $modeLabel }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Référence</td>
                        <td class="info-value" style="font-family:monospace;font-size:9px;">{{ $don->reference_recu }}</td>
                    </tr>
                    @if($don->note)
                    <tr>
                        <td class="info-label">Note</td>
                        <td class="info-value">{{ $don->note }}</td>
                    </tr>
                    @endif
                </table>

            </td>
            <td class="col-side"></td>
        </tr>

        {{-- ══ SÉPARATEUR ══ --}}
        <tr>
            <td class="col-side"></td>
            <td class="col-center zone-sep">
                <div class="sep-line"></div>
            </td>
            <td class="col-side"></td>
        </tr>

        {{-- ══ FOOTER ══ --}}
        <tr>
            <td class="col-side"></td>
            <td class="col-center zone-footer">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr valign="bottom">
                        <td style="text-align:left; vertical-align:bottom;">
                            <div class="footer-mention">
                                Ce document atteste d'un don effectué en faveur de<br>
                                l'Église Méthodiste Jubilé de Cocody — Abidjan, Cocody.<br>
                                <strong>Document non fiscal.</strong> Conservez-le pour vos archives.
                            </div>
                            <div class="ref-badge">Réf : {{ $don->reference_recu }}</div>
                        </td>
                        <td style="text-align:right; vertical-align:bottom; width:38mm;">
                            <div class="stamp-box">
                                <div class="stamp-text">Cachet<br>de l'église</div>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            <td class="col-side"></td>
        </tr>

    </table>
</div>
</body>
</html>
