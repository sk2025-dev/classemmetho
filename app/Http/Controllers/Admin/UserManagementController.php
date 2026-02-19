<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use App\Models\UserSacrement;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Http\Requests\Admin\StoreMembreRequest;
use App\Http\Requests\Admin\UpdateMembreRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Helpers\PhotoHelper;

class UserManagementController extends Controller
{
    /**
     * Afficher la liste de tous les utilisateurs
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search', '');
        $role = $request->input('role', '');
        $statut = $request->input('statut', '');

        $query = User::with('classe', 'famille', 'fonction', 'ville', 'sacrements');

        // Recherche par nom, prénom, email, ou identifiant
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('identifier', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        // Filtrer par rôle
        if ($role) {
            $query->where('role', $role);
        }

        // Filtrer par statut
        if ($statut) {
            $query->where('statut', $statut);
        }

        // Récupérer les utilisateurs avec pagination
        $users = $query->orderBy('created_at', 'desc')
                       ->paginate($perPage);

        // Formater les données pour l'affichage
        $formattedUsers = $users->map(function ($user) {
            // Récupérer les datos de sacrements
            $sacrements = $user->sacrements;

            // Déterminer statut_marital basé sur sacrements
            $statut_marital = 'Célibataire';
            if ($sacrements) {
                if ($sacrements->est_marie) $statut_marital = 'Marié(e)';
                elseif ($sacrements->est_divorce) $statut_marital = 'Divorcé(e)';
                elseif ($sacrements->est_veuf) $statut_marital = 'Veuf(ve)';
                elseif ($sacrements->dot_effectue) $statut_marital = 'Dote';
            }

            return [
                'id' => $user->id,
                'identifier' => $user->identifier,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'nom_complet' => $user->prenom . ' ' . $user->nom,
                'email' => $user->email,
                'telephone' => $user->telephone,
                'telephone2' => $user->telephone2,
                'role' => $user->role,
                'statut' => $user->statut,
                'genre' => $user->genre,
                'date_naissance' => $user->date_naissance ? $user->date_naissance->format('d/m/Y') : null,
                'profession' => $user->profession,
                'photo_path' => PhotoHelper::getPhotoUrl($user->photo_path, $user->prenom, $user->nom),
                'created_at' => $user->created_at->format('d/m/Y H:i'),
                'updated_at' => $user->updated_at->format('d/m/Y H:i'),
                'classe' => $user->classe?->nom,
                'ville' => $user->ville?->nom,
                'fonction' => $user->fonction?->nom,
                // Ajouter les champs de mariage et sacrements
                'statut_marital' => $statut_marital,
                'date_mariage' => $sacrements?->mariage_civil_date ? $sacrements->mariage_civil_date->format('Y-m-d') : null,
                'lieu_mariage' => $sacrements?->mariage_civil_lieu,
                'baptise' => $sacrements?->baptise ?? false,
                'date_bapteme' => $sacrements?->bapteme_date ? $sacrements->bapteme_date->format('Y-m-d') : null,
                'lieu_bapteme' => $sacrements?->bapteme_lieu,
                'premiere_communion' => $sacrements?->premiere_communion ?? false,
                'date_premiere_communion' => $sacrements?->premiere_communion_date ? $sacrements->premiere_communion_date->format('Y-m-d') : null,
                'lieu_premiere_communion' => $sacrements?->premiere_communion_lieu,
                'marie_religieusement' => $sacrements?->marie_religieusement ?? false,
                'date_marie_religieusement' => $sacrements?->mariage_religieux_date ? $sacrements->mariage_religieux_date->format('Y-m-d') : null,
                'lieu_marie_religieusement' => $sacrements?->mariage_religieux_lieu,
            ];
        });

        // Les rôles disponibles pour le filtre
        $availableRoles = User::distinct()->pluck('role')->filter()->values();
        $availableStatus = User::distinct()->pluck('statut')->filter()->values();

        if ($request->expectsJson()) {
            return response()->json([
                'users' => $formattedUsers,
                'pagination' => [
                    'total' => $users->total(),
                    'per_page' => $users->perPage(),
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'from' => $users->from(),
                    'to' => $users->to(),
                ],
                'filters' => [
                    'search' => $search,
                    'role' => $role,
                    'statut' => $statut,
                ],
                'available_roles' => $availableRoles,
                'available_status' => $availableStatus,
            ]);
        }

        return Inertia::render('Admin/UserManagement', [
            'users' => $formattedUsers,
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'from' => $users->from(),
                'to' => $users->to(),
            ],
            'filters' => [
                'search' => $search,
                'role' => $role,
                'statut' => $statut,
            ],
            'available_roles' => $availableRoles,
            'available_status' => $availableStatus,
        ]);
    }

    /**
     * Afficher les détails d'un utilisateur spécifique
     */
    public function show($id)
    {
        $user = User::with(['family', 'classe', 'ville', 'fonction', 'sacrements'])->findOrFail($id);

        // Récupérer les datos de sacrements
        $sacrements = $user->sacrements;

        // Déterminer statut_marital basé sur sacrements
        $statut_marital = 'Célibataire';
        if ($sacrements) {
            if ($sacrements->est_marie) $statut_marital = 'Marié(e)';
            elseif ($sacrements->est_divorce) $statut_marital = 'Divorcé(e)';
            elseif ($sacrements->est_veuf) $statut_marital = 'Veuf(ve)';
            elseif ($sacrements->dot_effectue) $statut_marital = 'Dote';
        }

        return response()->json([
            'id' => $user->id,
            'identifier' => $user->identifier,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'email' => $user->email,
            'telephone' => $user->telephone,
            'telephone2' => $user->telephone2,
            'role' => $user->role,
            'statut' => $user->statut,
            'is_active' => $user->statut === 'actif' ? 1 : 0,
            'genre' => $user->genre,
            'date_naissance' => $user->date_naissance ? $user->date_naissance->format('Y-m-d') : null,
            'profession' => $user->profession,
            'relation' => $user->relation,
            'photo_path' => PhotoHelper::getPhotoUrl($user->photo_path, $user->prenom, $user->nom),
            'created_at' => $user->created_at->format('d/m/Y H:i'),
            'updated_at' => $user->updated_at->format('d/m/Y H:i'),
            'famille' => $user->family ? [
                'id' => $user->family->id,
                'nom' => $user->family->nom,
            ] : null,
            'classe' => $user->classe?->nom,
            'ville' => $user->ville?->nom,
            'fonction' => $user->fonction?->nom,
            // Ajouter les champs de mariage et sacrements
            'statut_marital' => $statut_marital,
            'date_mariage' => $sacrements?->mariage_civil_date ? $sacrements->mariage_civil_date->format('Y-m-d') : null,
            'lieu_mariage' => $sacrements?->mariage_civil_lieu,
            'baptise' => $sacrements?->baptise ?? false,
            'date_bapteme' => $sacrements?->bapteme_date ? $sacrements->bapteme_date->format('Y-m-d') : null,
            'lieu_bapteme' => $sacrements?->bapteme_lieu,
            'premiere_communion' => $sacrements?->premiere_communion ?? false,
            'date_premiere_communion' => $sacrements?->premiere_communion_date ? $sacrements->premiere_communion_date->format('Y-m-d') : null,
            'lieu_premiere_communion' => $sacrements?->premiere_communion_lieu,
            'marie_religieusement' => $sacrements?->marie_religieusement ?? false,
            'date_marie_religieusement' => $sacrements?->mariage_religieux_date ? $sacrements->mariage_religieux_date->format('Y-m-d') : null,
            'lieu_marie_religieusement' => $sacrements?->mariage_religieux_lieu,
        ]);
    }

