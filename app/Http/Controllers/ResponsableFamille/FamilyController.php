<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TransferWorkflowService;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Family;
use App\Models\Classe;
use App\Models\Ville;
use Illuminate\Http\Request;

class FamilyController extends Controller
{
    private const AGE_MINIMUM_RESPONSABLE = 18;

    private function isTransferLocked(User|Family|null $record): bool
    {
        return app(TransferWorkflowService::class)->isTransferLocked($record);
    }

    /**
     * Afficher le formulaire d'édition de la famille
     */
    public function edit()
    {
        $user = Auth::user();

        // Récupérer la famille du responsable
        $family = Family::where('responsable_id', $user->id)
            ->with('classe', 'ville')
            ->first();

        if (!$family) {
            return redirect('/responsable-famille/dashboard')
                ->with('error', 'Aucune famille trouvée');
        }

        // Récupérer toutes les classes et villes pour les sélecteurs
        $classes = Classe::all();
        $villes = Ville::all();

        // Autres membres de la famille, pour l'option de transfert de responsabilité —
        // avec leur éligibilité (majeur) calculée côté serveur.
        $membres = User::query()
            ->where('family_id', $family->id)
            ->where('id', '!=', $user->id)
            ->orderBy('nom')
            ->get(['id', 'nom', 'prenom', 'genre', 'date_naissance'])
            ->map(function (User $membre) {
                $age = $membre->date_naissance
                    ? $membre->date_naissance->age
                    : null;

                return [
                    'id' => $membre->id,
                    'nom' => $membre->nom,
                    'prenom' => $membre->prenom,
                    'genre' => $membre->genre,
                    'age' => $age,
                    'eligible' => $age !== null && $age >= self::AGE_MINIMUM_RESPONSABLE,
                ];
            })
            ->values();

        return Inertia::render('ResponsableFamille/EditFamily', [
            'family' => [
                'id' => $family->id,
                'nom' => $family->nom,
                'email' => $family->email,
                'telephone' => $family->telephone,
                'telephone2' => $family->telephone2,
                'adresse' => $family->adresse,
                'quartier' => $family->quartier,
                'classe_id' => $family->classe_id,
                'ville_id' => $family->ville_id,
                'contact_urgence' => $family->contact_urgence,
                'contact_urgence_tel' => $family->contact_urgence_tel,
                'created_at' => optional($family->created_at)->toISOString(),
                'updated_at' => optional($family->updated_at)->toISOString(),
            ],
            'classes' => $classes,
            'villes' => $villes,
            'routeBase' => '/responsable-famille',
            'membres' => $membres,
            'transferLocked' => $this->isTransferLocked($family),
        ]);
    }

    /**
     * Transférer la responsabilité de la famille à un autre membre : le membre
     * choisi devient responsable_famille (role + is_family_responsible + family
     * .responsable_id), l'ancien responsable redevient un membre_famille
     * ordinaire. Le nouveau responsable doit être un membre majeur de la MÊME
     * famille — jamais un membre d'une autre famille.
     */
    public function transferResponsable(Request $request)
    {
        $user = Auth::user();

        $family = Family::where('responsable_id', $user->id)->first();

        if (!$family) {
            return response()->json(['message' => 'Famille non trouvée.'], 404);
        }

        if ($this->isTransferLocked($family)) {
            return response()->json([
                'message' => "Aucune nouvelle action n'est possible sur une famille en transfert ou archivée.",
            ], 422);
        }

        $validated = $request->validate([
            'new_responsable_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $nouveauResponsable = User::findOrFail($validated['new_responsable_id']);

        if ((int) $nouveauResponsable->family_id !== (int) $family->id) {
            return response()->json(['message' => "Ce membre n'appartient pas à votre famille."], 422);
        }

        if ($nouveauResponsable->id === $user->id) {
            return response()->json(['message' => 'Vous êtes déjà responsable de cette famille.'], 422);
        }

        $age = $nouveauResponsable->date_naissance
            ? $nouveauResponsable->date_naissance->age
            : null;

        if ($age === null || $age < self::AGE_MINIMUM_RESPONSABLE) {
            return response()->json([
                'message' => 'Le nouveau responsable doit être majeur (' . self::AGE_MINIMUM_RESPONSABLE . ' ans minimum).',
            ], 422);
        }

        DB::transaction(function () use ($family, $nouveauResponsable, $user) {
            $family->update(['responsable_id' => $nouveauResponsable->id]);

            $nouveauResponsable->update([
                'role' => 'responsable_famille',
                'is_family_responsible' => true,
            ]);

            $user->update([
                'role' => 'membre_famille',
                'is_family_responsible' => false,
            ]);
        });

        return response()->json([
            'message' => trim($nouveauResponsable->prenom . ' ' . $nouveauResponsable->nom) . ' est désormais responsable de la famille. Vous êtes maintenant un membre de la famille.',
        ]);
    }

    /**
     * Mettre à jour la famille
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        // Récupérer la famille du responsable
        $family = Family::where('responsable_id', $user->id)->first();

        if (!$family) {
            return response()->json(['error' => 'Famille non trouvée'], 404);
        }

        // Valider les données
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'telephone' => 'required|string|max:20',
            'telephone2' => 'nullable|string|max:20',
            'adresse' => 'nullable|string|max:500',
            'quartier' => 'nullable|string|max:255',
            'classe_id' => 'nullable|exists:classes,id',
            'ville_id' => 'nullable|exists:villes,id',
            'contact_urgence' => 'nullable|string|max:255',
            'contact_urgence_tel' => 'nullable|string|max:20',
        ]);

        // Mettre à jour la famille
        $family->update($validated);

        return redirect('/responsable-famille/inscriptions')
            ->with('success', 'Informations de la famille mises à jour avec succès');
    }
}
