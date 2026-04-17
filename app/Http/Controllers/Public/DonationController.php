<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Don;
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
            'mode_paiement' => ['required', 'in:MOBILE_MONEY,ESPECES,VIREMENT'],
            'note' => ['nullable', 'string', 'max:1000'],
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
                'note' => $validated['note'] ?? null,
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
                'family_id' => null,
                'user_id' => null,
                'campagne_id' => null,
                'montant' => (int) ($pending['montant'] ?? 0),
                'type' => Don::TYPE_LIBRE,
                'mode_paiement' => $pending['mode_paiement'] ?? 'MOBILE_MONEY',
                'date_don' => now()->toDateString(),
                'reference_recu' => $reference,
                'note' => trim('Don en ligne depuis accueil. Donateur: ' . ($pending['nom_donateur'] ?? '-') . ' - Numero: ' . ($pending['numero_donateur'] ?? '-') . ' - ' . ($pending['note'] ?? '')),
            ]);

            return redirect('/?don=success');
        } catch (\Throwable $e) {
            Log::error('Anonymous donation verify failed', [
                'error' => $e->getMessage(),
                'reference' => $reference,
            ]);

            return redirect('/?don=error');
        }
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
