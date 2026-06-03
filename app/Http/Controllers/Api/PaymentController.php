<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Services\PayDunyaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Paydunya\Checkout\CheckoutInvoice;
use Paydunya\Checkout\Store;
use Paydunya\Setup;

class PaymentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payer_name' => ['required', 'string', 'max:120'],
            'payer_phone' => ['required', 'regex:/^\\d{8,15}$/'],
            'amount' => ['required', 'numeric', 'min:100'],
            'payment_method' => ['required', 'in:wave,orange_money,espece'],
        ]);

        $transactionId = $this->generateTransactionId();
        $payment = Paiement::create([
            'family_id' => Auth::user()?->family_id,
            'user_id' => Auth::id(),
            'cotisation_id' => null,
            'montant' => (int) $validated['amount'],
            'year' => (int) now()->format('Y'),
            'mode_paiement' => $validated['payment_method'] === 'espece'
                ? Paiement::MODE_ESPECES
                : Paiement::MODE_MOBILE_MONEY,
            'provider' => $validated['payment_method'] === 'wave'
                ? Paiement::PROVIDER_WAVE
                : ($validated['payment_method'] === 'orange_money' ? Paiement::PROVIDER_ORANGE : null),
            'date_paiement' => now()->toDateString(),
            'reference_recu' => $transactionId,
            'statut' => Paiement::STATUT_ANNULE,
            'payment_status' => Paiement::PAYMENT_STATUS_INITIE,
            'note' => 'Don en ligne - ' . $validated['payer_name'] . ' (' . $validated['payer_phone'] . ')',
        ]);

        if ($validated['payment_method'] === 'espece') {
            $payment->update([
                'payment_status' => Paiement::PAYMENT_STATUS_PAYE,
                'statut' => Paiement::STATUT_PAYE,
            ]);

            return response()->json([
                'success' => true,
                'payment_url' => route('payment.success', ['transaction' => $payment->reference_recu]),
                'transaction_id' => $payment->reference_recu,
            ]);
        }

        try {
            $this->bootstrapPayDunya();

            $invoice = new CheckoutInvoice();
            $invoice->setCancelUrl(route('payment.failed', ['transaction' => $payment->reference_recu]));
            $invoice->setReturnUrl(route('payment.success', ['transaction' => $payment->reference_recu]));
            $invoice->setCallbackUrl(route('paydunya.webhook'));
            $invoice->setTotalAmount((int) $payment->montant);
            $invoice->setDescription('Don en ligne - ' . $validated['payer_name'] . ' (' . $validated['payer_phone'] . ')');
            $invoice->addItem('Don en ligne', 1, (int) $payment->montant, (int) $payment->montant, 'Don depuis la page publique');
            $invoice->addCustomData('transaction_id', $payment->reference_recu);
            $invoice->addCustomData('payment_id', (string) $payment->id);
            $invoice->addCustomData('payer_phone', (string) $validated['payer_phone']);

            $channel = $this->mapPaymentMethodToChannel($validated['payment_method']);
            if ($channel !== null) {
                $invoice->addChannel($channel);
            }

            if (!$invoice->create()) {
                $payment->update([
                    'payment_status' => Paiement::PAYMENT_STATUS_ECHEC,
                    'statut' => Paiement::STATUT_ANNULE,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Erreur PayDunya: ' . ($invoice->response_text ?: $invoice->response_code),
                ], 400);
            }

            $payment->update([
                'paydunya_transaction_id' => $invoice->token,
                'paydunya_reference' => $invoice->token,
                'payment_status' => Paiement::PAYMENT_STATUS_EN_ATTENTE,
            ]);

            return response()->json([
                'success' => true,
                'payment_url' => $invoice->getInvoiceUrl(),
                'transaction_id' => $payment->reference_recu,
            ]);
        } catch (\Throwable $e) {
            $payment->update([
                'payment_status' => Paiement::PAYMENT_STATUS_ECHEC,
                'statut' => Paiement::STATUT_ANNULE,
            ]);

            Log::error('Payment creation failed', [
                'error' => $e->getMessage(),
                'transaction_id' => $payment->reference_recu,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'initialisation du paiement.',
            ], 500);
        }
    }

    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('PayDunya webhook received (unified)', [
            'ip' => $request->ip(),
            'payload' => $payload,
        ]);

        $transactionId = data_get($payload, 'data.custom_data.transaction_id')
            ?? data_get($payload, 'custom_data.transaction_id')
            ?? data_get($payload, 'transaction_id');

        $status = $this->mapGatewayStatus(
            (string) (
                data_get($payload, 'data.status')
                ?? data_get($payload, 'status')
                ?? data_get($payload, 'data.invoice.status')
                ?? ''
            )
        );

        if ($transactionId) {
            $payment = Paiement::where('reference_recu', $transactionId)->first();
            if ($payment) {
                if ($status !== Paiement::PAYMENT_STATUS_EN_ATTENTE) {
                    $payment->update([
                        'payment_status' => $status,
                        'statut' => $status === Paiement::PAYMENT_STATUS_PAYE
                            ? Paiement::STATUT_PAYE
                            : Paiement::STATUT_ANNULE,
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Webhook payment traité',
                ]);
            }
        }

        // Fallback vers l'ancien flux Paiement (trésorerie) pour ne rien casser.
        try {
            $legacy = new PayDunyaService();
            $legacyResult = $legacy->handleWebhook($payload);

            return response()->json([
                'success' => (bool) ($legacyResult['success'] ?? false),
                'message' => $legacyResult['message'] ?? 'Webhook traité',
            ], ($legacyResult['success'] ?? false) ? 200 : 400);
        } catch (\Throwable $e) {
            Log::error('PayDunya webhook fallback failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Webhook reçu mais non reconnu.',
            ], 400);
        }
    }

    private function mapGatewayStatus(string $gatewayStatus): string
    {
        return match (strtolower(trim($gatewayStatus))) {
            'completed', 'confirmed', 'success', 'paid', 'done' => Paiement::PAYMENT_STATUS_PAYE,
            'failed', 'error', 'cancelled', 'canceled', 'expired' => Paiement::PAYMENT_STATUS_ECHEC,
            default => Paiement::PAYMENT_STATUS_EN_ATTENTE,
        };
    }

    private function generateTransactionId(): string
    {
        return 'PAY-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 8));
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

    private function mapPaymentMethodToChannel(string $paymentMethod): ?string
    {
        $waveChannel = trim((string) config('services.paydunya.channel_wave', env('PAYDUNYA_CHANNEL_WAVE', '')));
        $orangeChannel = trim((string) config('services.paydunya.channel_orange', env('PAYDUNYA_CHANNEL_ORANGE', '')));

        return match ($paymentMethod) {
            'wave' => $waveChannel !== '' ? $waveChannel : null,
            'orange_money' => $orangeChannel !== '' ? $orangeChannel : null,
            default => null,
        };
    }
}
