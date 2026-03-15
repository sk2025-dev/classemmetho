<?php

namespace App\Http\Controllers\Pasteur;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Family;
use App\Helpers\PhotoHelper;

class InscriptionsController extends Controller
{
    /**
     * Afficher la page des inscriptions pour le pasteur (sa propre famille, comme ResponsableFamille)
     */
    public function index()
    {
        $user = Auth::user();

        // Récupérer la famille du pasteur via son family_id
        $family = $user->family;

        // Statistiques de la famille
        $familyStats = [];
        $familyData = null;
        $members = [];

        if ($family) {
            $allMembers = $family->users()
                ->with('classe', 'fonction', 'ville', 'sacrements')
                ->get();

            $familyStats = [
                'totalMembers' => $allMembers->count(),
                'maleMembers' => $allMembers->filter(function ($m) {
                    return $m->genre === 'M';
                })->count(),
                'femaleMembers' => $allMembers->filter(function ($m) {
                    return $m->genre === 'F';
                })->count(),
                'familyName' => $family->nom,
                'className' => $family->classe?->nom ?? 'N/A',
                'familyId' => $family->id,
            ];

            // Préparer les données de la famille
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

            // Préparer les données des membres
            $members = $allMembers->map(function ($m) use ($family, $user) {
                \Log::debug('Membre pasteur trouvé:', [
                    'user_id' => $m->id,
                    'nom' => $m->nom,
                    'fonction_id' => $m->fonction_id,
                    'fonction' => $m->fonction?->nom,
                    'ville_id' => $m->ville_id,
                    'ville' => $m->ville?->nom,
                    'profession' => $m->profession,
                ]);

                return [
                    'id' => $m->id,
                    'nom' => $m->nom,
                    'prenom' => $m->prenom,
                    'email' => $m->email,
                    'telephone' => $m->telephone,
                    'created_at' => optional($m->created_at)->format('d/m/Y H:i'),
                    'updated_at' => optional($m->updated_at ?? $m->created_at)->format('d/m/Y H:i'),
                    'genre' => $m->genre,
                    'ville_name' => $m->ville?->nom ?? 'N/A',
                    'fonction_name' => $m->fonction?->nom ?? 'N/A',
                    'profession' => $m->profession ?? 'N/A',
                    'relation' => $m->relation ?? 'N/A',
                    'classe_name' => $m->classe?->nom ?? 'N/A',
                    'role' => $m->id === $user->id ? 'pasteur' : 'membre',
                    'is_responsable' => $m->id === $user->id,
                    'profile_photo_url' => $m->profile_photo_url ?: PhotoHelper::getPhotoUrl($m->photo_path, $m->prenom, $m->nom),
                ];
            })->values();
        }

        return Inertia::render('Pasteur/Inscriptions', [
            'family' => $familyData,
            'familyStats' => $familyStats,
            'members' => $members,
        ]);
    }
}
