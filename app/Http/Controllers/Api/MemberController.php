<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function addToFamily(Request $request)
    {
        $validated = $request->validate([
            'family_id' => 'required|exists:families,id',
            'classe_id' => 'required|exists:classes,id',
            'ville_id' => 'required|exists:villes,id',
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'nullable|email|unique:users,email',
            'telephone' => 'nullable|string',
            'genre' => 'required|in:M,F',
            'date_naissance' => 'nullable|date',
            'statut_marital' => 'nullable|string',
            'adresse' => 'nullable|string',
            'fonction_id' => 'nullable|exists:fonctions,id',
        ]);

        try {
            // Créer le nouvel utilisateur
            $user = User::create([
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'] ?: null,
                'telephone' => $validated['telephone'],
                'genre' => $validated['genre'],
                'date_naissance' => $validated['date_naissance'],
                'statut_marital' => $validated['statut_marital'],
                'adresse' => $validated['adresse'],
                'famille_id' => $validated['family_id'],
                'classe_id' => $validated['classe_id'],
                'ville_id' => $validated['ville_id'],
                'fonction_id' => $validated['fonction_id'],
                'password' => bcrypt('11111'),
                'role' => 'membre_famille',
            ]);

            return response()->json([
                'message' => 'Membre ajouté avec succès',
                'user' => $user
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de l\'ajout du membre',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
