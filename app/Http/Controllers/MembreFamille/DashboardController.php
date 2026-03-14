<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Affiche le tableau de bord du membre de famille.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = Auth::user();

        // À adapter selon votre logique métier (exemple : compter les inscriptions en attente)
        $pendingInscriptions = 0; // Remplacez par votre calcul

        return Inertia::render('MembreFamille/Dashboard', [
            'role'                => $user->role,
            'pendingInscriptions' => $pendingInscriptions,
            'auth'                => [
                'user' => $user,
            ],
        ]);
    }
}