    /**
     * Mettre à jour le statut d'un utilisateur
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'statut' => 'required|in:actif,inactif,suspendu'
        ]);

        $user = User::findOrFail($id);
        $user->update(['statut' => $request->input('statut')]);
        return back();
    }

    /**
     * Obtenir les statistiques des utilisateurs
     */
    public function getStats()
    {
        return response()->json([
            'total_users' => User::count(),
            'by_role' => User::selectRaw('role, count(*) as count')
                              ->groupBy('role')
                              ->pluck('count', 'role'),
            'by_status' => User::selectRaw('statut, count(*) as count')
                                ->groupBy('statut')
                                ->pluck('count', 'statut'),
            'recent_users' => User::select('id', 'nom', 'prenom', 'email', 'created_at')
                                   ->orderBy('created_at', 'desc')
                                   ->limit(5)
                                   ->get()
                                   ->map(function ($user) {
                                       return [
                                           'id' => $user->id,
                                           'nom_complet' => $user->prenom . ' ' . $user->nom,
                                           'email' => $user->email,
                                           'created_at' => $user->created_at->format('d/m/Y H:i'),
                                       ];
                                   }),
        ]);
    }

    /**
     * Obtenir les classes disponibles pour le filtre Select2
     */
    public function getClasses()
    {
        $classes = \App\Models\Classe::select('id', 'nom')
                                      ->orderBy('nom')
                                      ->get()
                                      ->map(function ($classe) {
                                          return [
                                              'id' => $classe->id,
                                              'value' => $classe->id,
                                              'label' => $classe->nom,
                                              'text' => $classe->nom,
                                          ];
                                      });

        return response()->json($classes);
    }

