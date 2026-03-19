<?php

namespace App\Services;

use App\Models\Paiement;
use Illuminate\Support\Facades\Log;
use Paydunya\Checkout\CheckoutInvoice;
use Paydunya\Checkout\Store;
use Paydunya\Setup;

class PayDunyaService
{
    protected string $masterKey;
    protected string $publicKey;
    protected string $privateKey;
    protected string $token;
    protected string $mode;

    public function __construct()
    {
        $this->masterKey = trim((string) config('services.paydunya.master_key', env('PAYDUNYA_MASTER_KEY', '')));
        $this->publicKey = trim((string) config('services.paydunya.public_key', env('PAYDUNYA_PUBLIC_KEY', '')));
        $this->privateKey = trim((string) config('services.paydunya.private_key', env('PAYDUNYA_PRIVATE_KEY', '')));
        $this->token = trim((string) config('services.paydunya.token', env('PAYDUNYA_TOKEN', '')));
        $this->mode = trim((string) config('services.paydunya.mode', env('PAYDUNYA_MODE', 'test')));

        if (!$this->masterKey || !$this->publicKey || !$this->privateKey || !$this->token) {
            throw new \Exception('PayDunya credentials not configured');
        }

        Setup::setMasterKey($this->masterKey);
        Setup::setPublicKey($this->publicKey);
        Setup::setPrivateKey($this->privateKey);
        Setup::setToken($this->token);
        Setup::setMode($this->mode === 'live' ? 'live' : 'test');

        Store::setName((string) config('app.name', 'Application'));
        Store::setTagline('Paiement de cotisations');
        Store::setPhoneNumber('00000000');
        Store::setPostalAddress('Cocody, Abidjan');

        $appUrl = rtrim((string) config('app.url', 'http://localhost'), '/');
        Store::setWebsiteUrl($appUrl);
        Store::setLogoUrl($appUrl . '/images/logo.png');
    }

