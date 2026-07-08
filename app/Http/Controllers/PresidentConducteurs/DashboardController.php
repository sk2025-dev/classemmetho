<?php

namespace App\Http\Controllers\PresidentConducteurs;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\Classe;
use App\Models\Cotisation;
use App\Models\Don;
use App\Models\Family;
use App\Models\Paiement;
use App\Models\SondageView;
use App\Models\SpecialEvent;
use App\Models\User;
use App\Services\AnnuaireService;
use App\Services\SondageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private AnnuaireService $annuaireService,
        private SondageService $sondageService,
    ) {
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        // Types à exclure complètement (annonces générales non liturgiques)
        $excludedTypes = [
            ActeLiturgique::TYPE_ANNOUNCE,
            ActeLiturgique::TYPE_GENERALE,
        ];

        // Tous les actes en attente du Bureau (liturgiques + demandes de prières)
        $actes = ActeLiturgique::with([
            'membre.family',
            'classe',
            'family',
            'conducteur',
            'historiques.acteur',
        ])
            ->where('statut', ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR)
            ->whereNotIn('type_acte', $excludedTypes)
            ->latest()
            ->paginate(10, ['*'], 'actes_page');

        // Historique des actes traités par le bureau (paginé)
        $historiqueSearch = trim((string) $request->string('historique_search'));

        $historique = ActeLiturgiqueHistorique::with([
            'acte.membre.family',
            'acte.classe',
            'acte.family',
            'acte.conducteur',
        ])
            ->whereHas('acte', function ($q) use ($excludedTypes, $historiqueSearch) {
                $q->whereNotIn('type_acte', $excludedTypes);

                if ($historiqueSearch !== '') {
                    $q->where(function ($sq) use ($historiqueSearch) {
                        $sq->where('reference', 'like', "%{$historiqueSearch}%")
                            ->orWhereHas('membre', function ($mq) use ($historiqueSearch) {
                                $mq->where('nom', 'like', "%{$historiqueSearch}%")
                                    ->orWhere('prenom', 'like', "%{$historiqueSearch}%")
                                    ->orWhereRaw("CONCAT(prenom, ' ', nom) LIKE ?", ["%{$historiqueSearch}%"])
                                    ->orWhereRaw("CONCAT(nom, ' ', prenom) LIKE ?", ["%{$historiqueSearch}%"]);
                            });
                    });
                }
            })
            ->where('acteur_id', $user->id)
            ->whereIn('statut_nouveau', [
                ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
                ActeLiturgique::STATUT_REFUSEE_PAR_BUREAU_CONDUCTEUR,
            ])
            ->latest()
            ->paginate(10, ['*'], 'historique_page')
            ->withQueryString();

        $historique->getCollection()->transform(function ($item) {
            $acte = $item->acte;
            return [
                'id'             => $acte?->id,
                'type_acte'      => $acte?->type_acte,
                'membre'         => $acte?->membre,
                'classe'         => $acte?->classe,
                'classe_id'      => $acte?->classe_id,
                'family'         => $acte?->family ?? $acte?->membre?->family,
                'family_id'      => $acte?->family_id ?? $acte?->membre?->family_id,
                'conducteur'     => $acte?->conducteur,
                'reference'      => $acte?->reference,
                'date_souhaitee' => $acte?->date_souhaitee,
                'details'        => $acte?->details,
                'statut'         => $item->statut_nouveau,
                'commentaire'    => $item->commentaire,
                'validated_at'   => optional($item->created_at)->toISOString(),
            ];
        });

        // Stats globales (incluant les demandes de prières)
        $pendingCount = ActeLiturgique::where('statut', ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR)
            ->whereNotIn('type_acte', $excludedTypes)
            ->count();

        $validatedCount = ActeLiturgiqueHistorique::where('acteur_id', $user->id)
            ->where('statut_nouveau', ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR)
            ->count();

        $refusedCount = ActeLiturgiqueHistorique::where('acteur_id', $user->id)
            ->where('statut_nouveau', ActeLiturgique::STATUT_REFUSEE_PAR_BUREAU_CONDUCTEUR)
            ->count();

        $annuaire = $this->annuaireService->getAnnuaireData($request, 'bureau_conducteur');
        $tresorerie = $this->buildTresorerieData();

        return Inertia::render('PresidentConducteurs/Dashboard', [
            'actes'             => $actes,
            'historique'        => $historique,
            'pendingCount'      => $pendingCount,
            'validatedCount'    => $validatedCount,
            'refusedCount'      => $refusedCount,
            'classesPresence'   => $this->buildClassesPresence(),
            'classesProgrammes' => $this->buildClassesProgrammes(),

            // Annuaire (lecture seule, identique à la vue Pasteur)
            'members'       => $annuaire['members'],
            'families'      => $annuaire['families'],
            'classes'       => $annuaire['classes'],
            'view'          => $annuaire['view'],
            'cotisations'   => $annuaire['cotisations'],
            'annuaireUser'  => $annuaire['user'],
            'filters'       => $annuaire['filters'],
            'filterOptions' => $annuaire['filterOptions'],

            // Trésorerie
            'globalStats'          => $tresorerie['globalStats'],
            'tresorerieClasses'    => $tresorerie['classes'],
            'cotisationsParClasse' => $tresorerie['cotisationsParClasse'],
            'encouragements'       => $tresorerie['encouragements'],

            // Flash info
            'flashInfos' => $this->buildFlashInfoData(),

            // Sondages
            'sondages'      => $this->sondageService->getAllSondages(),
            'seenSurveyIds' => SondageView::query()
                ->where('user_id', Auth::id())
                ->pluck('sondage_id')
                ->all(),
        ]);
    }

    /**
     * Publie un message d'encouragement (FIMECO/cotisations) dans le flash info.
     */
    public function storeEncouragement(Request $request)
    {
        $request->validate([
            'message' => 'required|string|min:10|max:500',
        ]);

        ActeLiturgique::create([
            'type_acte'        => 'generale',
            'statut'           => 'PUBLIEE',
            'est_annonce'      => true,
            'details'          => [
                'titre'   => 'Encouragement cotisation',
                'contenu' => $request->message,
            ],
            'date_publication' => now(),
            'publiee_par'      => Auth::id(),
            'created_by'       => Auth::id(),
            'reference'        => 'ENC-' . now()->format('Ymd-His') . '-' . random_int(100, 999),
        ]);

        return redirect()
            ->route('president_conducteurs.dashboard')
            ->with('success', 'Encouragement publié dans le flash info !');
    }

    /**
     * Publie un flash info ciblé (tous, conducteurs, responsables de famille ou pasteur uniquement).
     */
    public function storeFlashInfo(Request $request)
    {
        $validated = $request->validate([
            'titre'       => 'required|string|max:150',
            'message'     => 'required|string|min:5|max:1000',
            'target_role' => 'required|in:' . implode(',', ActeLiturgique::TARGET_ROLES),
        ]);

        ActeLiturgique::create([
            'type_acte'        => ActeLiturgique::TYPE_GENERALE,
            'statut'           => ActeLiturgique::STATUT_PUBLIEE,
            'est_annonce'      => true,
            'target_role'      => $validated['target_role'],
            'details'          => [
                'titre'   => $validated['titre'],
                'contenu' => $validated['message'],
                'source'  => 'flash_info',
            ],
            'date_publication' => now(),
            'publiee_par'      => Auth::id(),
            'created_by'       => Auth::id(),
            'reference'        => 'FLASH-' . now()->format('Ymd-His') . '-' . random_int(100, 999),
        ]);

        return redirect()
            ->route('president_conducteurs.dashboard')
            ->with('success', 'Flash info publié !');
    }

    /**
     * Modifie un flash info publié par le président des conducteurs (sans validation).
     */
    public function updateFlashInfo(Request $request, ActeLiturgique $flashInfo)
    {
        abort_unless($flashInfo->created_by === Auth::id(), 403);

        $validated = $request->validate([
            'titre'       => 'required|string|max:150',
            'message'     => 'required|string|min:5|max:1000',
            'target_role' => 'required|in:' . implode(',', ActeLiturgique::TARGET_ROLES),
        ]);

        $details = $flashInfo->details ?? [];
        $details['titre'] = $validated['titre'];
        $details['contenu'] = $validated['message'];

        $flashInfo->update([
            'target_role' => $validated['target_role'],
            'details'     => $details,
        ]);

        return redirect()
            ->route('president_conducteurs.dashboard')
            ->with('success', 'Flash info mis à jour !');
    }

    /**
     * Supprime un flash info publié par le président des conducteurs.
     */
    public function destroyFlashInfo(ActeLiturgique $flashInfo)
    {
        abort_unless($flashInfo->created_by === Auth::id(), 403);

        $flashInfo->delete();

        return redirect()
            ->route('president_conducteurs.dashboard')
            ->with('success', 'Flash info supprimé !');
    }

    /**
     * Liste des flash infos publiés par le président des conducteurs.
     */
    private function buildFlashInfoData(): array
    {
        return ActeLiturgique::query()
            ->where('created_by', Auth::id())
            ->where('type_acte', ActeLiturgique::TYPE_GENERALE)
            ->where('details->source', 'flash_info')
            ->latest()
            ->limit(50)
            ->get(['id', 'details', 'target_role', 'statut', 'created_at'])
            ->map(fn (ActeLiturgique $a) => [
                'id'          => $a->id,
                'titre'       => $a->details['titre'] ?? '',
                'message'     => $a->details['contenu'] ?? '',
                'target_role' => $a->target_role ?? ActeLiturgique::TARGET_ALL,
                'created_at'  => optional($a->created_at)->format('d/m/Y H:i'),
            ])
            ->all();
    }

    /**
     * Statistiques de trésorerie (FIMECO, cotisations par classe, encouragements).
     */
    private function buildTresorerieData(): array
    {
        if (! Schema::hasTable('paiements') || ! Schema::hasTable('dons') || ! Schema::hasTable('cotisations')) {
            return [
                'globalStats' => [
                    'cotisationsTotales' => 0,
                    'cotisationsPayees'  => 0,
                    'tauxPaiement'       => 0,
                    'donsTotaux'         => 0,
                    'cotisationsActives' => 0,
                    'famillesActives'    => 0,
                ],
                'classes'              => [],
                'cotisationsParClasse' => [],
                'encouragements'       => [],
            ];
        }

        $classes  = Classe::query()->orderBy('nom')->get();
        $families = Family::query()->get();

        $globalCotisationsTotales = (int) Paiement::query()->sum('montant');
        $donsTotaux               = (int) Don::query()->sum('montant');
        $famillesActives          = (int) $families->count();

        $classRows = $classes->map(function (Classe $classe) {
            $famillesClasse = Family::query()
                ->where('classe_id', $classe->id)
                ->select('id', 'nom', 'code_famille')
                ->get();

            $familyIds = $famillesClasse->pluck('id');
            $payeesByFamily = Paiement::query()
                ->whereIn('family_id', $familyIds)
                ->selectRaw('family_id, SUM(montant) as total')
                ->groupBy('family_id')
                ->pluck('total', 'family_id');

            $montantParFamille = 15000;
            $payeesTotal = (int) $payeesByFamily->sum();
            $expected = max(1, $famillesClasse->count()) * $montantParFamille;
            $taux = $expected > 0 ? round(($payeesTotal / $expected) * 100) : 0;

            $famillesList = $famillesClasse->map(function ($famille) use ($payeesByFamily, $montantParFamille) {
                $montantPaye = (int) $payeesByFamily->get($famille->id, 0);
                return [
                    'id'           => $famille->id,
                    'nom'          => $famille->nom,
                    'code_famille' => $famille->code_famille ?? null,
                    'montant_paye' => $montantPaye,
                    'solde'        => $montantPaye >= $montantParFamille,
                ];
            })->values()->toArray();

            return [
                'nom'          => $classe->nom,
                'taux'         => max(0, min(100, $taux)),
                'familles'     => $famillesClasse->count(),
                'cotisations'  => $expected,
                'payees'       => $payeesTotal,
                'famillesList' => $famillesList,
            ];
        })->values();

        $cotisationsParClasse = Cotisation::query()
            ->with(['classe:id,nom', 'creator:id,nom,prenom,role'])
            ->whereNotNull('classe_id')
            ->whereHas('creator', function ($query) {
                $query->where('role', 'conducteur');
            })
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('classe_id')
            ->map(function ($cotisations, $classeId) {
                $famillesClasse = Family::query()
                    ->where('classe_id', $classeId)
                    ->select('id', 'nom')
                    ->get();

                $familyIds = $famillesClasse->pluck('id')->values();
                $cotisationIds = $cotisations->pluck('id')->values();

                $paiementsQuery = Paiement::query()
                    ->whereIn('cotisation_id', $cotisationIds)
                    ->with(['cotisation:id,nom', 'family:id,nom', 'user:id,nom,prenom']);

                if ($familyIds->isNotEmpty()) {
                    $paiementsQuery->where(function ($query) use ($familyIds, $classeId) {
                        $query->whereIn('family_id', $familyIds)
                            ->orWhereHas('user', function ($userQuery) use ($classeId) {
                                $userQuery->where('classe_id', $classeId);
                            });
                    });
                } else {
                    $paiementsQuery->whereHas('user', function ($userQuery) use ($classeId) {
                        $userQuery->where('classe_id', $classeId);
                    });
                }

                $paiements = $paiementsQuery->get();
                $totalPaye = (int) $paiements->sum('montant');

                $cotisationsRows = $cotisations
                    ->map(function (Cotisation $cotisation) use ($paiements) {
                        $totalCotisation = (int) $paiements
                            ->where('cotisation_id', $cotisation->id)
                            ->sum('montant');

                        return [
                            'id' => $cotisation->id,
                            'nom' => $cotisation->nom,
                            'montant' => (int) $cotisation->montant,
                            'periodicite' => $cotisation->periodicite,
                            'statut' => $cotisation->statut,
                            'createdBy' => trim((string) (($cotisation->creator?->prenom ?? '') . ' ' . ($cotisation->creator?->nom ?? ''))),
                            'createdAt' => optional($cotisation->created_at)->format('Y-m-d'),
                            'dateDebut' => optional($cotisation->date_debut)->format('Y-m-d'),
                            'dateFin' => optional($cotisation->date_fin)->format('Y-m-d'),
                            'dateEcheance' => optional($cotisation->date_echeance)->format('Y-m-d'),
                            'totalPaye' => $totalCotisation,
                        ];
                    })
                    ->values();

                $paiementsRows = $paiements
                    ->map(function (Paiement $paiement) {
                        return [
                            'id' => $paiement->id,
                            'cotisation' => $paiement->cotisation?->nom ?? '-',
                            'famille' => $paiement->family?->nom ?? '-',
                            'montant' => (int) $paiement->montant,
                            'date' => optional($paiement->date_paiement)->format('d/m/Y'),
                            'mode' => $paiement->mode_paiement,
                            'statut' => $paiement->payment_status ?? $paiement->statut,
                            'saisiPar' => trim((string) (($paiement->user?->prenom ?? '') . ' ' . ($paiement->user?->nom ?? ''))),
                        ];
                    })
                    ->values();

                $montantCibleTotal = (int) $cotisationsRows->sum('montant');

                $totalFamilles = $famillesClasse->count();
                $famillesPayeesCount = $paiements
                    ->pluck('family_id')
                    ->filter()
                    ->unique()
                    ->count();

                return [
                    'classeId' => (int) $classeId,
                    'classeNom' => $cotisations->first()?->classe?->nom ?? 'Classe',
                    'familles' => $totalFamilles,
                    'cotisationsCreees' => $cotisationsRows->count(),
                    'montantCibleTotal' => $montantCibleTotal,
                    'montantPayeTotal' => $totalPaye,
                    'tauxPaiement' => $totalFamilles > 0
                        ? max(0, min(100, round(($famillesPayeesCount / $totalFamilles) * 100)))
                        : 0,
                    'paiementsCount' => $paiementsRows->count(),
                    'cotisations' => $cotisationsRows,
                    'paiements' => $paiementsRows,
                ];
            })
            ->sortBy('classeNom')
            ->values();

        $cotisationsParClasseById = $cotisationsParClasse->keyBy(fn ($item) => (int) ($item['classeId'] ?? 0));

        $cotisationsParClasse = $classes
            ->map(function (Classe $classe) use ($cotisationsParClasseById) {
                return $cotisationsParClasseById->get($classe->id, [
                    'classeId' => (int) $classe->id,
                    'classeNom' => $classe->nom,
                    'familles' => (int) Family::query()->where('classe_id', $classe->id)->count(),
                    'cotisationsCreees' => 0,
                    'montantCibleTotal' => 0,
                    'montantPayeTotal' => 0,
                    'tauxPaiement' => 0,
                    'paiementsCount' => 0,
                    'cotisations' => [],
                    'paiements' => [],
                ]);
            })
            ->values();

        $cotisationsActives = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->whereHas('creator', fn ($query) => $query->where('role', 'conducteur'))
            ->count();

        $globalTarget = (int) $classRows->sum('cotisations');

        $globalStats = [
            'cotisationsTotales' => max(0, $globalTarget),
            'cotisationsPayees' => max(0, $globalCotisationsTotales),
            'tauxPaiement' => $globalTarget > 0 ? round(($globalCotisationsTotales / $globalTarget) * 100) : 0,
            'donsTotaux' => max(0, $donsTotaux),
            'cotisationsActives' => $cotisationsActives,
            'famillesActives' => $famillesActives,
        ];

        $encouragements = ActeLiturgique::query()
            ->where('type_acte', 'generale')
            ->where('est_annonce', true)
            ->whereNull('family_id')
            ->whereNull('membre_id')
            ->where('created_by', Auth::id())
            ->latest()
            ->limit(20)
            ->get(['id', 'details', 'statut', 'created_at', 'created_by'])
            ->map(fn ($a) => [
                'id'         => $a->id,
                'message'    => $a->details['contenu'] ?? $a->details['message'] ?? '',
                'statut'     => $a->statut,
                'created_at' => optional($a->created_at)->format('d/m/Y H:i'),
            ]);

        return [
            'globalStats'          => $globalStats,
            'classes'              => $classRows->all(),
            'cotisationsParClasse' => $cotisationsParClasse->all(),
            'encouragements'       => $encouragements->all(),
        ];
    }

    /**
     * Pour chaque classe : ses membres, les activités/programmes récents
     * et la grille de présence membre x activité.
     */
    private function buildClassesPresence(): array
    {
        if (! Schema::hasTable('classes')) {
            return [];
        }

        return Classe::query()
            ->orderBy('nom')
            ->get(['id', 'nom'])
            ->map(fn (Classe $classe) => [
                'id'         => $classe->id,
                'nom'        => $classe->nom,
                'nb_membres' => User::query()
                    ->where('classe_id', $classe->id)
                    ->whereIn('role', ['responsable_famille', 'membre_famille'])
                    ->count(),
            ])
            ->values()
            ->all();
    }

    /**
     * Pour chaque classe : son conducteur et la liste de ses programmes
     * d'activités (événements non paroissiaux).
     */
    private function buildClassesProgrammes(): array
    {
        if (! Schema::hasTable('classes') || ! Schema::hasTable('special_events')) {
            return [];
        }

        $classes = Classe::query()
            ->where(function ($q) {
                $q->where('status', 'active')->orWhereNull('status');
            })
            ->with([
                'conducteur',
                'programmes' => function ($query) {
                    $query->where('is_parish', false)
                        ->orderByDesc('start_date')
                        ->orderByDesc('start_time');
                },
            ])
            ->orderBy('nom')
            ->get();

        return $classes->map(function (Classe $classe) {
            return [
                'id'         => $classe->id,
                'nom'        => $classe->nom,
                'conducteur' => $classe->conducteur
                    ? trim(($classe->conducteur->prenom ?? '') . ' ' . ($classe->conducteur->nom ?? ''))
                    : null,
                'programmes' => $classe->programmes->map(fn (SpecialEvent $p) => [
                    'id'                => $p->id,
                    'titre'             => $p->title,
                    'date_range'        => $p->formatted_date_range,
                    'time_range'        => $p->formatted_time_range,
                    'lieu'              => $p->lieu,
                    'orateur'           => $p->orateur,
                    'moderateur'        => $p->moderateur,
                    'famille_reception' => $p->famille_reception,
                    'is_upcoming'       => $p->isUpcoming(),
                ])->values(),
            ];
        })->values()->all();
    }
}
