<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Family;

class InscriptionsController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Récupérer la famille du responsable
        $family = Family::where('responsable_id', $user->id)
            ->first();

        // Statistiques de la famille
        $familyStats = [];
        $familyData = null;
        $members = [];

        if ($family) {
            // Afficher UNIQUEMENT les membres de la FAMILLE du responsable (pas toute la classe)
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
            // D'abord, générer les identifiants manquants et les sauvegarder
            foreach ($allMembers as $member) {
                if (!$member->identifier) {
                    $identifier = \App\Models\User::generateIdentifier($member->nom, $member->prenom, $member->date_naissance);
                    $member->update(['identifier' => $identifier]);
                }
            }

            $members = $allMembers->map(function ($m) use ($family) {
                // Seul le responsable_id de la famille est "Responsable", les autres sont "Membre"
                $isResponsable = $m->id === $family->responsable_id;

                return [
                    'id' => $m->id,
                    'identifier' => $m->identifier,
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
                    'role' => $isResponsable ? 'responsable_famille' : 'membre',
                    'is_responsable' => $isResponsable,
                    'is_active' => $m->is_active ?? true,
                    'profile_photo_url' => $m->profile_photo_url,
                ];
            })->values();

            // Log pour vérifier les données envoyées
            \Log::info('Inscriptions - Members data being sent to frontend:', [
                'count' => $members->count(),
                'first_member' => $members->first(),
            ]);
        }

        return Inertia::render('ResponsableFamille/Inscriptions', [
            'family' => $familyData,
            'familyStats' => $familyStats,
            'members' => $members,
        ]);
    }

    public function toggleMemberStatus($memberId)
    {
        $user = Auth::user();

        // Récupérer le membre et vérifier qu'il appartient à la famille du responsable
        $member = \App\Models\User::findOrFail($memberId);
        $family = Family::where('responsable_id', $user->id)->firstOrFail();

        // Vérifier que le membre appartient à la famille
        if ($member->family_id !== $family->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        // Ne pas pouvoir désactiver le responsable de la famille
        if ($member->id === $family->responsable_id) {
            return response()->json(['error' => 'Impossible de désactiver le responsable'], 403);
        }

        // Basculer le statut is_active
        $member->update(['is_active' => !$member->is_active]);

        return response()->json([
            'success' => true,
            'is_active' => $member->is_active,
            'message' => $member->is_active ? 'Membre activé' : 'Membre désactivé'
        ]);
    }
}
