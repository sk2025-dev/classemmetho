<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\Family;
use App\Models\Notification;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class ClasseController extends Controller
{
    /**
     * Afficher la liste des classes
     */
    public function index(Request $request)
    {
        $classes = Classe::with('users', 'families')
            ->orderBy('nom')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'nom' => $c->nom,
                    'description' => $c->description ?? '',
                    'conducteur' => $c->conducteur ?? '',
                    'nombre_familles' => $c->families()->count(),
                    'nombre_membres' => $c->users()->where('role', '!=', 'admin')->count(),
                    'status' => $c->status ?? 'active',
                    'created_at' => $c->created_at?->format('d/m/Y H:i'),
                ];
            });

        // Si c'est une requête AJAX/API, retourner JSON
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'classes' => $classes,
                'count' => $classes->count(),
            ]);
        }

        return redirect()->route('admin.administration');
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        return Inertia::render('Admin/Administration/Classes/Create');
    }

    /**
     * Afficher les détails complets d'une classe avec ses relations
     */
    public function show(Classe $classe)
    {
        $classe->load(['users', 'families.responsable', 'families.members.user']);

        // Préparer les données pour les familles
        $families = $classe->families->map(function ($family) {
            $members = $family->members->map(function ($member) {
                return [
                    'id' => $member->id,
                    'nom' => $member->user?->nom,
                    'prenom' => $member->user?->prenom,
                    'email' => $member->user?->email,
                    'telephone' => $member->user?->telephone,
                    'relation' => $member->relation,
                    'statut' => $member->statut,
                    'role' => $member->role,
                    'baptise' => $member->baptise,
                ];
            });

            return [
                'id' => $family->id,
                'nom' => $family->nom,
                'email' => $family->email,
                'telephone' => $family->telephone,
                'responsable' => optional($family->responsable)->nom . ' ' . optional($family->responsable)->prenom,
                'responsable_email' => optional($family->responsable)->email,
                'responsable_tel' => optional($family->responsable)->telephone,
                'quartier' => $family->quartier,
                'adresse' => $family->adresse,
                'members_count' => $family->members->count(),
                'members' => $members,
                'created_at' => $family->created_at,
            ];
        });

        // Préparer les données de la classe
        $classeData = [
            'id' => $classe->id,
            'nom' => $classe->nom,
            'description' => $classe->description ?? '',
            'conducteur' => $classe->conducteur ?? '',
            'contact' => $classe->contact ?? '',
            'commune' => $classe->commune ?? '',
            'status' => $classe->status ?? 'active',
            'nombre_familles' => $classe->families->count(),
            'nombre_membres' => $classe->users->where('role', '!=', 'admin')->count(),
            'created_at' => $classe->created_at ? $classe->created_at->format('d/m/Y H:i') : '-',
            'total_families' => $classe->families->count(),
            'total_members' => $classe->families->sum(fn($f) => $f->members->count()),
            'membres' => $classe->users->map(function ($u) {
                return [
                    'id' => $u->id,
                    'nom' => $u->nom,
                    'prenom' => $u->prenom,
                    'email' => $u->email,
                    'telephone' => $u->telephone,
                ];
            }),
        ];

        // Si c'est une requête AJAX/API, retourner JSON
        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'classe' => $classeData,
                'families' => $families,
            ]);
        }

        return Inertia::render('Admin/Administration/Classes/Show', [
            'classe' => $classeData,
            'families' => $families,
        ]);
    }

    /**
     * Enregistrer une nouvelle classe
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:classes',
            'description' => 'nullable|string',
            'conducteur' => 'nullable|string|max:255',
        ]);

        $classe = Classe::create($validated + ['status' => 'active']);

        // Envoyer une notification à tous les admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'channel' => 'database',
                'to' => $admin->email,
                'subject' => 'Nouvelle classe créée',
                'body' => "Une nouvelle classe '{$classe->nom}' a été créée dans le système.",
                'data' => [
                    'type' => 'class_created',
                    'class_id' => $classe->id,
                    'class_name' => $classe->nom,
                ],
            ]);
        }

        return back()->with('success', "Classe '{$classe->nom}' créée avec succès");
    }

    /**
     * Afficher le formulaire d'édition
     */
    public function edit(Classe $classe)
    {
        return Inertia::render('Admin/Administration/Classes/Edit', [
            'classe' => [
                'id' => $classe->id,
                'nom' => $classe->nom,
                'description' => $classe->description,
                'conducteur' => $classe->conducteur,
                'status' => $classe->status ?? 'active',
            ],
        ]);
    }

    /**
     * Mettre à jour une classe
     */
    public function update(Request $request, Classe $classe)
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255', Rule::unique('classes', 'nom')->ignore($classe->id)],
            'description' => 'nullable|string',
            'conducteur' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ]);

        // Par défaut, si le statut n'est pas fourni, le garder inchangé
        if (!isset($validated['status'])) {
            $validated['status'] = $classe->status ?? 'active';
        }

        $classe->update($validated);

        return back();
    }

    /**
     * Supprimer une classe (soft delete) - UNIQUEMENT si la classe est vide
     */
    public function destroy(Request $request, Classe $classe)
    {
        \Log::info('🗑️ destroy() appelé - Classe ID: ' . ($classe->id ?? 'NULL') . ', Nom: ' . ($classe->nom ?? 'NULL'));

        try {
            $nomClasse = $classe->nom;
            $classeId = $classe->id;

            \Log::info('DELETE /admin/classes/' . $classeId . ' - Début suppression');

            // 1. Vérifier si la classe a des membres ACTIFS (SANS les admins/conducteurs/fonctions)
            $memberCount = User::where('classe_id', $classeId)
                ->where('is_active', true)
                ->whereNotIn('role', ['admin', 'conducteur', 'fonction'])
                ->count();

            if ($memberCount > 0) {
                \Log::warning("Tentative de suppression de classe $classeId avec $memberCount membres actifs");
                return back()->withErrors([
                    'error' => "Impossible de supprimer cette classe car elle contient $memberCount membre(s) actif(s). Veuillez d'abord désactiver la classe ou lui retirer les membres."
                ]);
            }

            // 2. Soft delete - le trait TrackModifications enregistrera deleted_by et last_modified_by
            $classe->delete();

            \Log::info('Classe ' . $classeId . ' soft-deleted');
            \Log::info('Classe supprimée: ' . $nomClasse . ' (ID: ' . $classeId . ')');

            // 3. Retourner une réponse Inertia valide avec un redirect
            return redirect()
                ->route('admin.administration')
                ->with([
                    'message' => "Classe '$nomClasse' supprimée avec succès",
                    'status' => 'success'
                ]);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la suppression de la classe: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            return back()->withErrors(['error' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
        }
    }


    /**
     * Désactiver/Activer une classe - désactive aussi tous les membres
     */
    public function toggleStatus(Request $request, Classe $classe)
    {
        try {
            // Récupérer le nouveau statut directement du front
            $newStatus = $request->input('status');

            if (!in_array($newStatus, ['active', 'inactive'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Statut invalide.',
                ], 400);
            }

            $classe->update(['status' => $newStatus]);

            // Si on passe à 'inactive', désactiver tous les membres
            if ($newStatus === 'inactive') {
                $memberCount = User::where('classe_id', $classe->id)
                    ->where('is_active', true)
                    ->update([
                        'is_active' => false,
                        'updated_at' => now(),
                        'updated_by' => auth()->id(),
                    ]);

                \Log::info("Classe {$classe->id} désactivée - $memberCount membres désactivés");
            }

            // Redirect pour générer une réponse Inertia valide
            return redirect()->back()
                ->with('success', "La classe '{$classe->nom}' a été " . ($newStatus === 'inactive' ? 'désactivée' : 'activée') . " avec succès.");
        } catch (\Exception $e) {
            \Log::error('Erreur lors du changement de statut: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Erreur lors du changement de statut: ' . $e->getMessage()]);
        }
    }
}