    /**
     * Initialiser un paiement et retourner l'URL de redirection PayDunya
     *
     * @param Paiement $paiement
     * @param string $callbackUrl URL de retour après paiement
     * @return array ['success' => bool, 'redirect_url' => string|null, 'error' => string|null]
     */
    public function initiatePaiement(Paiement $paiement, string $callbackUrl): array
    {
        try {
            $webhookUrl = route('paydunya.webhook');

            $invoice = new CheckoutInvoice();
            $invoice->setCancelUrl($callbackUrl . '?status=cancelled');
            $invoice->setReturnUrl($callbackUrl);
            $invoice->setCallbackUrl($webhookUrl);
            $invoice->setTotalAmount((int) $paiement->montant);
            $invoice->setDescription($this->buildDescription($paiement));
            $invoice->addItem(
                $paiement->cotisation?->nom ?? 'Cotisation',
                1,
                (int) $paiement->montant,
                (int) $paiement->montant,
                'Paiement de cotisation'
            );

            // Conserver les métadonnées locales (provider wave/orange/mtn, id paiement)
            $invoice->addCustomData('paiement_id', (string) $paiement->id);
            $invoice->addCustomData('provider', (string) ($paiement->provider ?? ''));
            $invoice->addCustomData('reference_recu', (string) $paiement->reference_recu);

            // Appliquer le canal sélectionné si le mapping est connu.
            $channel = $this->mapProviderToChannel($paiement->provider);
            if ($channel !== null) {
                $invoice->addChannel($channel);
            }

            if (!$invoice->create()) {
                Log::warning('PayDunya init failed', [
                    'paiement_id' => $paiement->id,
                    'response_code' => $invoice->response_code,
                    'response_text' => $invoice->response_text,
                    'provider' => $paiement->provider,
                ]);

                return [
                    'success' => false,
                    'error' => 'Erreur PayDunya: ' . ($invoice->response_text ?: $invoice->response_code),
                ];
            }

            $transactionId = $invoice->token;
            $redirectUrl = $invoice->getInvoiceUrl();
            $reference = $invoice->token;

            // Mettre à jour le paiement
            $paiement->update([
                'paydunya_transaction_id' => $transactionId,
                'paydunya_reference' => $reference,
                'payment_status' => Paiement::PAYMENT_STATUS_EN_ATTENTE,
                'paydunya_response' => json_encode([
                    'status' => $invoice->status,
                    'response_code' => $invoice->response_code,
                    'response_text' => $invoice->response_text,
                    'token' => $invoice->token,
                    'invoice_url' => $redirectUrl,
                    'provider' => $paiement->provider,
                ]),
                'return_url' => $callbackUrl,
            ]);

            Log::info('PayDunya payment initiated', [
                'paiement_id' => $paiement->id,
                'transaction_id' => $transactionId,
            ]);

            return [
                'success' => true,
                'redirect_url' => $redirectUrl,
                'transaction_id' => $transactionId,
            ];
        } catch (\Exception $e) {
            Log::error('PayDunya initiation exception', [
                'error' => $e->getMessage(),
                'paiement_id' => $paiement->id,
            ]);

            return [
                'success' => false,
                'error' => 'Erreur système: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Vérifier le statut d'une transaction PayDunya
     *
     * @param Paiement $paiement
     * @return array ['success' => bool, 'status' => string|null, 'data' => array|null]
     */
    public function verifyTransaction(Paiement $paiement, ?string $token = null): array
    {
        $tokenToVerify = $token ?: $paiement->paydunya_transaction_id;

        if (!$tokenToVerify) {
            return [
                'success' => false,
                'error' => 'Pas de token transaction PayDunya',
            ];
        }

        try {
            $invoice = new CheckoutInvoice();
            $confirmed = $invoice->confirm($tokenToVerify);
            $transactionStatus = $invoice->getStatus();

            // Mapper le statut PayDunya vers notre enum
            $mappedStatus = $this->mapPayDunyaStatus($transactionStatus);

            // Mettre à jour si changement
            if ($mappedStatus !== $paiement->payment_status) {
                $paiement->update([
                    'payment_status' => $mappedStatus,
                    'paydunya_response' => json_encode([
                        'confirmed' => $confirmed,
                        'status' => $invoice->getStatus(),
                        'response_code' => $invoice->response_code,
                        'response_text' => $invoice->response_text,
                        'token' => $tokenToVerify,
                        'receipt_url' => $invoice->getReceiptUrl(),
                    ]),
                ]);

                // Si payé, mettre à jour aussi l'ancien statut
                if ($mappedStatus === Paiement::PAYMENT_STATUS_PAYE) {
                    $paiement->update(['statut' => Paiement::STATUT_PAYE]);
                }
            }

            Log::info('PayDunya transaction verified', [
                'transaction_id' => $tokenToVerify,
                'status' => $mappedStatus,
            ]);

            return [
                'success' => true,
                'status' => $mappedStatus,
                'data' => [
                    'status' => $invoice->getStatus(),
                    'receipt_url' => $invoice->getReceiptUrl(),
                ],
            ];
        } catch (\Exception $e) {
            Log::error('PayDunya verify exception', [
                'error' => $e->getMessage(),
                'transaction_id' => $tokenToVerify,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Traiter un webhook PayDunya
     *
     * @param array $payload Données du webhook
     * @return array ['success' => bool, 'message' => string]
     */
    public function handleWebhook(array $payload): array
    {
        try {
            $token = $payload['data']['token']
                ?? $payload['token']
                ?? $payload['invoice_token']
                ?? null;

            if (!$token) {
                return [
                    'success' => true,
                    'message' => 'Webhook reçu sans token exploitable',
                ];
            }

            $paiement = Paiement::where('paydunya_transaction_id', $token)->first();
            if (!$paiement) {
                return [
                    'success' => true,
                    'message' => 'Webhook reçu: paiement local introuvable',
                ];
            }

            $this->verifyTransaction($paiement, $token);

            return [
                'success' => true,
                'message' => 'Webhook traité',
            ];
        } catch (\Exception $e) {
            Log::error('PayDunya webhook exception', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Mapper les statuts PayDunya vers nos constantes
     *
     * @param string $paydunya_status
     * @return string
     */
    protected function mapPayDunyaStatus(string $paydunya_status): string
    {
        return match (strtolower($paydunya_status)) {
            'pending', 'initiated', 'created' => Paiement::PAYMENT_STATUS_EN_ATTENTE,
            'completed', 'confirmed', 'success' => Paiement::PAYMENT_STATUS_PAYE,
            'failed', 'error' => Paiement::PAYMENT_STATUS_ECHEC,
            'cancelled', 'canceled' => Paiement::PAYMENT_STATUS_ANNULE,
            'expired', 'timeout' => Paiement::PAYMENT_STATUS_EXPIRE,
            default => Paiement::PAYMENT_STATUS_EN_ATTENTE,
        };
    }

    protected function mapProviderToChannel(?string $provider): ?string
    {
        // Channel slugs can vary by country/account. Use env/config overrides and fallback to null.
        $waveChannel = trim((string) config('services.paydunya.channel_wave', env('PAYDUNYA_CHANNEL_WAVE', '')));
        $orangeChannel = trim((string) config('services.paydunya.channel_orange', env('PAYDUNYA_CHANNEL_ORANGE', '')));
        $mtnChannel = trim((string) config('services.paydunya.channel_mtn', env('PAYDUNYA_CHANNEL_MTN', '')));

        return match (strtolower((string) $provider)) {
            'wave' => $waveChannel !== '' ? $waveChannel : null,
            'orange' => $orangeChannel !== '' ? $orangeChannel : null,
            'mtn' => $mtnChannel !== '' ? $mtnChannel : null,
            default => null,
        };
    }

    /**
     * Vérifier la signature du webhook (implémentation simple)
     *
     * @param array $payload
     * @return bool
     */
    /**
     * Construire la description du paiement pour PayDunya
     *
     * @param Paiement $paiement
     * @return string
     */
    protected function buildDescription(Paiement $paiement): string
    {
        $cotisation = $paiement->cotisation?->nom ?? 'Cotisation';
        $year = $paiement->year ?? date('Y');
        $family = $paiement->family?->nom ?? 'Famille';

        return "{$cotisation} {$year} - {$family}";
    }
}
