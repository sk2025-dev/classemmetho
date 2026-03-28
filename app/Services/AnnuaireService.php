<?php

namespace App\Services;

use App\Models\User;
use App\Models\Family;
use App\Models\Classe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Exports\AnnuaireExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Collection;

class AnnuaireService
{
    /**
     * Point d'entrée principal : construit toutes les données nécessaires à la page Annuaire.
     *
     * @param Request $request
     * @param string $roleScope (admin, conducteur, responsable_famille, membre_famille)
     * @return array
     */
    public function getAnnuaireData(Request $request, string $roleScope = 'admin'): array
    {
        // Récupération des filtres depuis la requête
        $filters = [
            'search' => $request->get('search', ''),
            'classe' => $request->get('classe', ''),
            'famille' => $request->get('famille', ''),
            'profession' => $request->get('profession', ''),
            'role' => $request->get('role', ''),
            'perPage' => (int) $request->get('perPage', 10),
        ];

        // Vue demandée (all, families, classes)
        $view = $request->get('view', 'all');

        // Pagination spécifique pour familles et classes
        $familiesPerPage = (int) $request->get('familiesPerPage', 5);
        $classesPerPage = (int) $request->get('classesPerPage', 1);

        // Données pour la vue 'all' (membres paginés)
        $membersData = $this->getMembersPaginated($request, $roleScope, $filters);

        // Données pour la vue 'families' (familles paginées)
        $familiesData = $this->getFamiliesPaginated($request, $roleScope, $filters, $familiesPerPage);

        // Données pour la vue 'classes' (classes paginées)
        $classesData = $this->getClassesPaginated($request, $roleScope, $filters, $classesPerPage);

        // Options pour les filtres (menus déroulants)
        $filterOptions = $this->getFilterOptions($roleScope, $filters);

        // Informations sur l'utilisateur connecté
        $user = Auth::user();
        $userData = $user ? [
            'id' => $user->id,
            'role' => $user->role,
            'name' => $user->name,
        ] : null;

        // Cotisations (à remplacer par de vraies données si disponibles)
        $cotisations = [];

        return [
            'members' => $membersData,
            'families' => $familiesData,
            'classes' => $classesData,
            'view' => $view,
            'cotisations' => $cotisations,
            'user' => $userData,
            'filters' => $filters,
            'filterOptions' => $filterOptions,
        ];
    }

    /**
     * Récupère les membres paginés (vue 'all').
     */
    protected function getMembersPaginated(Request $request, string $roleScope, array $filters): array
    {
        $query = $this->buildUsersQuery($roleScope, $filters);
        $perPage = $filters['perPage'] ?? 10;
        $paginator = $query->paginate($perPage);

        $members = collect($paginator->items())->map(function ($user) {
            return $this->formatMemberForComponent($user);
        })->toArray();

        return [
            'data' => $members,
            'links' => $this->formatPaginationLinks($paginator),
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    /**
     * Récupère les familles paginées (vue 'families').
     */
    protected function getFamiliesPaginated(Request $request, string $roleScope, array $filters, int $perPage): array
    {
        $query = Family::with([
            'users' => function ($q) use ($roleScope, $filters) {
                $q->select('id', 'prenom', 'nom', 'telephone', 'profile_photo_url', 'classe_id', 'family_id')
                  ->with(['classe:id,nom']);
                $this->applyUserFilters($q, $filters, $roleScope);
            },
        ])->orderBy('nom');

        if (!empty($filters['famille'])) {
            $query->where('id', $filters['famille']);
        }

        // Restriction pour responsable_famille et membre_famille : uniquement les familles ayant au moins un membre de la classe de l'utilisateur
        if (in_array($roleScope, ['responsable_famille', 'membre_famille']) && Auth::id()) {
            $authUser = Auth::user();
            $classeId = $authUser?->classe_id;
            if ($classeId) {
                $query->whereHas('users', function ($q) use ($classeId) {
                    $q->where('classe_id', $classeId);
                });
            } else {
                $query->where('id', 0); // aucune famille si l'utilisateur n'a pas de classe
            }
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('code_famille', 'like', "%{$search}%")
                  ->orWhereHas('users', function ($sub) use ($search) {
                      $sub->where('nom', 'like', "%{$search}%")
                          ->orWhere('prenom', 'like', "%{$search}%")
                          ->orWhere('telephone', 'like', "%{$search}%")
                          ->when(
                              Schema::hasColumn('users', 'profession'),
                              fn($inner) => $inner->orWhere('profession', 'like', "%{$search}%")
                          )
                          ->when(
                              Schema::hasColumn('users', 'code_membre'),
                              fn($inner) => $inner->orWhere('code_membre', 'like', "%{$search}%")
                          )
                          ->orWhereHas('family', function ($f) use ($search) {
                              $f->where('code_famille', 'like', "%{$search}%")
                                ->orWhere('nom', 'like', "%{$search}%");
                          });
                  });
            });
        }

        $paginator = $query->paginate($perPage);

        $families = collect($paginator->items())->map(function (Family $family) {
            $members = $family->users
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'prenoms' => $user->prenom,
                        'nom' => $user->nom,
                        'telephone' => $user->telephone,
                        'photo' => $user->profile_photo_url,
                        'classeMethodiste' => $user->classe?->nom,
                    ];
                })
                ->values();

