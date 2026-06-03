<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PayDunyaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PayDunyaWebhookController extends Controller
{
    /**
     * Recevoir et traiter les webhooks de PayDunya
     * POST /api/paydunya/webhook
     */
    public function handle(Request $request): JsonResponse
    {
        Log::info('PayDunya webhook received', [
            'ip' => $request->ip(),
            'payload' => $request->all(),
        ]);

        try {
            $service = new PayDunyaService();
            $result = $service->handleWebhook($request->all());

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'] ?? 'Webhook traité avec succès',
                ], 200);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'] ?? 'Erreur traitement webhook',
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('PayDunya webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur',
            ], 500);
        }
    }
}
