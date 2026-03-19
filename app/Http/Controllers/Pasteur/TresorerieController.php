<?php

namespace App\Http\Controllers\Pasteur;

use App\Http\Controllers\Controller;
use App\Models\Campagne;
use App\Models\Classe;
use App\Models\Don;
use App\Models\Family;
use App\Models\Paiement;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class TresorerieController extends Controller
{
    public function index()
    {
        if (!Schema::hasTable('paiements') || !Schema::hasTable('dons') || !Schema::hasTable('campagnes')) {
            return Inertia::render('Pasteur/Tresorerie/Index', [
                'globalStats' => [
                    'cotisationsTotales' => 0,
                    'cotisationsPayees' => 0,
                    'tauxPaiement' => 0,
                    'donsTotaux' => 0,
                    'campaignesActives' => 0,
                    'famillesActives' => 0,
                ],
                'classes' => [],
                'campaignesActives' => [],
            ]);
        }

        $classes = Classe::query()->orderBy('nom')->get();
        $families = Family::query()->get();

        $globalCotisationsTotales = (int) Paiement::query()->sum('montant');
        $donsTotaux = (int) Don::query()->sum('montant');
        $famillesActives = (int) $families->count();

        $classRows = $classes->map(function (Classe $classe) {
            $famillesClasse = Family::query()->where('classe_id', $classe->id)->pluck('id');
            $payees = (int) Paiement::query()->whereIn('family_id', $famillesClasse)->sum('montant');

            $expected = max(1, $famillesClasse->count()) * 15000;
            $taux = $expected > 0 ? round(($payees / $expected) * 100) : 0;

            return [
                'nom' => $classe->nom,
                'taux' => max(0, min(100, $taux)),
                'familles' => $famillesClasse->count(),
                'cotisations' => $expected,
                'payees' => $payees,
            ];
        })->values();

        $campagnes = Campagne::query()
            ->with('classe:id,nom')
            ->where('statut', Campagne::STATUT_ACTIVE)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Campagne $campagne) {
                return [
                    'nom' => $campagne->titre,
                    'objectif' => (int) $campagne->objectif_montant,
                    'collecté' => (int) $campagne->montant_collecte,
                    'collecte' => (int) $campagne->montant_collecte,
                    'progression' => $campagne->objectif_montant > 0
                        ? round(($campagne->montant_collecte / $campagne->objectif_montant) * 100)
                        : 0,
                    'statut' => $campagne->statut,
                    'classes' => $campagne->scope === Campagne::SCOPE_GLOBAL
                        ? 'Global'
                        : ($campagne->classe?->nom ?? 'Classe'),
                ];
            })
            ->values();

        $globalStats = [
            'cotisationsTotales' => max(0, $globalCotisationsTotales),
            'cotisationsPayees' => max(0, $globalCotisationsTotales),
            'tauxPaiement' => 100,
            'donsTotaux' => max(0, $donsTotaux),
            'campaignesActives' => $campagnes->count(),
            'famillesActives' => $famillesActives,
        ];

        return Inertia::render('Pasteur/Tresorerie/Index', [
            'globalStats' => $globalStats,
            'classes' => $classRows,
            'campaignesActives' => $campagnes,
        ]);
    }
}
