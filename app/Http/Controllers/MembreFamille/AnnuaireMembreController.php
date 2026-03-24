<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Family;
use App\Models\Classe;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnuaireMembreController extends Controller
{
    public function index(Request $request)
    {
        $view = $request->input('view', 'all');
        $search = $request->input('search');
        $classeFilter = $request->input('classe');
        $familleFilter = $request->input('famille');
        $statutFilter = $request->input('statut');
        $roleFilter = $request->input('role');
        $perPage = $request->input('perPage', 10);

        // Récupérer les listes pour les filtres
        $allClasses = Classe::pluck('nom')->unique()->values()->toArray();
        $allFamilies = Family::pluck('nom')->unique()->values()->toArray();
        $allStatuts = ['baptise', 'non_baptise', 'communion', 'marie', 'decede'];
        $allRoles = ['conducteur', 'pasteur', 'responsable'];

        // Requête de base pour les membres (exclut les administrateurs)
        $query = User::with(['family', 'classe', 'sacrements'])
                     ->where('role', '!=', 'admin');

        $this->applyMemberFilters($query, $search, $classeFilter, $familleFilter, $statutFilter, $roleFilter);

        if ($view === 'all') {
            $users = $query->paginate($perPage);
            $users->through(fn($user) => $this->transformUser($user));
            return Inertia::render('MembreFamille/Annuaire', [
                'members' => $users,
                'view' => 'all',
                'filters' => $request->only(['search', 'classe', 'famille', 'statut', 'role', 'perPage']),
                'filterOptions' => [
                    'classes' => $allClasses,
                    'familles' => $allFamilies,
                    'statuts' => $allStatuts,
                    'roles' => $allRoles,
                ],
                'cotisations' => [],
                'user' => $this->getUserData(),
            ]);
        }

        if ($view === 'families') {
            $familyIds = (clone $query)->pluck('family_id')->unique()->filter();
            $families = Family::whereIn('id', $familyIds)
                ->with(['users' => fn($q) => $this->applyMemberFilters($q, $search, $classeFilter, $familleFilter, $statutFilter, $roleFilter)])
                ->paginate($request->input('familiesPerPage', 5));

            $families->through(fn($family) => [
                'id' => $family->id,
                'nom' => $family->nom,
                'members' => $family->users->map(fn($user) => $this->transformUser($user))->values(),
                'count' => $family->users->count(),
            ]);

            return Inertia::render('MembreFamille/Annuaire', [
                'families' => $families,
                'view' => 'families',
                'filters' => $request->only(['search', 'classe', 'famille', 'statut', 'role', 'familiesPerPage']),
                'filterOptions' => [
                    'classes' => $allClasses,
                    'familles' => $allFamilies,
                    'statuts' => $allStatuts,
                    'roles' => $allRoles,
                ],
                'cotisations' => [],
                'user' => $this->getUserData(),
            ]);
        }

        if ($view === 'classes') {
            $classIds = (clone $query)->pluck('classe_id')->unique()->filter();
            $classes = Classe::whereIn('id', $classIds)
                ->with(['users' => fn($q) => $this->applyMemberFilters($q, $search, $classeFilter, $familleFilter, $statutFilter, $roleFilter)])
                ->paginate($request->input('classesPerPage', 1));

            $classes->through(fn($classe) => [
                'id' => $classe->id,
                'nom' => $classe->nom,
                'members' => $classe->users->map(fn($user) => $this->transformUser($user))->values(),
                'count' => $classe->users->count(),
            ]);

            return Inertia::render('MembreFamille/Annuaire', [
                'classes' => $classes,
                'view' => 'classes',
                'filters' => $request->only(['search', 'classe', 'famille', 'statut', 'role', 'classesPerPage']),
                'filterOptions' => [
                    'classes' => $allClasses,
                    'familles' => $allFamilies,
                    'statuts' => $allStatuts,
                    'roles' => $allRoles,
                ],
                'cotisations' => [],
                'user' => $this->getUserData(),
            ]);
        }
    }

    private function applyMemberFilters($query, $search, $classe, $famille, $statut, $role)
    {
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($classe) {
            $query->whereHas('classe', fn($q) => $q->where('nom', $classe));
        }

        if ($famille) {
            $query->whereHas('family', fn($q) => $q->where('nom', $famille));
        }

        if ($statut) {
            switch ($statut) {
                case 'baptise':
                    $query->whereHas('sacrements', fn($q) => $q->where('bapteme', true));
                    break;
                case 'non_baptise':
                    $query->whereDoesntHave('sacrements', fn($q) => $q->where('bapteme', true))
                          ->orWhereHas('sacrements', fn($q) => $q->where('bapteme', false));
                    break;
                case 'communion':
                    $query->whereHas('sacrements', fn($q) => $q->where('communion', true));
                    break;
                case 'marie':
                    $query->whereHas('sacrements', fn($q) => $q->where('mariage_religieux', true));
                    break;
                case 'decede':
                    $query->where('statut_vie', 'Décédé');
                    break;
            }
        }

        if ($role) {
            $query->where('role', $role);
        }
    }

    private function transformUser($user)
    {
        return [
            'id'                   => $user->id,
            'nom'                  => $user->nom,
            'prenoms'              => $user->prenom,
            'sexe'                 => $user->genre,
            'dateNaissance'        => $user->date_naissance?->format('Y-m-d'),
            'famille'              => $user->family?->nom ?? 'Sans famille',
            'idFamille'            => $user->family_id,
            'classeMethodiste'     => $user->classe?->nom ?? $user->classe_methodiste,
            'telephone'            => $user->telephone,
            'email'                => $user->email,
            'adresse'              => $user->family?->adresse ?? $user->adresse,
            'quartier'             => $user->family?->quartier ?? $user->quartier,
            'photo'                => $user->photo_path ? asset('storage/'.$user->photo_path) : null,
            // Champs nécessaires aux filtres
            'baptise'              => (bool) ($user->sacrements?->bapteme ?? false),
            'premiereCommunion'    => (bool) ($user->sacrements?->communion ?? false),
            'marieReligieusement'  => (bool) ($user->sacrements?->mariage_religieux ?? false),
            'confirme'             => (bool) ($user->sacrements?->confirmation ?? false),
            'statutVie'            => $user->statut_vie ?? 'Actif',
            // Informations complémentaires pour la fiche membre
            'relation'             => $user->relation ?? '-',
            'profession'           => $user->profession ?? '-',
            'fonction'             => $user->fonction ?? '-',
        ];
    }

    private function getUserData()
    {
        $user = auth()->user();
        return $user ? [
            'id'    => $user->id,
            'name'  => $user->nom.' '.$user->prenom,
            'email' => $user->email,
            'role'  => $user->role ?? 'user',
        ] : ['role' => 'guest'];
    }
}