<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Fiche scan activite</title>
    <style>
        @page {
            margin: 16mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #1f2937;
            font-size: 12px;
            line-height: 1.4;
            background: #ffffff;
        }

        .sheet {
            padding: 4px 0;
            background: #ffffff;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .header-left,
        .header-right {
            width: 70px;
            text-align: center;
            vertical-align: middle;
        }

        .header-center {
            text-align: center;
            vertical-align: middle;
            padding: 0 10px;
        }

        .logo-main,
        .logo-secondary {
            width: 58px;
            height: 58px;
            object-fit: contain;
        }

        .church-name {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: #1e3a8a;
        }

        .church-subtitle {
            margin: 4px 0 0;
            color: #64748b;
            font-size: 11px;
        }

        .separator {
            border-top: 1px solid #e5e7eb;
            margin-bottom: 16px;
        }

        .activity-title {
            margin: 0 0 14px;
            font-size: 25px;
            font-weight: 710;
            color: #0f172a;
            text-align: center;
        }

        .activity-label {
            font-weight: 800;
        }

        .info-box {
            padding: 6px 0;
            margin-bottom: 18px;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 3px 0;
            vertical-align: top;
        }

        .info-label {
            width: 92px;
            font-weight: 700;
            color: #334155;
        }

        .info-value {
            color: #0f172a;
        }

        .qr-zone {
            text-align: center;
            margin: 10px 0 14px;
        }

        .qr-card {
            display: inline-block;
            padding: 14px;
            background: #ffffff;
        }

        .qr {
            width: 300px;
            height: 300px;
            display: block;
            margin: 0 auto;
        }

        .instruction-box {
            color: #334155;
            padding: 6px 0;
            margin-top: 12px;
        }

        .instruction-line {
            margin: 0 0 4px;
            font-size: 12px;
            font-weight: 600;
        }

        .instruction-line:last-child {
            margin-bottom: 0;
            font-weight: 500;
            color: #334155;
        }

        .footer {
            margin-top: 16px;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
            text-align: center;
            color: #475569;
            font-size: 11px;
        }
    </style>
</head>

<body>
    @php
    $eventDate = $event?->date ? \Illuminate\Support\Carbon::parse($event->date)->locale('fr')->isoFormat('dddd D MMMM YYYY') : '-';
    $eventTime = !empty($event?->time) ? substr((string) $event->time, 0, 5) : '--:--';
    $eventLieu = trim((string) ($event->lieu ?? ''));

    $toDataUri = function (string $absolutePath): ?string {
    if (!file_exists($absolutePath)) {
    return null;
    }

    $extension = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));
    $mime = $extension === 'png' ? 'image/png' : ($extension === 'jpg' || $extension === 'jpeg' ? 'image/jpeg' : 'application/octet-stream');
    $content = @file_get_contents($absolutePath);

    if ($content === false) {
    return null;
    }

    return 'data:' . $mime . ';base64,' . base64_encode($content);
    };

    $logoMain = $toDataUri(public_path('images/metho.jpg'));
    $logoSecondary = $toDataUri(public_path('images/logo.png'));
    @endphp

    <div class="sheet">
        <table class="header-table" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td class="header-left">
                    @if($logoMain)
                    <img class="logo-main" src="{{ $logoMain }}" alt="Logo eglise">
                    @endif
                </td>
                <td class="header-center">
                    <h1 class="church-name">Eglise Methodiste Jubile de Cocody</h1>
                    <p class="church-subtitle">Foi - Communion - Service</p>
                </td>
                <td class="header-right">
                    @if($logoSecondary)
                    <img class="logo-secondary" src="{{ $logoSecondary }}" alt="Logo secondaire">
                    @endif
                </td>
            </tr>
        </table>

        <div class="separator"></div>

        <h2 class="activity-title"><span class="activity-label">Activite :</span> {{ $event->title ?? 'Nom non renseigne' }}</h2>

        <div class="info-box">
            <table class="info-table" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td class="info-label">Date</td>
                    <td class="info-value">{{ ucfirst($eventDate) }}</td>
                </tr>
                <tr>
                    <td class="info-label">Heure</td>
                    <td class="info-value">{{ $eventTime }}</td>
                </tr>
                @if($eventLieu !== '')
                <tr>
                    <td class="info-label">Lieu</td>
                    <td class="info-value">{{ $eventLieu }}</td>
                </tr>
                @endif
            </table>
        </div>

        <div class="qr-zone">
            <div class="qr-card">
                @if(!empty($qrDataUri))
                <img class="qr" src="{{ $qrDataUri }}" alt="QR code scan">
                @endif
            </div>
        </div>

        <div class="instruction-box">
            <p class="instruction-line">Scannez ce code pour marquer votre presence</p>
            <p class="instruction-line">Ouvrez votre appareil photo et pointez vers le QR code</p>
        </div>

        <div class="footer">
            Merci pour votre participation. Votre presence sera enregistree automatiquement.
        </div>
    </div>
</body>

</html>