<?php

namespace App\Http\Controllers\BureauConducteur;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\Ville;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FamilyController extends Controller
{
    public function edit()
    {
        $user = Auth::user();
        $family = $user->family;

        if (!$family) {
            return redirect('/bureau-conducteur/dashboard')
                ->with('error', 'Aucune famille trouvée');
        }

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
                'created_at' => optional($family->created_at)->toISOString(),
                'updated_at' => optional($family->updated_at)->toISOString(),
            ],
            'classes' => $classes,
            'villes' => $villes,
            'routeBase' => '/bureau-conducteur',
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();
        $family = $user->family;

        if (!$family) {
            return response()->json(['error' => 'Famille non trouvée'], 404);
        }

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

        $family->update($validated);

        return redirect('/bureau-conducteur/inscriptions')
            ->with('success', 'Informations de la famille mises à jour avec succès');
    }
}
