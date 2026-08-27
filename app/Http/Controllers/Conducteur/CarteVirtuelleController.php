<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CarteVirtuelleService;
use Illuminate\Support\Facades\Auth;

class CarteVirtuelleController extends Controller
{
    /**
     * Retourne les données de la carte virtuelle d'un membre de la classe du conducteur.
     * GET /conducteur/membres/{user}/carte
     */
    public function show(User $user)
    {
        $conducteur = Auth::user();

        if ($conducteur->role !== 'conducteur' || !$conducteur->classe_id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        if ((int) $user->classe_id !== (int) $conducteur->classe_id) {
            return response()->json(['message' => 'Ce membre n\'est pas dans votre classe.'], 403);
        }

        $carte = CarteVirtuelleService::build($user);

        if (!$carte) {
            return response()->json([
                'message' => 'La carte virtuelle n\'est pas activée pour votre classe.',
            ], 422);
        }

        return response()->json(['carte' => $carte]);
    }
}
