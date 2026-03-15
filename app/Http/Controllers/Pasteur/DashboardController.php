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
            'pendingLiturgieCount' => ActeLiturgique::query()
                ->where('statut', ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR)
                ->count(),
            'flashAnnouncements' => $this->buildFlashAnnouncements(),
            'familyStats' => $familyStats,
            'familyData' => $familyData,
        ]);
    }

    private function buildFlashAnnouncements()
    {
        return ActeLiturgique::query()
            ->where('est_annonce', true)
            ->whereNotNull('pasteur_id')
            ->whereIn('statut', [ActeLiturgique::STATUT_VALIDEE, ActeLiturgique::STATUT_PUBLIEE])
            ->orderByDesc('date_publication')
            ->orderByDesc('updated_at')
            ->limit(12)
            ->get()
            ->map(function (ActeLiturgique $annonce) {
                $text = trim((string) ($annonce->details['contenu'] ?? $annonce->message ?? ''));

                if ($text === '') {
                    $text = 'Annonce paroissiale publiee.';
                }

                return [
                    'id' => $annonce->id,
                    'text' => $text,
                ];
            })
            ->values();
    }
}
