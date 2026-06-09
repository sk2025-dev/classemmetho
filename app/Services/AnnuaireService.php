<?php

namespace App\Services;

use App\Helpers\PhotoHelper;
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
    protected ?array $usersColumns = null;
    protected array $columnExistsCache = [];
    protected bool $hasUsersProfessionColumn = false;
    protected bool $hasUsersCodeMembreColumn = false;
    protected ?User $authenticatedUser = null;

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

        $this->warmSchemaMetadata();

        $membersData = $view === 'all'
            ? $this->getMembersPaginated($request, $roleScope, $filters)
            : $this->emptyPaginatedResult($filters['perPage'] ?? 10);

        $familiesData = $view === 'families'
            ? $this->getFamiliesPaginated($request, $roleScope, $filters, $familiesPerPage)
            : $this->emptyPaginatedResult($familiesPerPage);

        $classesData = $view === 'classes'
            ? $this->getClassesPaginated($request, $roleScope, $filters, $classesPerPage)
            : $this->emptyPaginatedResult($classesPerPage);

        // Log debug pour le diagnostic
        \Log::info('[AnnuaireService] Filtres reçus', $filters);
        \Log::info('[AnnuaireService] Vue demandée', ['view' => $view]);
        \Log::info('[AnnuaireService] Résultats', [
            'members_count' => is_array($membersData['data']) ? count($membersData['data']) : 0,
            'families_count' => is_array($familiesData['data']) ? count($familiesData['data']) : 0,
            'classes_count' => is_array($classesData['data']) ? count($classesData['data']) : 0,
        ]);

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
        $paginator = $query->paginate($perPage)->withQueryString();

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
        $usersColumns = $this->getUsersColumnListing();
        $userSelectCols = array_values(array_intersect([
            'id', 'prenom', 'nom', 'telephone', 'email',
            'profile_photo_url', 'photo_path',
            'classe_id', 'family_id', 'role', 'genre',
            'date_naissance', 'code_membre', 'relation',
            'profession', 'fonction_id',
            'lieu_naissance', 'numero_cni',
            'hors_communaute', 'retrait', 'date_retrait',
        ], $usersColumns));

        $query = Family::query()
            ->select(['id', 'nom', 'code_famille', 'responsable_id', 'adresse', 'quartier'])
            ->with([
                'users' => function ($q) use ($filters, $userSelectCols) {
                    $q->select($userSelectCols)
                        ->with(['classe:id,nom', 'fonction:id,nom', 'fonctions:id,nom', 'sacrements']);
                    if (!empty($filters['search'])) {
                        $search = $filters['search'];
                        $q->where(fn($s) => $s
                            ->where('nom', 'like', "%{$search}%")
                            ->orWhere('prenom', 'like', "%{$search}%")
                            ->orWhere('telephone', 'like', "%{$search}%")
                        );
                    }
                    if (!empty($filters['role'])) {
                        $q->where('role', $filters['role']);
                    }
                },
                'responsable' => function ($q) use ($userSelectCols) {
                    $q->select($userSelectCols)
                        ->with(['classe:id,nom', 'fonction:id,nom', 'fonctions:id,nom', 'sacrements']);
                },
            ])
            ->orderBy('nom');

        if (!empty($filters['famille'])) {
            $query->where('id', $filters['famille']);
        }

        // Restriction conducteur : uniquement les familles ayant au moins un membre de ses classes
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
                $query->whereHas('users', function ($q) use ($classeIds) {
                    $q->whereIn('classe_id', $classeIds);
                });
            } else {
                $query->where('id', 0);
            }
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
                                $this->hasUsersProfessionColumn,
                                fn($inner) => $inner->orWhere('profession', 'like', "%{$search}%")
                            )
                            ->when(
                                $this->hasUsersCodeMembreColumn,
                                fn($inner) => $inner->orWhere('code_membre', 'like', "%{$search}%")
                            );
                    });
            });
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        $families = collect($paginator->items())->map(function (Family $family) {
            $formatUser = function (User $user) use ($family): array {
                $data = $this->formatMemberForComponent($user);
                // La relation family n'est pas chargée sur $user dans ce contexte ;
                // on injecte les données de la famille parente directement.
                if (empty($data['adresse']))     $data['adresse']     = $family->adresse;
                if (empty($data['quartier']))    $data['quartier']    = $family->quartier;
                if ($data['famille'] === '-')    $data['famille']     = $family->nom;
                if (empty($data['code_famille'])) $data['code_famille'] = $family->code_famille;
                $data['is_responsable'] = $user->role === 'responsable_famille';
                return $data;
            };

            $members = $family->users->map($formatUser);

            // S'assurer que le responsable figure toujours dans la liste
            if ($family->responsable_id && !$members->contains('id', $family->responsable_id)) {
                $resp = $family->responsable;
                if ($resp) {
                    $members = $members->prepend($formatUser($resp));
                }
            }

            $members = $members->unique('id')->values();

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
        $query = Classe::query()
            ->select(['id', 'nom'])
            ->with([
                'users' => function ($q) use ($roleScope, $filters) {
                    $q->select('id', 'prenom', 'nom', 'telephone', 'profile_photo_url', 'photo_path', 'classe_id', 'family_id', 'genre', 'code_membre', 'profession', 'relation', 'email', 'date_naissance', 'fonction_id')
                        ->with(['family:id,code_famille,nom', 'fonction:id,nom', 'classe:id,nom']);
                    $this->applyUserFilters($q, $filters, $roleScope);
                },
            ])
            ->where('status', 'active')
            ->orderBy('nom');

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
                                $this->hasUsersProfessionColumn,
                                fn($inner) => $inner->orWhere('profession', 'like', "%{$search}%")
                            )
                            ->when(
                                $this->hasUsersCodeMembreColumn,
                                fn($inner) => $inner->orWhere('code_membre', 'like', "%{$search}%")
                            );
                    });
            });
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        $classes = collect($paginator->items())->map(function (Classe $classe) {
            $members = $classe->users->map(function ($user) {
                return $this->formatMemberForComponent($user);
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
        $usersColumns = $this->getUsersColumnListing();
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
            'photo_path',
            'relation',
            'statut_vie',
            'lieu_naissance',
            'numero_cni',
            'hors_communaute',
            'retrait',
            'date_retrait',
            // Colonnes legacy sacrements (peuvent exister ou non selon la migration)
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
        ];

        $selectColumns = array_values(array_intersect($selectColumns, $usersColumns));

        $query = User::with([
            'classe:id,nom',
            'fonction:id,nom',
            'fonctions:id,nom',
            'family:id,code_famille,nom,adresse,quartier',
            'sacrements',
        ])
            ->select($selectColumns)
            ->where('role', '!=', 'admin');

        $this->applyUserFilters($query, $filters, $roleScope);

        $query->orderBy('nom')
            ->orderBy('prenom');

        return $query;
    }

    /**
     * Applique les filtres communs à une requête d'utilisateurs.
     */
    protected function applyUserFilters($query, array $filters, string $roleScope)
    {
        $usersColumns = $this->getUsersColumnListing();
        $identifierColumn = in_array('identifiant', $usersColumns, true)
            ? 'identifiant'
            : (in_array('identifier', $usersColumns, true) ? 'identifier' : null);

        $authUser = $this->getAuthenticatedUser();
        $authUserId = $authUser?->id;

        switch ($roleScope) {
            case 'conducteur':
                if ($authUserId !== null) {
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
                        $this->hasColumn($table, 'profession'),
                        fn($inner) => $inner->orWhere('profession', 'like', "%{$search}%")
                    )
                    ->when(
                        $this->hasColumn($table, 'code_membre'),
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
        $classes = Classe::query()
            ->select(['id', 'nom'])
            ->where('status', 'active')
            ->orderBy('nom')
            ->get()
            ->unique('nom')
            ->map(fn($c) => ['id' => $c->id, 'nom' => $c->nom])
            ->values()
            ->toArray();

        // Familles (restreint à la classe choisie si filtre classe actif)
        $familiesQuery = Family::query()
            ->select(['id', 'nom'])
            ->orderBy('nom');

        $classeFilter = $filters['classe'] ?? '';
        if ($classeFilter !== '' && $classeFilter !== null) {
            $classeId = $classeFilter;
            $familiesQuery->where(function ($q) use ($classeId) {
                $q->where('classe_id', $classeId)
                    ->orWhereHas('users', function ($uq) use ($classeId) {
                        $uq->where('classe_id', $classeId);
                    });
            });
        }

        $families = $familiesQuery
            ->get()
            ->unique('id')
            ->map(fn($f) => ['id' => $f->id, 'nom' => $f->nom])
            ->values()
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
     * Identique à l'Admin/AdministrationController pour garantir la cohérence des données.
     */
    protected function formatMemberForComponent(User $user): array
    {
        $sacrements = $user->relationLoaded('sacrements') ? $user->sacrements : null;

        $statut_marital = 'Célibataire';
        if ($sacrements) {
            if ($sacrements->est_marie)   $statut_marital = 'Marié(e)';
            elseif ($sacrements->est_divorce) $statut_marital = 'Divorcé(e)';
            elseif ($sacrements->est_veuf)    $statut_marital = 'Veuf(ve)';
        }

        return [
            // ── Identité ──
            'id'              => $user->id,
            'prenoms'         => $user->prenom,
            'nom'             => $user->nom,
            'sexe'            => $user->genre ?? 'M',
            'famille'         => $user->family?->nom ?? $user->family?->code_famille ?? '-',
            'code_famille'    => $user->family?->code_famille ?? null,
            'classeMethodiste' => $user->classe?->nom ?? '-',
            'telephone'       => $user->telephone ?? '-',
            'email'           => $user->email ?? '-',
            'numMembre'       => $user->code_membre ?? null,
            'code_membre'     => $user->code_membre ?? null,
            'relation'        => $user->relation ?? null,
            'profession'      => $user->profession ?? null,
            'niveau_etude'    => $user->niveau_etude ?? null,
            'fonction'        => $user->fonction?->nom ?? null,
            'fonctions'       => $user->relationLoaded('fonctions')
                ? $user->fonctions->pluck('nom')->filter()->values()->all()
                : [],
            'dateNaissance'   => $user->date_naissance ? $user->date_naissance->format('Y-m-d') : null,
            'lieu_naissance'  => $user->lieu_naissance ?? null,
            'numero_cni'      => $user->numero_cni ?? null,
            'adresse'         => $user->family?->adresse ?? $user->adresse ?? null,
            'quartier'        => $user->family?->quartier ?? $user->quartier ?? null,
            'photo'           => PhotoHelper::getPhotoUrl($user->photo_path, $user->prenom, $user->nom),
            'statut_marital'  => $statut_marital,
            'hors_communaute' => (bool) ($user->hors_communaute ?? false),
            'retrait'         => (bool) ($user->retrait ?? false),
            'date_retrait'    => $user->date_retrait ? $user->date_retrait->format('Y-m-d') : null,
            'statutVie'       => $user->statut_vie ?? null,

            // ── Sacrements (objet imbriqué pour normalizeMember BureauConducteur/Pasteur) ──
            'sacrements' => $sacrements ? [
                'baptise'                 => (bool) $sacrements->baptise,
                'bapteme_date'            => $sacrements->bapteme_date ? $sacrements->bapteme_date->format('Y-m-d') : null,
                'bapteme_lieu'            => $sacrements->bapteme_lieu,
                'premiere_communion'      => (bool) $sacrements->premiere_communion,
                'premiere_communion_date' => $sacrements->premiere_communion_date ? $sacrements->premiere_communion_date->format('Y-m-d') : null,
                'premiere_communion_lieu' => $sacrements->premiere_communion_lieu,
                'confirme'                => (bool) ($sacrements->confirme ?? false),
                'marie_religieusement'    => (bool) $sacrements->marie_religieusement,
                'mariage_religieux_date'  => $sacrements->mariage_religieux_date ? $sacrements->mariage_religieux_date->format('Y-m-d') : null,
                'mariage_religieux_lieu'  => $sacrements->mariage_religieux_lieu,
                'est_marie'               => (bool) $sacrements->est_marie,
                'mariage_civil_date'      => $sacrements->mariage_civil_date ? $sacrements->mariage_civil_date->format('Y-m-d') : null,
                'est_veuf'                => (bool) $sacrements->est_veuf,
                'est_divorce'             => (bool) $sacrements->est_divorce,
                'dot_effectue'            => (bool) $sacrements->dot_effectue,
            ] : null,

            // ── Champs plats (rétrocompatibilité avec anciens normalizeMember) ──
            'baptise'           => (bool) ($sacrements?->baptise           ?? $user->baptise           ?? false),
            'dateBapteme'       => $sacrements?->bapteme_date            ? $sacrements->bapteme_date->format('Y-m-d')              : ($user->date_bapteme  ?? null),
            'lieuBapteme'       => $sacrements?->bapteme_lieu            ?? $user->lieu_bapteme       ?? null,
            'premiereCommunion' => (bool) ($sacrements?->premiere_communion ?? $user->premiere_communion ?? false),
            'dateCommunion'     => $sacrements?->premiere_communion_date ? $sacrements->premiere_communion_date->format('Y-m-d')   : ($user->date_communion ?? null),
            'lieuCommunion'     => $sacrements?->premiere_communion_lieu ?? null,
            'confirme'          => (bool) ($sacrements?->confirme          ?? $user->confirme           ?? false),
            'marieReligieusement' => (bool) ($sacrements?->marie_religieusement ?? $user->marie_religieusement ?? false),
            'dateMarReligieux'  => $sacrements?->mariage_religieux_date  ? $sacrements->mariage_religieux_date->format('Y-m-d')    : null,
            'lieuMarReligieux'  => $sacrements?->mariage_religieux_lieu  ?? null,
            'mariageCivil'      => (bool) ($sacrements?->est_marie         ?? $user->mariage_civil      ?? false),
            'dateMarCivil'      => $sacrements?->mariage_civil_date      ? $sacrements->mariage_civil_date->format('Y-m-d')        : null,
            'dote'              => (bool) ($sacrements?->dot_effectue      ?? $user->dote               ?? false),
            'veuf'              => (bool) ($sacrements?->est_veuf          ?? $user->veuf               ?? false),
            'divorce'           => (bool) ($sacrements?->est_divorce       ?? false),
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
        $usersColumns = $this->getUsersColumnListing();
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

    protected function emptyPaginatedResult(int $perPage): array
    {
        return [
            'data' => [],
            'links' => [],
            'current_page' => 1,
            'per_page' => $perPage,
            'total' => 0,
        ];
    }

    protected function warmSchemaMetadata(): void
    {
        $this->getUsersColumnListing();
        $this->hasUsersProfessionColumn = $this->hasColumn('users', 'profession');
        $this->hasUsersCodeMembreColumn = $this->hasColumn('users', 'code_membre');
    }

    protected function getUsersColumnListing(): array
    {
        if ($this->usersColumns === null) {
            $this->usersColumns = Schema::getColumnListing('users');
        }

        return $this->usersColumns;
    }

    protected function hasColumn(string $table, string $column): bool
    {
        $cacheKey = $table . '.' . $column;

        if (!array_key_exists($cacheKey, $this->columnExistsCache)) {
            $this->columnExistsCache[$cacheKey] = Schema::hasColumn($table, $column);
        }

        return $this->columnExistsCache[$cacheKey];
    }

    protected function getAuthenticatedUser(): ?User
    {
        if (Auth::id() === null) {
            return null;
        }

        if ($this->authenticatedUser === null) {
            $this->authenticatedUser = Auth::user();
        }

        return $this->authenticatedUser;
    }
}
