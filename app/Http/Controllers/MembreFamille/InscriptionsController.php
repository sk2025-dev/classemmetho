<?php

namespace App\Http\Controllers\MembreFamille;

use App\Helpers\PhotoHelper;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class InscriptionsController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();
            Log::debug('MembreFamille/Inscriptions - User ID: ' . $user->id . ', Role: ' . $user->role);

            // Récupérer la famille du membre
            $family = $user->family()
                ->with('classe', 'ville')
                ->first();

            Log::debug('Family retrieved: ' . ($family ? 'Found (ID: ' . $family->id . ')' : 'NOT FOUND'));

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
                    'classe' => $family->classe?->nom ?? 'N/A',
                ];

                // Mapper les membres avec leurs relations
                $members = $allMembers->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'nom' => $member->nom,
                        'prenom' => $member->prenom,
                        'email' => $member->email,
                        'telephone' => $member->telephone,
                        'genre' => $member->genre,
                        'date_naissance' => $member->date_naissance,
                        'fonction_name' => $member->fonction?->nom ?? '—',
                        'profession' => $member->profession ?? '—',
                        'ville_name' => $member->ville?->nom ?? '—',
                        'classe_name' => $member->classe?->nom ?? 'N/A',
                        'relation' => $member->relation,
                        'is_responsable' => $member->role === 'responsable_famille',
                        'profile_photo_url' => PhotoHelper::getPhotoUrl($member->photo_path, $member->prenom, $member->nom),
                    ];
                })->toArray();

                Log::debug('Members count: ' . count($members));
            } else {
                Log::warning('No family found for user: ' . $user->id);
            }

            return Inertia::render('MembreFamille/Inscriptions', [
                'family' => $familyData,
                'members' => $members,
                'familyStats' => $familyStats,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in MembreFamille/Inscriptions: ' . $e->getMessage() . '\n' . $e->getTraceAsString());
            throw $e;
        }
    }
}
