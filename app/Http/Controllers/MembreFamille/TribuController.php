<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Conducteur\TribuController as ConducteurTribuController;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TribuController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $user->loadMissing('classe', 'tribu.chefs', 'tribu.membres');

        if (!$user->classe?->has_tribus) {
            abort(403, 'Le module tribu n\'est pas activé pour votre classe.');
        }

        $tribu = $user->tribu;

        if (!$tribu) {
            return Inertia::render('MembreFamille/Tribu', [
                'tribu' => null,
            ]);
        }

        $isTribuChef = $tribu->chefs->contains('id', $user->id);

        return Inertia::render('MembreFamille/Tribu', [
            'tribu' => [
                'id' => $tribu->id,
                'nom' => $tribu->nom,
                'description' => $tribu->description ?? '',
                'chefs' => $tribu->chefs->map(fn ($chef) => [
                    'id' => $chef->id,
                    'nom' => trim($chef->prenom . ' ' . $chef->nom),
                ])->values(),
                'membres' => $tribu->membres->map(fn ($membre) => [
                    'id' => $membre->id,
                    'nom' => trim($membre->prenom . ' ' . $membre->nom),
                ])->values(),
            ],
            'isTribuChef' => $isTribuChef,
            'finances' => $isTribuChef ? ConducteurTribuController::buildFinancesData($tribu) : [],
        ]);
    }
}
