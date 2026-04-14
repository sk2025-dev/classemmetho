<?php

require __DIR__ . '/vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

$activityTitle = 'Etude biblique du mercredi';
$scanUrl = 'http://localhost:8000/presence/demo-token';
$dateLabel = date('d/m/Y');
$timeLabel = '18:30';

$writer = new PngWriter();
$result = $writer->write(
    new QrCode(
        data: $scanUrl,
        size: 420,
        margin: 10
    )
);

$qrDataUri = $result->getDataUri();

$html = '
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: DejaVu Sans, Arial, sans-serif; color: #111827; margin: 24px; }
    .sheet { border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; }
    h1 { margin: 0 0 6px 0; font-size: 24px; }
    .subtitle { margin: 0 0 16px 0; color: #6b7280; font-size: 14px; }
    .instruction { background: #fffbeb; color: #78350f; border: 1px solid #fbbf24; border-radius: 8px; padding: 10px 12px; font-size: 14px; line-height: 1.45; margin-bottom: 14px; }
    .grid { width: 100%; }
    .left { width: 58%; vertical-align: top; }
    .right { width: 42%; text-align: center; vertical-align: top; }
    .meta { margin-top: 10px; font-size: 14px; color: #374151; line-height: 1.6; }
    .url { margin-top: 10px; color: #6b7280; font-size: 11px; word-break: break-all; }
    img.qr { width: 230px; height: 230px; }
  </style>
</head>
<body>
  <div class="sheet">
    <h1>' . htmlspecialchars($activityTitle, ENT_QUOTES, 'UTF-8') . '</h1>
    <p class="subtitle">Fiche de scan de presence</p>

    <div class="instruction">
      Scannez puis entrez votre code membre pour marquer votre presence.
    </div>

    <table class="grid" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="left">
          <div class="meta"><strong>Date:</strong> ' . htmlspecialchars($dateLabel, ENT_QUOTES, 'UTF-8') . '</div>
          <div class="meta"><strong>Heure:</strong> ' . htmlspecialchars($timeLabel, ENT_QUOTES, 'UTF-8') . '</div>
        </td>
        <td class="right">
          <img class="qr" src="' . $qrDataUri . '" alt="QR code" />
          <div class="url">' . htmlspecialchars($scanUrl, ENT_QUOTES, 'UTF-8') . '</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>';

$options = new Options();
$options->set('isRemoteEnabled', true);
$dompdf = new Dompdf($options);
$dompdf->loadHtml($html, 'UTF-8');
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

$outputPath = __DIR__ . '/public/qr_scan_preview.pdf';
file_put_contents($outputPath, $dompdf->output());

echo $outputPath . PHP_EOL;
