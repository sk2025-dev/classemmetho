<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Don;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DonationController extends Controller
{
    public function storeAnonymous(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'montant' => ['required', 'integer', 'min:100'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY,ESPECES,VIREMENT'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $don = Don::create([
            'family_id' => null,
            'user_id' => null,
            'campagne_id' => null,
            'montant' => (int) $validated['montant'],
            'type' => Don::TYPE_LIBRE,
            'mode_paiement' => $validated['mode_paiement'],
            'date_don' => now()->toDateString(),
            'reference_recu' => 'DON-ANON-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 6)),
            'note' => $validated['note'] ?? 'Don anonyme depuis la page d\'accueil',
        ]);

        return response()->json([
            'message' => 'Merci. Votre don anonyme a ete enregistre avec succes.',
            'data' => [
                'id' => $don->id,
                'reference_recu' => $don->reference_recu,
            ],
        ], 201);
    }
}