    /**
     * Obtenir les fonctions disponibles pour le filtre Select2
     */
    public function getFonctions()
    {
        $fonctions = \App\Models\Fonction::select('id', 'nom')
                                          ->orderBy('nom')
                                          ->get()
                                          ->map(function ($fonction) {
                                              return [
                                                  'id' => $fonction->id,
                                                  'value' => $fonction->id,
                                                  'label' => $fonction->nom,
                                                  'text' => $fonction->nom,
                                              ];
                                          });

        return response()->json($fonctions);
    }

    /**
     * Exporter les utilisateurs (CSV)
     */
    public function export(Request $request)
    {
        $role = $request->input('role', '');
        $statut = $request->input('statut', '');

        $query = User::query();

        if ($role) {
            $query->where('role', $role);
        }

        if ($statut) {
            $query->where('statut', $statut);
        }

        $users = $query->get();

        $filename = 'utilisateurs_' . now()->format('Y-m-d_H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($users) {
            $file = fopen('php://output', 'w');

            // En-têtes CSV
            fputcsv($file, [
                'ID',
                'Identifiant',
                'Nom',
                'Prénom',
                'Email',
                'Téléphone',
                'Rôle',
                'Statut',
                'Genre',
                'Date de naissance',
                'Profession',
                'Créé le',
            ], ';');

            // Données
            foreach ($users as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->identifier,
                    $user->nom,
                    $user->prenom,
                    $user->email,
                    $user->telephone,
                    $user->role,
                    $user->statut,
                    $user->genre,
                    $user->date_naissance ? $user->date_naissance->format('d/m/Y') : '',
                    $user->profession,
                    $user->created_at->format('d/m/Y H:i'),
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * ═══════════════════════════════════════════════════════════════
     * ACTIONS DE GESTION DES MEMBRES (Store, Update, Destroy)
     * ═══════════════════════════════════════════════════════════════
     */

    /**
     * Créer un nouveau membre/utilisateur
     */
    public function store(StoreMembreRequest $request)
    {
        $validated = $request->validated();

        $userData = [
            'identifier' => $validated['identifier'] ?? \App\Traits\GeneratesIdentifier::generateIdentifier(
                $validated['nom'],
                $validated['prenom'],
                $validated['date_naissance'] ?? null
            ),
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'genre' => $validated['genre'] ?? null,
            'telephone' => $validated['telephone'] ?? null,
            'email' => $validated['email'] ?? null,
            'date_naissance' => $validated['date_naissance'] ?? null,
            'role' => $validated['role'] ?? 'membre_famille',
            'profession' => $validated['profession'] ?? null,
            'relation' => $validated['relation'] ?? null,
            'fonction_id' => $validated['fonction_id'] ?? null,
            'classe_id' => $validated['classe_id'] ?? null,
            'family_id' => $validated['family_id'] ?? null,
            'statut' => 'actif',
            'password' => Hash::make('11111'),
        ];

        // Upload photo si fournie
        if ($request->hasFile('photo')) {
            $userData['photo_path'] = $request->file('photo')->store('members', 'public');
        }

        $user = User::create($userData);

        // Retour Inertia avec rechargement des props
        return back()->with('success', 'Membre créé avec succès.');
    }

    /**
     * Modifier un membre/utilisateur
     */
    public function update(UpdateMembreRequest $request, User $user)
    {
        $validated = $request->validated();

        $user->nom = $validated['nom'];
        $user->prenom = $validated['prenom'];
        $user->genre = $validated['genre'] ?? $user->genre;
        $user->telephone = $validated['telephone'] ?? $user->telephone;
        $user->email = $validated['email'] ?? $user->email;
        $user->date_naissance = $validated['date_naissance'] ?? $user->date_naissance;
        $user->role = $validated['role'] ?? $user->role;
        $user->profession = $validated['profession'] ?? $user->profession;
        $user->relation = $validated['relation'] ?? $user->relation;
        $user->fonction_id = $validated['fonction_id'] ?? $user->fonction_id;
        $user->classe_id = $validated['classe_id'] ?? $user->classe_id;
        $user->family_id = $validated['family_id'] ?? $user->family_id;

        // Upload photo si fournie
        if ($request->hasFile('photo')) {
            if ($user->photo_path && Storage::exists($user->photo_path)) {
                Storage::delete($user->photo_path);
            }
            $user->photo_path = $request->file('photo')->store('members', 'public');
        }

        $user->save();

        // ═══════════════════════════════════════════════════════════════
        // GESTION DES SACREMENTS
        // ═══════════════════════════════════════════════════════════════

        // Récupérer ou créer le record UserSacrement
        $sacrements = UserSacrement::firstOrCreate(
            ['user_id' => $user->id],
            ['user_id' => $user->id]
        );

        // Statut marital et information matrimoniale
        if (isset($validated['statut_marital'])) {
            $sacrements->est_marie = $validated['statut_marital'] === 'Marié(e)' ? true : false;
            $sacrements->est_divorce = $validated['statut_marital'] === 'Divorcé(e)' ? true : false;
            $sacrements->est_veuf = $validated['statut_marital'] === 'Veuf(ve)' ? true : false;
            $sacrements->dot_effectue = $validated['statut_marital'] === 'Dote' ? true : false;
        }

        // Informations de mariage civil/dot
        if (isset($validated['date_mariage'])) {
            $sacrements->mariage_civil_date = $validated['date_mariage'];
        }
        if (isset($validated['lieu_mariage'])) {
            $sacrements->mariage_civil_lieu = $validated['lieu_mariage'];
        }

        // Sacrament : Baptême
        if (isset($validated['baptise'])) {
            $sacrements->baptise = $validated['baptise'] === true || $validated['baptise'] === '1' || $validated['baptise'] === 1;
        }
        if (isset($validated['date_bapteme'])) {
            $sacrements->bapteme_date = $validated['date_bapteme'] ?? null;
        }
        if (isset($validated['lieu_bapteme'])) {
            $sacrements->bapteme_lieu = $validated['lieu_bapteme'] ?? null;
        }

        // Sacrament : Première Communion
        if (isset($validated['premiere_communion'])) {
            $sacrements->premiere_communion = $validated['premiere_communion'] === true || $validated['premiere_communion'] === '1' || $validated['premiere_communion'] === 1;
        }
        if (isset($validated['date_premiere_communion'])) {
            $sacrements->premiere_communion_date = $validated['date_premiere_communion'] ?? null;
        }
        if (isset($validated['lieu_premiere_communion'])) {
            $sacrements->premiere_communion_lieu = $validated['lieu_premiere_communion'] ?? null;
        }

        // Sacrament : Mariage Religieux
        if (isset($validated['marie_religieusement'])) {
            $sacrements->marie_religieusement = $validated['marie_religieusement'] === true || $validated['marie_religieusement'] === '1' || $validated['marie_religieusement'] === 1;
        }
        if (isset($validated['date_mariage_religieux'])) {
            $sacrements->mariage_religieux_date = $validated['date_mariage_religieux'] ?? null;
        }
        if (isset($validated['lieu_mariage_religieux'])) {
            $sacrements->mariage_religieux_lieu = $validated['lieu_mariage_religieux'] ?? null;
        }

        $sacrements->save();

        // Retour Inertia avec rechargement des props
        return back()->with('success', 'Membre modifié avec succès.');
    }

    /**
     * Supprimer un membre (soft delete)
     */
    public function destroy(User $user)
    {
        $user->delete(); // Soft delete via SoftDeletes trait

        // Retour Inertia avec rechargement des props
        return back()->with('success', 'Membre supprimé avec succès.');
    }
}