            return [
                'id' => $family->id,
                'nom' => $family->nom,
                'code_famille' => $family->code_famille,
                'count' => $members->count(),
                'members' => $members->toArray(),
            ];
        })->toArray();

        return [
            'data' => $families,
            'links' => $this->formatPaginationLinks($paginator),
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    /**
     * Récupère les classes paginées (vue 'classes').
     */
    protected function getClassesPaginated(Request $request, string $roleScope, array $filters, int $perPage): array
    {
        $query = Classe::with([
            'users' => function ($q) use ($roleScope, $filters) {
                $q->select('id', 'prenom', 'nom', 'telephone', 'profile_photo_url', 'classe_id', 'family_id')
                  ->with(['family:id,code_famille']);
                $this->applyUserFilters($q, $filters, $roleScope);
            },
        ])->where('status', 'active')->orderBy('nom');

        if (!empty($filters['classe'])) {
            $query->where('id', $filters['classe']);
        }

        if ($roleScope === 'conducteur' && Auth::id()) {
            $authUser = Auth::user();
            $classeIds = [];
            if ($authUser?->classe_id) {
                $classeIds[] = $authUser->classe_id;
            }
            if ($authUser?->identifier) {
                $conductedClassIds = Classe::where('conducteur', $authUser->identifier)->pluck('id')->toArray();
                $classeIds = array_merge($classeIds, $conductedClassIds);
            }
            $classeIds = array_filter(array_unique($classeIds));
            if (!empty($classeIds)) {
                $query->whereIn('id', $classeIds);
            } else {
                $query->where('id', 0);
            }
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhereHas('users', function ($sub) use ($search) {
                      $sub->where('nom', 'like', "%{$search}%")
                          ->orWhere('prenom', 'like', "%{$search}%")
                          ->orWhere('telephone', 'like', "%{$search}%")
                          ->when(
                              Schema::hasColumn('users', 'profession'),
                              fn($inner) => $inner->orWhere('profession', 'like', "%{$search}%")
                          )
                          ->when(
                              Schema::hasColumn('users', 'code_membre'),
                              fn($inner) => $inner->orWhere('code_membre', 'like', "%{$search}%")
                          )
                          ->orWhereHas('family', function ($f) use ($search) {
                              $f->where('code_famille', 'like', "%{$search}%")
                                ->orWhere('nom', 'like', "%{$search}%");
                          });
                  });
            });
        }

        $paginator = $query->paginate($perPage);

        $classes = collect($paginator->items())->map(function (Classe $classe) {
            $members = $classe->users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'prenoms' => $user->prenom,
                    'nom' => $user->nom,
                    'telephone' => $user->telephone,
                    'photo' => $user->profile_photo_url,
                    'famille' => $user->family?->code_famille,
                ];
            })->values();

            return [
                'id' => $classe->id,
                'nom' => $classe->nom,
                'members' => $members->toArray(),
            ];
        })->toArray();

        return [
            'data' => $classes,
            'links' => $this->formatPaginationLinks($paginator),
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    /**
     * Construit la requête de base pour les utilisateurs (membres) avec les filtres.
     */
    protected function buildUsersQuery(string $roleScope, array $filters)
    {
        $usersColumns = Schema::getColumnListing('users');
        $selectColumns = [
            'id',
            'prenom',
            'nom',
            'email',
            'telephone',
            'telephone2',
            'genre',
            'date_naissance',
            'profession',
            'role',
            'fonction_id',
            'classe_id',
            'family_id',
            'created_at',
            'updated_at',
            'code_membre',
            'profile_photo_url',
            'baptise',
            'date_bapteme',
            'lieu_bapteme',
            'premiere_communion',
            'date_communion',
            'confirme',
            'marie_religieusement',
            'mariage_civil',
            'dote',
            'veuf',
            'statut_vie',
            'relation',
            'adresse',
            'quartier',
        ];

        $selectColumns = array_intersect($selectColumns, $usersColumns);

        $query = User::with(['classe', 'fonction', 'family'])
            ->select($selectColumns)
            ->where('role', '!=', 'admin');

        $this->applyUserFilters($query, $filters, $roleScope);

        $query->orderBy('nom')
            ->orderBy('prenom')
            ->latest();

        return $query;
    }

    /**
     * Applique les filtres communs à une requête d'utilisateurs.
     */
    protected function applyUserFilters($query, array $filters, string $roleScope)
    {
        $usersColumns = Schema::getColumnListing('users');
        $identifierColumn = in_array('identifiant', $usersColumns, true)
            ? 'identifiant'
            : (in_array('identifier', $usersColumns, true) ? 'identifier' : null);

        $authUserId = Auth::id();

        switch ($roleScope) {
            case 'conducteur':
                if ($authUserId !== null) {
                    $authUser = User::find($authUserId);
                    $classeIds = [];
                    if ($authUser?->classe_id) {
                        $classeIds[] = $authUser->classe_id;
                    }
                    if ($authUser?->identifier) {
                        $conductedClassIds = Classe::where('conducteur', $authUser->identifier)->pluck('id')->toArray();
                        $classeIds = array_merge($classeIds, $conductedClassIds);
                    }
                    $classeIds = array_filter(array_unique($classeIds));
                    if (!empty($classeIds)) {
                        $query->whereIn('classe_id', $classeIds);
                    } else {
                        $query->where('classe_id', 0);
                    }
                }
                break;
            case 'responsable_famille':
            case 'membre_famille':
                if ($authUserId !== null) {
                    $authUser = User::find($authUserId);
                    $classeId = $authUser?->classe_id;
                    if ($classeId) {
                        $query->where('classe_id', $classeId);
                    } else {
                        $query->where('classe_id', 0); // aucun membre si l'utilisateur n'a pas de classe
                    }
                }
                break;
        }

        // Recherche textuelle
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $table = $query->getModel()->getTable();

            $query->where(
                fn($q) => $q
                    ->where('nom', 'like', "%{$search}%")
                    ->orWhere('prenom', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('telephone', 'like', "%{$search}%")
                    ->when(
                        $identifierColumn,
                        fn($inner) => $inner->orWhere($identifierColumn, 'like', "%{$search}%")
                    )
                    ->when(
                        Schema::hasColumn($table, 'profession'),
                        fn($inner) => $inner->orWhere('profession', 'like', "%{$search}%")
                    )
                    ->when(
                        Schema::hasColumn($table, 'code_membre'),
                        fn($inner) => $inner->orWhere('code_membre', 'like', "%{$search}%")
                    )
                    ->orWhereHas('family', function ($q) use ($search) {
                        $q->where('code_famille', 'like', "%{$search}%")
                          ->orWhere('nom', 'like', "%{$search}%");
                    })
            );
        }

        if (!empty($filters['classe'])) {
            $query->where('classe_id', $filters['classe']);
        }

        if (!empty($filters['famille'])) {
            $query->where('family_id', $filters['famille']);
        }

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['profession'])) {
            $query->where('profession', $filters['profession']);
        }

        return $query;
    }

    /**
     * Retourne les options pour les filtres (menus déroulants).
     */
    protected function getFilterOptions(string $roleScope, array $filters): array
    {
        // Classes : unique par nom pour éviter les doublons dans le menu déroulant
        $classes = Classe::where('status', 'active')
            ->orderBy('nom')
            ->get(['id', 'nom'])
            ->unique('nom')
            ->map(fn($c) => ['id' => $c->id, 'nom' => $c->nom])
            ->values()
            ->toArray();

        // Familles
        $families = Family::orderBy('nom')
            ->get(['id', 'nom'])
            ->map(fn($f) => ['id' => $f->id, 'nom' => $f->nom])
            ->toArray();

        // Professions distinctes
        $professions = User::where('role', '!=', 'admin')
            ->whereNotNull('profession')
            ->distinct()
            ->pluck('profession')
            ->filter()
            ->values()
            ->map(fn($prof) => ['value' => $prof, 'label' => $prof])
            ->toArray();

        // Rôles
        $roles = User::where('role', '!=', 'admin')
            ->distinct()
            ->pluck('role')
            ->filter()
            ->values()
            ->map(fn($r) => ['value' => $r, 'label' => ucfirst($r)])
            ->toArray();

        return [
            'classes' => $classes,
            'familles' => $families,
            'professions' => $professions,
            'roles' => $roles,
        ];
    }

    /**
     * Formate un utilisateur au format attendu par le composant React.
     */
    protected function formatMemberForComponent(User $user): array
    {
        $defaults = [
            'baptise' => false,
            'dateBapteme' => null,
            'lieuBapteme' => null,
            'premiereCommunion' => false,
            'dateCommunion' => null,
            'confirme' => false,
            'marieReligieusement' => false,
            'mariageCivil' => false,
            'dote' => false,
            'veuf' => false,
            'statutVie' => null,
            'relation' => null,
            'adresse' => null,
            'quartier' => null,
            'fonction' => null,
            'profession' => null,
            'telephone' => null,
            'email' => null,
            'dateNaissance' => null,
        ];

        return [
            'id' => $user->id,
            'prenoms' => $user->prenom,
            'nom' => $user->nom,
            'sexe' => $user->genre ?? 'M',
            'famille' => $user->family?->code_famille ?? $user->family?->nom ?? '-',
            'classeMethodiste' => $user->classe?->nom ?? '-',
            'telephone' => $user->telephone ?? '-',
            'email' => $user->email ?? '-',
            'baptise' => $user->baptise ?? $defaults['baptise'],
            'dateBapteme' => $user->date_bapteme ?? $defaults['dateBapteme'],
            'lieuBapteme' => $user->lieu_bapteme ?? $defaults['lieuBapteme'],
            'premiereCommunion' => $user->premiere_communion ?? $defaults['premiereCommunion'],
            'dateCommunion' => $user->date_communion ?? $defaults['dateCommunion'],
            'confirme' => $user->confirme ?? $defaults['confirme'],
            'marieReligieusement' => $user->marie_religieusement ?? $defaults['marieReligieusement'],
            'mariageCivil' => $user->mariage_civil ?? $defaults['mariageCivil'],
            'dote' => $user->dote ?? $defaults['dote'],
            'veuf' => $user->veuf ?? $defaults['veuf'],
            'statutVie' => $user->statut_vie ?? $defaults['statutVie'],
            'relation' => $user->relation ?? $defaults['relation'],
            'adresse' => $user->adresse ?? $defaults['adresse'],
            'quartier' => $user->quartier ?? $defaults['quartier'],
            'fonction' => $user->fonction?->nom ?? $defaults['fonction'],
            'profession' => $user->profession ?? $defaults['profession'],
            'dateNaissance' => $user->date_naissance ?? $defaults['dateNaissance'],
            'photo' => $user->profile_photo_url ?? null,
            'numMembre' => $user->code_membre ?? null,
        ];
    }

    /**
     * Formate les liens de pagination pour correspondre à ce que le composant attend.
     */
    protected function formatPaginationLinks(LengthAwarePaginator $paginator): array
    {
        $links = [];

        $links[] = [
            'url' => $paginator->url(1),
            'label' => '&laquo; Précédent',
            'active' => false,
        ];

        $currentPage = $paginator->currentPage();
        $lastPage = $paginator->lastPage();

        for ($i = max(1, $currentPage - 2); $i <= min($lastPage, $currentPage + 2); $i++) {
            $links[] = [
                'url' => $paginator->url($i),
                'label' => (string) $i,
                'active' => $i === $currentPage,
            ];
        }

        $links[] = [
            'url' => $paginator->url($lastPage),
            'label' => 'Suivant &raquo;',
            'active' => false,
        ];

        return $links;
    }

    /**
     * Exporte les données (Excel / PDF) – à conserver.
     */
    public function exportData(array $filters, string $roleScope)
    {
        $query = $this->buildUsersQuery($roleScope, $filters);
        $users = $query->get();

        return $users->map(fn($user) => $this->formatMemberForComponent($user))->toArray();
    }

    public function generateExcel($data)
    {
        return app('excel')->download(new AnnuaireExport($data), 'annuaire-paroisse.xlsx');
    }

    public function generatePDF($data)
    {
        $pdf = Pdf::loadView('exports.annuaire-pdf', ['data' => $data]);
        return $pdf->download('annuaire-paroisse.pdf');
    }

    /**
     * Statistiques globales (utilisé pour des widgets).
     */
    public function getStats(Request $request, string $roleScope): array
    {
        $usersColumns = Schema::getColumnListing('users');
        $hasStatus = in_array('status', $usersColumns, true);
        $hasIsActive = in_array('is_active', $usersColumns, true);

        $stats = [
            'total_users' => User::count(),
            'active_users' => $hasIsActive
                ? User::where('is_active', true)->count()
                : ($hasStatus ? User::where('status', 'active')->count() : User::count()),
            'classes_count' => Classe::where('status', 'active')->count(),
            'families_count' => Family::count(),
        ];

        $stats['by_role'] = User::selectRaw('role, COUNT(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role');

        return $stats;
    }
}