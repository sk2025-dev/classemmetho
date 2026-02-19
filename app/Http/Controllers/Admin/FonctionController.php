<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fonction;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
            ->map(function($f) {
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
            'nom' => ['required', 'string', 'max:255', Rule::unique('fonctions', 'nom')->withoutTrashed()],
            'description' => 'nullable|string',
        ]);

        $fonction = Fonction::create($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Fonction '{$fonction->nom}' créée avec succès.",
                'fonction' => $fonction,
            ], 201);
        }

        return back();
    }

    /**
     * Afficher une fonction spécifique avec tous les détails des membres
     */
    public function show(Fonction $fonction)
    {
        $fonction->load('users');

        // Préparer les données complètes de la fonction et de ses membres
        $fonctionData = [
            'id' => $fonction->id,
            'nom' => $fonction->nom,
            'description' => $fonction->description ?? '',
            'nombre_membres' => $fonction->users->where('role', '!=', 'admin')->count(),
            'created_at' => $fonction->created_at ? $fonction->created_at->format('d/m/Y H:i') : '-',
        ];

        // Mapper les membres avec tous leurs détails
        $membres = $fonction->users->where('role', '!=', 'admin')->map(function($u) {
            return [
                'id' => $u->id,
                'nom' => $u->nom ?? '-',
                'prenom' => $u->prenom ?? '-',
                'identifiant' => $u->identifier ?? '-',
                'genre' => $u->genre ?? '-',
                'email' => $u->email ?? '-',
                'telephone' => $u->telephone ?? '-',
                'telephone2' => $u->telephone2 ?? '-',
                'profession' => $u->profession ?? '-',
                'fonction' => $u->fonction ?? '-',
                'classe' => $u->classe ?? '-',
                'relation' => $u->relation ?? '-',
                'famille_nom' => $u->family?->nom ?? '-',
                'famille_id' => $u->family_id,
                'ville' => $u->ville ?? '-',
                'quartier' => $u->quartier ?? '-',
                'adresse' => $u->adresse ?? '-',
                'date_naissance' => $u->date_naissance ?? '-',
                'statut_marital' => $u->statut_marital ?? '-',
                'role' => $u->role ?? 'membre',
                'baptise' => $u->baptise ?? false,
                'date_bapteme' => $u->date_bapteme ?? null,
                'lieu_bapteme' => $u->lieu_bapteme ?? null,
                'premiere_communion' => $u->premiere_communion ?? false,
                'date_premiere_communion' => $u->date_premiere_communion ?? null,
                'lieu_premiere_communion' => $u->lieu_premiere_communion ?? null,
                'marie_religieusement' => $u->marie_religieusement ?? false,
                'date_marie_religieusement' => $u->date_marie_religieusement ?? null,
                'lieu_marie_religieusement' => $u->lieu_marie_religieusement ?? null,
                'date_mariage' => $u->date_mariage ?? null,
                'lieu_mariage' => $u->lieu_mariage ?? null,
                'is_active' => $u->is_active ?? true,
                'photo' => $u->photo_path ?? null,
                'created_at' => $u->created_at ? $u->created_at->format('d/m/Y H:i') : '-',
                'updated_at' => $u->updated_at ? $u->updated_at->format('d/m/Y H:i') : '-',
            ];
        })->values();

        // Si c'est une requête AJAX/API, retourner JSON
        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'fonction' => $fonctionData,
                'membres' => $membres,
            ]);
        }

        return Inertia::render('Admin/Administration/Fonctions/Show', [
            'fonction' => $fonctionData,
            'membres' => $membres,
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
            'nom' => ['required', 'string', 'max:255', Rule::unique('fonctions', 'nom')->ignore($fonction->id)->whereNull('deleted_at')],
            'description' => 'nullable|string',
        ]);

        $fonction->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Fonction '{$fonction->nom}' mise à jour avec succès.",
                'fonction' => $fonction,
            ]);
        }

        return back();
    }

    /**
     * Supprimer une fonction avec soft delete
     * Met à jour les users assignés à cette fonction (fonction_id = NULL)
     */
    public function destroy(Request $request, Fonction $fonction)
    {
        try {
            // Récupérer tous les users assignés à cette fonction
            $usersWithFonction = User::where('fonction_id', $fonction->id)->get();

            // Mettre à jour les users pour nettoyer la référence à la fonction
            foreach ($usersWithFonction as $user) {
                $user->update([
                    'fonction_id' => null,
                ]);
            }

            // Enregistrer l'ID de l'utilisateur qui supprime la fonction
            $fonction->deleted_by = auth()->id();

            // Soft delete la fonction
            $fonction->delete();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Fonction '{$fonction->nom}' supprimée avec succès. {$usersWithFonction->count()} membres n'ont plus de fonction.",
                ]);
            }

            return back()->with('success', "Fonction '{$fonction->nom}' supprimée avec succès. {$usersWithFonction->count()} membres n'ont plus de fonction.");
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la suppression: ' . $e->getMessage(),
                ], 500);
            }

            return back()->with('error', 'Erreur lors de la suppression: ' . $e->getMessage());
        }
    }
}
