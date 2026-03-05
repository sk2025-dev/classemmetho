<?php

namespace App\Http\Controllers\Pasteur;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Récupérer les données de famille et classe du pasteur
        $familia = $user->family()->with('classe', 'ville')->first();
        $classe = $user->classe;

        // Statistiques et données pour l'affichage
        $familyStats = [];
        $familyData = null;

        if ($familia || $classe) {
            if ($familia) {
                $familyStats = [
                    'familyName' => $familia->nom,
                    'className' => $classe?->nom ?? $familia->classe?->nom ?? 'N/A',
                    'familyId' => $familia->id,
                ];

                $familyData = [
                    'id' => $familia->id,
                    'nom' => $familia->nom,
                    'classe_name' => $classe?->nom ?? $familia->classe?->nom ?? 'N/A',
                ];
            } elseif ($classe) {
                // Si le pasteur n'a pas de famille mais a une classe
                $familyStats = [
                    'familyName' => 'Aucune famille assignée',
                    'className' => $classe->nom,
                ];

                $familyData = [
                    'classe_name' => $classe->nom,
                ];
            }
        }


        return Inertia::render('Pasteur/Dashboard', [
            'role' => $user->role,
            'familyStats' => $familyStats,
            'familyData' => $familyData,
        ]);
    }
}
