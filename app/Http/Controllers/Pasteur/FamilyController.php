<?php

namespace App\Http\Controllers\Pasteur;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Family;
use App\Models\Classe;
use App\Models\Ville;
use Illuminate\Http\Request;

class FamilyController extends Controller
{
    /**
     * Afficher le formulaire d'édition de la famille du pasteur
     */
    public function edit()
    {
        $user = Auth::user();

        // Récupérer la famille du pasteur via son family_id
        $family = $user->family;

        if (!$family) {
            return redirect('/pasteur/dashboard')
                ->with('error', 'Aucune famille trouvée');
        }

        // Récupérer toutes les classes et villes pour les sélecteurs
        $classes = Classe::all();
        $villes = Ville::all();

        return Inertia::render('Pasteur/EditFamily', [
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
                'created_at' => optional($family->created_at)->toISOString(),
                'updated_at' => optional($family->updated_at)->toISOString(),
            ],
            'classes' => $classes,
            'villes' => $villes,
        ]);
    }

    /**
     * Mettre à jour la famille du pasteur
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        // Récupérer la famille du pasteur
        $family = $user->family;

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
        ]);

        // Mettre à jour la famille
        $family->update($validated);

        return redirect('/pasteur/inscriptions')
            ->with('success', 'Informations de la famille mises à jour avec succès');
    }
}
