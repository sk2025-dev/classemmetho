<?php

namespace App\Http\Controllers;

use App\Models\Fonction;
use Illuminate\Http\Request;

class FonctionController extends Controller
{
    /**
     * Afficher la liste des fonctions
     */
    public function index()
    {
        $fonctions = Fonction::select('id', 'nom', 'description')
            ->orderBy('nom')
            ->get();

        return response()->json($fonctions);
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        return inertia('Fonction/Create');
    }

    /**
     * Stocker une nouvelle fonction
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:fonctions,nom',
            'description' => 'nullable|string|max:1000',
        ]);

        $fonction = Fonction::create([
            'nom' => $validated['nom'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json($fonction, 201);
    }

    /**
     * Afficher une fonction
     */
    public function show(Fonction $fonction)
    {
        return response()->json($fonction);
    }

    /**
     * Afficher le formulaire d'édition
     */
    public function edit(Fonction $fonction)
    {
        return inertia('Fonction/Edit', [
            'fonction' => $fonction,
        ]);
    }

    /**
     * Mettre à jour une fonction
     */
    public function update(Request $request, Fonction $fonction)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255|unique:fonctions,nom,' . $fonction->id,
            'description' => 'nullable|string|max:1000',
        ]);

        $fonction->update($validated);

        return response()->json($fonction);
    }

    /**
     * Supprimer une fonction
     */
    public function destroy(Fonction $fonction)
    {
        $fonction->delete();

        return response()->json(['message' => 'Fonction supprimée avec succès']);
    }
}
