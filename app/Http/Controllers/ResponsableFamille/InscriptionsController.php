<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Family;
use App\Models\Classe;
use App\Helpers\PhotoHelper;

class InscriptionsController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Récupérer la famille du responsable
        $family = Family::with('ville', 'classe')
            ->where('responsable_id', $user->id)
            ->first();

        // Correction automatique : si ville_id est null, chercher dans l'inscription liée
        if ($family && !$family->ville_id) {
            $inscription = \App\Models\Inscription::where('responsable_email', $family->email)
                ->whereIn('status', ['approuve', 'approved'])
                ->orderByDesc('updated_at')
                ->first();

            $inscVilleId = $inscription?->data['famille']['ville']
                ?? $inscription?->data['famille']['ville_id']
                ?? $inscription?->ville_id
                ?? null;

            if ($inscVilleId) {
                $family->ville_id = (int) $inscVilleId;
                $family->save();
                $family->load('ville');
                // Corriger aussi tous les membres sans ville_id
                $family->users()->whereNull('ville_id')->update(['ville_id' => $family->ville_id]);
            }
        }

        // AJOUT : Récupérer toutes les classes pour le modal de transfert
        // On sélectionne seulement l'ID et le nom pour alléger la requête
        $classes = Classe::orderBy('nom')->get(['id', 'nom']);

        // Statistiques de la famille
        $familyStats = [];
        $familyData = null;
        $members = [];

        if ($family) {
            $allMembers = $family->users()
                ->with('classe', 'fonction', 'ville', 'sacrements')
                ->get()
                ->reject(fn ($member) => $this->isSupersededTransferredUser($member))
                ->values();

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
                'code_famille' => $family->code_famille,
                'email' => $family->email,
                'telephone' => $family->telephone,
                'adresse' => $family->adresse,
                'ville_name' => $family->ville?->nom ?? 'N/A',
                'classe_name' => $family->classe?->nom ?? 'N/A',
                'quartier' => $family->quartier,
                'transfer_status' => $family->transfer_status,
                'transfer_label' => $family->transfer_label,
                'transfer_locked' => in_array((string) $family->transfer_status, ['pending', 'completed'], true),
            ];

            // Préparer les données des membres
            $members = $allMembers->map(function ($m) use ($family) {
                \Log::debug('Membre trouvé:', [
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
                    'code_membre' => $m->code_membre,
                    'created_at' => optional($m->created_at)->format('d/m/Y H:i'),
                    'updated_at' => optional($m->updated_at ?? $m->created_at)->format('d/m/Y H:i'),
                    'genre' => $m->genre,
                    'ville_name' => $m->ville?->nom ?? $family->ville?->nom ?? 'N/A',
                    'fonction_name' => $m->fonction?->nom ?? 'N/A',
                    'profession' => $m->profession ?? 'N/A',
                    'relation' => $m->relation ?? 'N/A',
                    'classe_name' => $m->classe?->nom ?? 'N/A',
                    'role' => $m->id === $family->responsable_id ? 'responsable_famille' : 'membre',
                    'is_responsable' => $m->id === $family->responsable_id,
                    'transfer_status' => $m->transfer_status,
                    'transfer_label' => $m->transfer_label,
                    'transfer_locked' => in_array((string) $m->transfer_status, ['pending', 'completed'], true),
                    'profile_photo_url' => $m->profile_photo_url ?: PhotoHelper::getPhotoUrl($m->photo_path, $m->prenom, $m->nom),
                ];
            })->values();
        }

        return Inertia::render('ResponsableFamille/Inscriptions', [
            'family' => $familyData,
            'familyStats' => $familyStats,
            'members' => $members,
            'classes' => $classes, // AJOUT : On passe les classes à la vue
        ]);
    }
    private function isSupersededTransferredUser($user): bool
    {
        return $user->transfer_status === 'completed'
            && !empty($user->transferred_to_user_id);
    }
}
