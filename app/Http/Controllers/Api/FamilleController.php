<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Family;
use Illuminate\Http\Request;

class FamilleController extends Controller
{
    /**
     * Récupère toutes les familles, optionnellement filtrées par nom
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = Family::with(['responsable:id,nom,prenom,email', 'classe:id,nom'])
            ->select('id', 'nom', 'telephone', 'adresse', 'responsable_id', 'classe_id', 'created_at');

        // Si un terme de recherche est fourni, filtrer par nom
        if ($request->has('nom') && !empty($request->input('nom'))) {
            $searchTerm = $request->input('nom');
            $query->where('nom', 'LIKE', '%' . $searchTerm . '%');
        }

        // Utiliser la pagination au lieu de charger tout
        $familles = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->map(function ($famille) {
                return [
                    'id' => $famille->id,
                    'nom' => $famille->nom,
                'responsableNom' => $famille->responsable ? $famille->responsable->prenom . ' ' . $famille->responsable->nom : null,
                'telephone' => $famille->telephone,
                'classe' => $famille->classe ? $famille->classe->nom : null,
            ];
        });

        return response()->json($familles);
    }
}
