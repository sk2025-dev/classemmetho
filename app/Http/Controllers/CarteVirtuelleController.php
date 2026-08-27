<?php

namespace App\Http\Controllers;

use App\Services\CarteVirtuelleService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CarteVirtuelleController extends Controller
{
    /**
     * Affiche la carte virtuelle de l'utilisateur connecté, quel que soit son rôle.
     */
    public function index()
    {
        $user = Auth::user();
        $user->loadMissing('classe');

        return Inertia::render('CarteVirtuelle', [
            'carte' => CarteVirtuelleService::build($user),
            'classeActive' => (bool) $user->classe?->carte_virtuelle_active,
        ]);
    }
}
