<?php

namespace App\Http\Controllers\ResponsableFamille;

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
            ],
            'classes' => $classes,
            'villes' => $villes,
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
