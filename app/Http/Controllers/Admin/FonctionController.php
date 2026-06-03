<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fonction;
use Inertia\Inertia;
use Illuminate\Http\Request;

class FonctionController extends Controller
{
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

    public function create()
    {
        return Inertia::render('Admin/Administration/Fonctions/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255', 'unique:fonctions', 'not_regex:/,/'],
            'description' => 'nullable|string',
        ], [
            'nom.not_regex' => 'Le nom d\'une fonction doit être individuel (pas de virgule). Créez des fonctions séparées.',
        ]);

        Fonction::create($validated);

        return back();
    }

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

    public function update(Request $request, Fonction $fonction)
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255', 'unique:fonctions,nom,' . $fonction->id, 'not_regex:/,/'],
            'description' => 'nullable|string',
        ], [
            'nom.not_regex' => 'Le nom d\'une fonction doit être individuel (pas de virgule). Créez des fonctions séparées.',
        ]);

        $fonction->update($validated);

        return back();
    }

    public function destroy(Fonction $fonction)
    {
        $fonction->delete();

        return back();
    }
}
