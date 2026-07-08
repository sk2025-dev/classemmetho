<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Don;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Paydunya\Checkout\CheckoutInvoice;
use Paydunya\Checkout\Store;
use Paydunya\Setup;

class DonationController extends Controller
{
    public function storeAnonymous(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom_donateur' => ['required', 'string', 'max:120'],
            'numero_donateur' => ['required', 'regex:/^\d{10}$/'],
            'montant' => ['required', 'integer', 'min:100'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY,ESPECES,CARTE,WAVE,ORANGE,MOOV_CI'],
            'motif' => ['nullable', 'string', 'max:1000'],
        ]);

        $reference = 'DON-ANON-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 6));

        try {
            $this->bootstrapPayDunya();

            $callbackUrl = route('public.dons.anonyme.verify', ['ref' => $reference]);

            $invoice = new CheckoutInvoice();
            $invoice->setCancelUrl($callbackUrl . '&status=cancelled');
            $invoice->setReturnUrl($callbackUrl);
            $invoice->setCallbackUrl(route('paydunya.webhook'));
            $invoice->setTotalAmount((int) $validated['montant']);
            $invoice->setDescription('Don en ligne - ' . trim((string) $validated['nom_donateur']) . ' (' . trim((string) $validated['numero_donateur']) . ')');
            $invoice->addItem(
                'Don libre',
                1,
                (int) $validated['montant'],
                (int) $validated['montant'],
                'Don depuis la page d\'accueil'
            );
            $invoice->addCustomData('reference_recu', $reference);

            // Canal carte bancaire
            if ($validated['mode_paiement'] === 'CARTE') {
                $invoice->addChannel('card');
            }

            if (!$invoice->create()) {
                return response()->json([
                    'message' => 'Erreur PayDunya: ' . ($invoice->response_text ?: $invoice->response_code),
                ], 400);
            }

            $request->session()->put('anonymous_donations.' . $reference, [
                'montant' => (int) $validated['montant'],
                'mode_paiement' => $validated['mode_paiement'],
                'nom_donateur' => trim((string) $validated['nom_donateur']),
                'numero_donateur' => trim((string) $validated['numero_donateur']),
                'motif' => $validated['motif'] ?? null,
            ]);

            return response()->json([
                'message' => 'Paiement initialise. Redirection vers PayDunya.',
                'redirect_url' => $invoice->getInvoiceUrl(),
                'reference_recu' => $reference,
            ]);
        } catch (\Throwable $e) {
            Log::error('Anonymous donation init failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de l\'initialisation du paiement en ligne.',
            ], 500);
        }
    }

    public function verifyAnonymous(Request $request)
    {
        $reference = trim((string) $request->query('ref', ''));
        $token = trim((string) $request->query('token', ''));

        if ($reference === '') {
            return redirect('/?don=error');
        }

        if (strtolower((string) $request->query('status', '')) === 'cancelled') {
            $request->session()->forget('anonymous_donations.' . $reference);
            return redirect('/?don=cancelled');
        }

        $pending = $request->session()->pull('anonymous_donations.' . $reference);
        if (!$pending || !$token) {
            return redirect('/?don=error');
        }

        try {
            $this->bootstrapPayDunya();

            $invoice = new CheckoutInvoice();
            $confirmed = $invoice->confirm($token);
            $gatewayStatus = strtolower((string) $invoice->getStatus());

            $isPaid = in_array($gatewayStatus, ['completed', 'paid', 'success', 'done'], true)
                || ($confirmed && !in_array($gatewayStatus, ['cancelled', 'failed', 'rejected', 'expired'], true));

            if (!$isPaid) {
                return redirect('/?don=failed');
            }

            Don::create([
                'family_id'       => null,
                'user_id'         => null,
                'campagne_id'     => null,
                'montant'         => (int) ($pending['montant'] ?? 0),
                'type'            => Don::TYPE_LIBRE,
                'mode_paiement'   => $pending['mode_paiement'] ?? 'MOBILE_MONEY',
                'date_don'        => now()->toDateString(),
                'reference_recu'  => $reference,
                'nom_donateur'    => $pending['nom_donateur'] ?? null,
                'numero_donateur' => $pending['numero_donateur'] ?? null,
                'note'             => $pending['motif'] ?? null,
            ]);

            $receiptUrl = $invoice->getReceiptUrl() ?? '';
            $query = http_build_query([
                'don'     => 'success',
                'ref'     => $reference,
                'montant' => (int) ($pending['montant'] ?? 0),
                'receipt' => $receiptUrl,
            ]);

            return redirect('/?' . $query);
        } catch (\Throwable $e) {
            Log::error('Anonymous donation verify failed', [
                'error' => $e->getMessage(),
                'reference' => $reference,
            ]);

            return redirect('/?don=error');
        }
    }

    public function downloadReceipt(string $reference)
    {
        $don = Don::where('reference_recu', $reference)->firstOrFail();

        $receiptUrl = route('public.dons.recu', ['reference' => $reference]);
        $qrDataUri = null;

        try {
            $result = Builder::create()
                ->writer(new PngWriter())
                ->data($receiptUrl)
                ->encoding(new Encoding('UTF-8'))
                ->errorCorrectionLevel(ErrorCorrectionLevel::Medium)
                ->size(160)
                ->margin(4)
                ->roundBlockSizeMode(RoundBlockSizeMode::Margin)
                ->build();

            $qrDataUri = 'data:image/png;base64,' . base64_encode($result->getString());
        } catch (\Throwable) {
            // QR code non bloquant
        }

        $modeLabels = [
            'WAVE'         => 'Wave',
            'ORANGE'       => 'Orange Money',
            'MOOV_CI'      => 'Moov CI',
            'MOBILE_MONEY' => 'Mobile Money',
            'ESPECES'      => 'Espèces',
            'VIREMENT'     => 'Virement bancaire',
            'CARTE'        => 'Carte bancaire',
        ];

        $logoDataUri = null;
        $logoPath = public_path('images/logo.png');
        if (file_exists($logoPath)) {
            $logoDataUri = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        }

        $pdf = Pdf::loadView('pdf.recu-don', [
            'don'        => $don,
            'modeLabel'  => $modeLabels[$don->mode_paiement] ?? $don->mode_paiement,
            'qrDataUri'  => $qrDataUri,
            'logoDataUri'=> $logoDataUri,
        ])->setPaper('a4', 'portrait');

        $filename = 'recu-don-' . $reference . '.pdf';

        return $pdf->download($filename);
    }

    private function mapPaymentMethodToChannel(string $mode): ?string
    {
        return match ($mode) {
            'WAVE'   => 'wave-ci',
            'ORANGE' => 'orange-money-ci',
            'MOOV_CI' => 'moov-money-ci',
            default  => null,
        };
    }

    private function bootstrapPayDunya(): void
    {
        $masterKey = trim((string) config('services.paydunya.master_key', env('PAYDUNYA_MASTER_KEY', '')));
        $publicKey = trim((string) config('services.paydunya.public_key', env('PAYDUNYA_PUBLIC_KEY', '')));
        $privateKey = trim((string) config('services.paydunya.private_key', env('PAYDUNYA_PRIVATE_KEY', '')));
        $token = trim((string) config('services.paydunya.token', env('PAYDUNYA_TOKEN', '')));
        $mode = trim((string) config('services.paydunya.mode', env('PAYDUNYA_MODE', 'test')));

        if (!$masterKey || !$publicKey || !$privateKey || !$token) {
            throw new \RuntimeException('Configuration PayDunya manquante.');
        }

        Setup::setMasterKey($masterKey);
        Setup::setPublicKey($publicKey);
        Setup::setPrivateKey($privateKey);
        Setup::setToken($token);
        Setup::setMode($mode === 'live' ? 'live' : 'test');

        Store::setName((string) config('app.name', 'Application'));
        Store::setTagline('Don en ligne');
        Store::setPhoneNumber('00000000');
        Store::setPostalAddress('Cocody, Abidjan');

        $appUrl = rtrim((string) config('app.url', 'http://localhost'), '/');
        Store::setWebsiteUrl($appUrl);
        Store::setLogoUrl($appUrl . '/images/logo.png');
    }
}
