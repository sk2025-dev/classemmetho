<?php

namespace App\Http\Controllers\BureauConducteur;

use App\Http\Controllers\Controller;
use App\Helpers\PhotoHelper;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InscriptionsController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $family = $user->family;

        $familyStats = [];
        $familyData = null;
        $members = [];

        if ($family) {
            $allMembers = $family->users()
                ->with('classe', 'fonction', 'ville', 'sacrements')
                ->get();

            $familyStats = [
                'totalMembers' => $allMembers->count(),
                'maleMembers' => $allMembers->filter(fn ($m) => $m->genre === 'M')->count(),
                'femaleMembers' => $allMembers->filter(fn ($m) => $m->genre === 'F')->count(),
                'familyName' => $family->nom,
                'className' => $family->classe?->nom ?? 'N/A',
                'familyId' => $family->id,
            ];

            $familyData = [
                'id' => $family->id,
                'nom' => $family->nom,
                'code_famille' => $family->code_famille,
                'email' => $family->email,
                'telephone' => $family->telephone,
                'adresse' => $family->adresse,
                'ville_name' => $family->ville?->nom ?? 'N/A',
                'classe_name' => $family->classe?->nom ?? 'N/A',
                'quartier' => $family->quartier,
            ];

            $members = $allMembers->map(function ($m) use ($user) {
                return [
                    'id' => $m->id,
                    'nom' => $m->nom,
                    'prenom' => $m->prenom,
                    'email' => $m->email,
                    'telephone' => $m->telephone,
                    'code_membre' => $m->code_membre,
                    'created_at' => optional($m->created_at)->format('d/m/Y H:i'),
                    'updated_at' => optional($m->updated_at ?? $m->created_at)->format('d/m/Y H:i'),
                    'genre' => $m->genre,
                    'ville_name' => $m->ville?->nom ?? 'N/A',
                    'fonction_name' => $m->fonction?->nom ?? 'N/A',
                    'profession' => $m->profession ?? 'N/A',
                    'relation' => $m->relation ?? 'N/A',
                    'classe_name' => $m->classe?->nom ?? 'N/A',
                    'role' => $m->id === $user->id ? 'bureau_conducteur' : 'membre',
                    'is_responsable' => $m->id === $user->id,
                    'is_deceased' => (bool) $m->is_deceased,
                    'deceased_at' => $m->deceased_at?->format('Y-m-d'),
                    'profile_photo_url' => $m->profile_photo_url ?: PhotoHelper::getPhotoUrl($m->photo_path, $m->prenom, $m->nom),
                ];
            })->values();
        }

        return Inertia::render('BureauConducteur/Inscriptions', [
            'family' => $familyData,
            'familyStats' => $familyStats,
            'members' => $members,
        ]);
    }
}
