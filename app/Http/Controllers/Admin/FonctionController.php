<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fonction;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;

class FonctionController extends Controller
{
    /**
     * Récupérer toutes les fonctions (pour AJAX/API)
     */
    public function index(Request $request)
    {
        $fonctions = Fonction::with('users')
            ->orderBy('nom')
            ->get()
            ->map(function ($f) {
                return [
                    'id' => $f->id,
                    'nom' => $f->nom,
                    'description' => $f->description,
                    'nombre_membres' => $f->users()->where('role', '!=', 'admin')->count(),
                    'created_at' => $f->created_at?->format('d/m/Y H:i'),
                ];
            });

        // Si c'est une requête AJAX/API, retourner JSON
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'fonctions' => $fonctions,
                'count' => $fonctions->count(),
            ]);
        }

        return Inertia::render('Admin/Administration/Fonctions/Index', [
            'fonctions' => $fonctions,
        ]);
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        return Inertia::render('Admin/Administration/Fonctions/Create');
    }

    /**
     * Enregistrer une nouvelle fonction
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:fonctions',
            'description' => 'nullable|string',
        ]);

        $fonction = Fonction::create($validated);

        return back();
    }

    /**
     * Afficher une fonction spécifique
     */
    public function show(Fonction $fonction)
    {
        $fonction->load(['users' => function ($q) {
            $q->select('id', 'nom', 'prenom', 'email', 'fonction_id');
        }]);

        return Inertia::render('Admin/Administration/Fonctions/Show', [
            'fonction' => [
                'id' => $fonction->id,
                'nom' => $fonction->nom,
                'description' => $fonction->description,
                'users' => $fonction->users->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'nom' => $u->nom,
                        'prenom' => $u->prenom,
                        'email' => $u->email,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Afficher le formulaire d'édition
     */
    public function edit(Fonction $fonction)
    {
        return Inertia::render('Admin/Administration/Fonctions/Edit', [
            'fonction' => [
                'id' => $fonction->id,
                'nom' => $fonction->nom,
                'description' => $fonction->description,
            ],
        ]);
    }

    /**
     * Mettre à jour une fonction
     */
    public function update(Request $request, Fonction $fonction)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:fonctions,nom,' . $fonction->id,
            'description' => 'nullable|string',
        ]);

        $fonction->update($validated);

        return back();
    }

    /**
     * Supprimer une fonction
     */
    public function destroy(Request $request, Fonction $fonction)
    {
        $nom = $fonction->nom;
        $fonction->delete();

        return back();
    }
}
