<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Helpers\PhotoHelper;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Family;

class FamilyController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Récupérer la famille du membre
        $family = Family::where('id', $user->family_id)
            ->first();

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
                return [
                    'id' => $m->id,
                    'nom' => $m->nom,
                    'prenom' => $m->prenom,
                    'email' => $m->email,
                    'telephone' => $m->telephone,
                    'genre' => $m->genre,
                    'ville_name' => $m->ville?->nom ?? 'N/A',
                    'fonction_name' => $m->fonction?->nom ?? 'N/A',
                    'profession' => $m->profession ?? 'N/A',
                    'relation' => $m->relation ?? 'N/A',
                    'classe_name' => $m->classe?->nom ?? 'N/A',
                    'role' => $m->id === $family->responsable_id ? 'responsable_famille' : 'membre',
                    'is_responsable' => $m->id === $family->responsable_id,
                    'is_current_user' => $m->id === $user->id,
                    'photo_path' => $m->photo_path,
                    'profile_photo_url' => $m->profile_photo_url ?: PhotoHelper::getPhotoUrl($m->photo_path, $m->prenom, $m->nom),
                ];
            })->values();
        }

        return Inertia::render('MembreFamille/Family', [
            'family' => $familyData,
            'familyStats' => $familyStats,
            'members' => $members,
            'auth' => $user,
        ]);
    }
}
