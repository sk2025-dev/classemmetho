<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserSacrement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UserSacrementController extends Controller
{
    /**
     * Retourne (ou crée) l'enregistrement UserSacrement pour un user
     */
    public function show($id)
    {
        $auth = Auth::user();

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Autorisation minimale: conducteur peut voir seulement les users de sa classe
        if ($auth->role === 'conducteur') {
            $managed = $auth->getManagedClasses()->pluck('id')->toArray();
            if ($user->classe_id && !in_array($user->classe_id, $managed)) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
        }

        try {
            $sacrements = $user->sacrements;

            if (!$sacrements) {
                // Créer un enregistrement vide par défaut
                $sacrements = UserSacrement::create([
                    'user_id' => $user->id,
                    'est_marie' => false,
                    'mariage_civil_date' => null,
                    'mariage_civil_lieu' => null,
                    'dot_effectue' => false,
                    'dot_date' => null,
                    'dot_lieu' => null,
                    'est_veuf' => false,
                    'deces_conjoint_date' => null,
                    'deces_conjoint_lieu' => null,
                    'est_divorce' => false,
                    'divorce_date' => null,
                    'divorce_lieu' => null,
                    'baptise' => false,
                    'bapteme_date' => null,
                    'bapteme_lieu' => null,
                    'premiere_communion' => false,
                    'premiere_communion_date' => null,
                    'premiere_communion_lieu' => null,
                    'marie_religieusement' => false,
                    'mariage_religieux_date' => null,
                    'mariage_religieux_lieu' => null,
                ]);
            }

            // Déduire statut_marital simple
            $statut = null;
            if ($sacrements->est_marie) $statut = 'marie';
            elseif ($sacrements->est_divorce) $statut = 'divorce';
            elseif ($sacrements->est_veuf) $statut = 'veuf';

            return response()->json([
                'success' => true,
                'sacrements' => $sacrements->toArray(),
                'statut_marital' => $statut,
                'relation' => $user->relation ?? null,
                'fonction_id' => $user->fonction_id ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user sacrements: ' . $e->getMessage());
            return response()->json(['error' => 'Server error'], 500);
        }
    }
}
