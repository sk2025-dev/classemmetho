<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\Family;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Récupérer la famille du responsable avec ses relations
        $family = Family::where('responsable_id', $user->id)
            ->with('classe', 'ville')
            ->first();

        // Statistiques de la famille
        $familyStats = [];
        $familyData = null;

        $validatedActesCount = 0;
        if ($family) {
            $members = $family->users()->get();
            $memberIds = $members->pluck('id');
            $validatedActesCount = ActeLiturgique::where(function ($query) use ($user, $memberIds) {
                $query->where('created_by', $user->id)
                    ->orWhereIn('membre_id', $memberIds);
            })
                ->whereIn('statut', ['VALIDEE', 'PUBLIEE', 'ARCHIVEE'])
                ->count();

            $familyStats = [
                'totalMembers' => $members->count(),
                'maleMembers' => $members->filter(function ($m) {
                    return $m->genre === 'M';
                })->count(),
                'femaleMembers' => $members->filter(function ($m) {
                    return $m->genre === 'F';
                })->count(),
                'familyName' => $family->nom,
                'className' => $family->classe?->nom ?? 'N/A',
                'familyId' => $family->id,
            ];

            // Données complètes de la famille
            $familyData = [
                'id' => $family->id,
                'nom' => $family->nom,
                'email' => $family->email,
                'telephone' => $family->telephone,
                'adresse' => $family->adresse,
                'ville_name' => $family->ville?->nom ?? 'N/A',
                'classe_name' => $family->classe?->nom ?? 'N/A',
                'quartier' => $family->quartier,
            ];
        }

        return Inertia::render('ResponsableFamille/Dashboard', [
            'role' => $user->role,
            'familyStats' => $familyStats,
            'familyData' => $familyData,
            'validatedActesCount' => $validatedActesCount,
        ]);
    }
}
