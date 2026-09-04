<?php

namespace App\Http\Controllers\Fimeco;

use App\Http\Controllers\Controller;
use App\Models\Cotisation;
use App\Models\Family;
use App\Models\FimecoImportLog;
use App\Models\FimecoSouscription;
use App\Models\Paiement;
use App\Support\FimecoCotisation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const MIN_ANNEE = 1900;
    private const MAX_ANNEE = 2100;
    private const VERSEMENTS_PER_PAGE = 20;
    private const FAMILY_VERSEMENTS_PER_PAGE = 10;
    private const MODES_PAIEMENT = ['MOBILE_MONEY', 'ESPECES', 'VIREMENT', 'CHEQUE'];

    public function index(Request $request): Response
    {
        if (!$this->tablesAreReady()) {
            return Inertia::render('Fimeco/Index', $this->emptyPayload());
        }

        $currentYear = (int) now()->year;
        $requestedYear = $request->integer('annee');
        $year = $requestedYear >= self::MIN_ANNEE && $requestedYear <= self::MAX_ANNEE
            ? $requestedYear
            : $currentYear;

        $fimecoCotisations = $this->fimecoCotisations()->get(['id', 'nom', 'classe_id', 'statut']);
        $fimecoCotisationIds = $fimecoCotisations->pluck('id');

        $years = FimecoSouscription::query()
            ->distinct()
            ->pluck('annee')
            ->merge(
                Paiement::query()
                    ->whereIn('cotisation_id', $fimecoCotisationIds)
                    ->whereNotNull('year')
                    ->distinct()
                    ->pluck('year')
            )
            ->push($currentYear)
            ->map(fn ($value) => (int) $value)
            ->filter(fn (int $value) => $value >= self::MIN_ANNEE && $value <= self::MAX_ANNEE)
            ->unique()
            ->sortDesc()
            ->values();

        $families = Family::query()
            ->with('classe:id,nom')
            ->orderBy('nom')
            ->get(['id', 'nom', 'code_famille', 'classe_id']);

        $subscriptions = FimecoSouscription::query()
            ->where('annee', $year)
            ->get(['family_id', 'montant_souscrit', 'created_by', 'updated_at'])
            ->keyBy('family_id');

        $paidByFamily = $this->countedPaymentsQuery($fimecoCotisationIds->all())
            ->where('year', $year)
            ->selectRaw('family_id, SUM(montant) as total')
            ->groupBy('family_id')
            ->pluck('total', 'family_id')
            ->map(fn ($value) => (int) $value);

        $rows = $families->map(function (Family $family) use ($subscriptions, $paidByFamily) {
            $subscription = $subscriptions->get($family->id);
            $subscribed = (int) ($subscription?->montant_souscrit ?? 0);
            $paid = (int) ($paidByFamily->get($family->id) ?? 0);
            $remaining = max(0, $subscribed - $paid);
            $surplus = max(0, $paid - $subscribed);

            return [
                'family_id' => $family->id,
                'code_famille' => $family->code_famille,
                'famille' => $family->nom ?: 'Famille sans nom',
                'classe_id' => $family->classe_id,
                'classe' => $family->classe?->nom ?? 'Sans classe',
                'montant_souscrit' => $subscribed,
                'montant_paye' => $paid,
                'montant_restant' => $remaining,
                'surplus' => $surplus,
                'progression' => $subscribed > 0
                    ? min(100, round(($paid / $subscribed) * 100, 1))
                    : 0,
                'statut' => $subscribed === 0
                    ? 'NON_SOUSCRIT'
                    : ($remaining === 0 ? 'SOLDE' : 'EN_COURS'),
                'updated_at' => optional($subscription?->updated_at)->toISOString(),
            ];
        })->values();

        $subscribedTotal = (int) $rows->sum('montant_souscrit');
        $paidTotal = (int) $rows->sum('montant_paye');

        $classes = $rows
            ->groupBy(fn (array $row) => (string) ($row['classe_id'] ?? 'none'))
            ->map(function ($classRows) {
                $first = $classRows->first();
                $target = (int) $classRows->sum('montant_souscrit');
                $paid = (int) $classRows->sum('montant_paye');

                return [
                    'classe_id' => $first['classe_id'],
                    'classe' => $first['classe'],
                    'familles' => $classRows->count(),
                    'familles_souscrites' => $classRows->where('montant_souscrit', '>', 0)->count(),
                    'montant_souscrit' => $target,
                    'montant_paye' => $paid,
                    'montant_restant' => max(0, $target - $paid),
                    'progression' => $target > 0 ? min(100, round(($paid / $target) * 100, 1)) : 0,
                ];
            })
            ->sortBy('classe')
            ->values();

        $unclassifiedPayments = Paiement::query()
            ->whereIn('cotisation_id', $fimecoCotisationIds)
            ->whereNull('year')
            ->count();

        $versementSearch = trim((string) $request->string('versement_q'));
        $versementClasseRaw = $request->string('versement_classe_id')->toString();
        $versementMode = $request->string('versement_mode')->toString();
        $versementMode = in_array($versementMode, self::MODES_PAIEMENT, true) ? $versementMode : null;

        $versementsPaginator = $this->countedPaymentsQuery($fimecoCotisationIds->all())
            ->where('year', $year)
            ->with(['family:id,nom,code_famille,classe_id', 'family.classe:id,nom', 'cotisation:id,nom'])
            ->when($versementSearch !== '', function (Builder $query) use ($versementSearch) {
                $query->where(function (Builder $inner) use ($versementSearch) {
                    $inner->where('reference_recu', 'like', "%{$versementSearch}%")
                        ->orWhere('note', 'like', "%{$versementSearch}%")
                        ->orWhereHas('family', function (Builder $familyQuery) use ($versementSearch) {
                            $familyQuery->where('nom', 'like', "%{$versementSearch}%")
                                ->orWhere('code_famille', 'like', "%{$versementSearch}%");
                        });
                });
            })
            ->when($versementClasseRaw !== '', function (Builder $query) use ($versementClasseRaw) {
                $query->whereHas('family', function (Builder $familyQuery) use ($versementClasseRaw) {
                    if ($versementClasseRaw === 'none') {
                        $familyQuery->whereNull('classe_id');
                    } else {
                        $familyQuery->where('classe_id', (int) $versementClasseRaw);
                    }
                });
            })
            ->when($versementMode, fn (Builder $query) => $query->where('mode_paiement', $versementMode))
            ->orderByDesc('date_paiement')
            ->orderByDesc('id')
            ->paginate(self::VERSEMENTS_PER_PAGE, ['*'], 'versement_page')
            ->through(fn (Paiement $payment) => [
                'id' => $payment->id,
                'date' => optional($payment->date_paiement)->format('d/m/Y'),
                'famille' => $payment->family?->nom ?? 'Famille supprimée',
                'code_famille' => $payment->family?->code_famille,
                'classe' => $payment->family?->classe?->nom ?? 'Sans classe',
                'cotisation' => $payment->cotisation?->nom ?? 'FIMECO',
                'montant' => (int) $payment->montant,
                'mode' => $payment->mode_paiement,
                'reference' => $payment->reference_recu,
                'note' => $payment->note,
            ]);

        return Inertia::render('Fimeco/Index', [
            'importLogs' => $this->importLogs(),
            'available' => true,
            'annee' => $year,
            'annees' => $years,
            'stats' => [
                'montant_souscrit' => $subscribedTotal,
                'montant_paye' => $paidTotal,
                'montant_restant' => max(0, $subscribedTotal - $paidTotal),
                'taux_realisation' => $subscribedTotal > 0
                    ? min(100, round(($paidTotal / $subscribedTotal) * 100, 1))
                    : 0,
                'familles_total' => $rows->count(),
                'familles_souscrites' => $rows->where('montant_souscrit', '>', 0)->count(),
                'familles_soldees' => $rows->where('statut', 'SOLDE')->count(),
                'versements_sans_annee' => $unclassifiedPayments,
            ],
            'familles' => $rows,
            'classes' => $classes,
            'versements' => [
                'data' => $versementsPaginator->items(),
                'current_page' => $versementsPaginator->currentPage(),
                'last_page' => $versementsPaginator->lastPage(),
                'total' => $versementsPaginator->total(),
                'per_page' => $versementsPaginator->perPage(),
            ],
            'optionsFamilles' => $families->map(fn (Family $family) => [
                'id' => $family->id,
                'label' => trim(($family->code_famille ? $family->code_famille . ' · ' : '') . ($family->nom ?: 'Famille sans nom')),
                'classe' => $family->classe?->nom ?? 'Sans classe',
            ])->values(),
            'cotisationsFimeco' => $fimecoCotisations->map(fn (Cotisation $cotisation) => [
                'id' => $cotisation->id,
                'nom' => $cotisation->nom,
                'classe_id' => $cotisation->classe_id,
                'statut' => $cotisation->statut,
            ])->values(),
        ]);
    }

    public function storeSouscription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'family_id' => ['required', 'integer', 'exists:families,id'],
            'annee' => ['required', 'integer', 'between:' . self::MIN_ANNEE . ',' . self::MAX_ANNEE],
            'montant_souscrit' => ['required', 'integer', 'min:0'],
        ]);

        $family = Family::query()->findOrFail($validated['family_id']);

        $subscription = FimecoSouscription::query()->updateOrCreate(
            [
                'family_id' => $family->id,
                'annee' => $validated['annee'],
            ],
            [
                'classe_id' => $family->classe_id,
                'montant_souscrit' => $validated['montant_souscrit'],
                'created_by' => Auth::id(),
            ]
        );

        return response()->json([
            'message' => 'Souscription FIMECO enregistrée.',
            'data' => [
                'family_id' => $subscription->family_id,
                'annee' => $subscription->annee,
                'montant_souscrit' => $subscription->montant_souscrit,
            ],
        ]);
    }

    public function storeVersement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'family_id' => ['required', 'integer', 'exists:families,id'],
            'annee' => ['required', 'integer', 'between:' . self::MIN_ANNEE . ',' . self::MAX_ANNEE],
            'montant' => ['required', 'integer', 'min:100'],
            'date_paiement' => ['required', 'date'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY,ESPECES,VIREMENT,CHEQUE'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $family = Family::query()->findOrFail($validated['family_id']);

        // Le module est global : on garantit la cotisation FIMECO plutôt que
        // d'exiger une configuration manuelle préalable.
        FimecoCotisation::ensureGlobal(Auth::id());

        $cotisation = $this->resolveCotisationForFamily($family);

        if (!$cotisation) {
            return response()->json([
                'message' => "Aucune cotisation FIMECO active n'est configurée pour cette famille.",
            ], 422);
        }

        $payment = DB::transaction(function () use ($validated, $family, $cotisation) {
            return Paiement::query()->create([
                'family_id' => $family->id,
                'user_id' => null,
                'cotisation_id' => $cotisation->id,
                'montant' => $validated['montant'],
                'year' => $validated['annee'],
                'mode_paiement' => $validated['mode_paiement'],
                'date_paiement' => $validated['date_paiement'],
                'reference_recu' => 'FIMECO-MAN-' . now()->format('YmdHis') . '-' . strtoupper(bin2hex(random_bytes(3))),
                'statut' => Paiement::STATUT_PAYE,
                'payment_status' => Paiement::PAYMENT_STATUS_PAYE,
                'note' => $validated['note'] ?? 'Versement saisi depuis le module FIMECO global',
            ]);
        });

        return response()->json([
            'message' => 'Versement FIMECO enregistré.',
            'data' => $payment,
        ], 201);
    }

    public function ensureCotisation(): JsonResponse
    {
        $cotisation = FimecoCotisation::ensureGlobal(Auth::id());

        return response()->json([
            'message' => "Cotisation FIMECO globale active : « {$cotisation->nom} ».",
            'data' => [
                'id' => $cotisation->id,
                'nom' => $cotisation->nom,
                'statut' => $cotisation->statut,
                'classe_id' => $cotisation->classe_id,
            ],
        ]);
    }

    /**
     * Détail des versements FIMECO d'UNE famille, pour une année donnée — alimente
     * le bouton « Détails » du suivi global des familles (remplace l'ancien bouton
     * de modification directe de la souscription).
     */
    public function familyVersements(Request $request, Family $family): JsonResponse
    {
        $currentYear = (int) now()->year;
        $requestedYear = $request->integer('annee');
        $annee = $requestedYear >= self::MIN_ANNEE && $requestedYear <= self::MAX_ANNEE
            ? $requestedYear
            : $currentYear;

        $fimecoCotisationIds = $this->fimecoCotisations()->pluck('id')->all();

        $souscription = FimecoSouscription::query()
            ->where('family_id', $family->id)
            ->where('annee', $annee)
            ->value('montant_souscrit');

        $montantPaye = (int) $this->countedPaymentsQuery($fimecoCotisationIds)
            ->where('family_id', $family->id)
            ->where('year', $annee)
            ->sum('montant');

        $versementsPaginator = $this->countedPaymentsQuery($fimecoCotisationIds)
            ->where('family_id', $family->id)
            ->where('year', $annee)
            ->with('cotisation:id,nom')
            ->orderByDesc('date_paiement')
            ->orderByDesc('id')
            ->paginate(self::FAMILY_VERSEMENTS_PER_PAGE, ['*'], 'page')
            ->through(fn (Paiement $payment) => [
                'id' => $payment->id,
                'date' => optional($payment->date_paiement)->format('d/m/Y'),
                'montant' => (int) $payment->montant,
                'mode' => $payment->mode_paiement,
                'reference' => $payment->reference_recu,
                'note' => $payment->note,
                'cotisation' => $payment->cotisation?->nom ?? 'FIMECO',
            ]);

        $montantSouscrit = (int) ($souscription ?? 0);

        return response()->json([
            'family_id' => $family->id,
            'famille' => $family->nom ?: 'Famille sans nom',
            'code_famille' => $family->code_famille,
            'classe' => $family->classe?->nom ?? 'Sans classe',
            'annee' => $annee,
            'montant_souscrit' => $montantSouscrit,
            'montant_paye' => $montantPaye,
            'montant_restant' => max(0, $montantSouscrit - $montantPaye),
            'versements' => [
                'data' => $versementsPaginator->items(),
                'current_page' => $versementsPaginator->currentPage(),
                'last_page' => $versementsPaginator->lastPage(),
                'total' => $versementsPaginator->total(),
                'per_page' => $versementsPaginator->perPage(),
            ],
        ]);
    }

    private function fimecoCotisations(): Builder
    {
        return Cotisation::query()
            ->whereRaw('LOWER(nom) LIKE ?', ['%fimeco%']);
    }

    private function resolveCotisationForFamily(Family $family): ?Cotisation
    {
        return $this->fimecoCotisations()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->where(function (Builder $query) use ($family) {
                $query->whereNull('classe_id');
                if ($family->classe_id) {
                    $query->orWhere('classe_id', $family->classe_id);
                }
            })
            ->orderByRaw('CASE WHEN classe_id = ? THEN 0 WHEN classe_id IS NULL THEN 1 ELSE 2 END', [
                (int) ($family->classe_id ?? 0),
            ])
            ->orderByDesc('id')
            ->first();
    }

    private function countedPaymentsQuery(array $cotisationIds): Builder
    {
        return Paiement::query()
            ->whereIn('cotisation_id', $cotisationIds)
            ->where('statut', '!=', Paiement::STATUT_ANNULE)
            ->where(function (Builder $query) {
                $query->where('payment_status', Paiement::PAYMENT_STATUS_PAYE)
                    ->orWhere(function (Builder $legacy) {
                        $legacy->whereIn('mode_paiement', [
                            Paiement::MODE_ESPECES,
                            Paiement::MODE_VIREMENT,
                            Paiement::MODE_CHEQUE,
                        ])->where('statut', '!=', Paiement::STATUT_ANNULE);
                    })
                    ->orWhere(function (Builder $imported) {
                        $imported->where('reference_recu', 'like', 'FIMECO-%')
                            ->where('statut', Paiement::STATUT_PAYE);
                    });
            });
    }

    private function tablesAreReady(): bool
    {
        return Schema::hasTable('families')
            && Schema::hasTable('cotisations')
            && Schema::hasTable('paiements')
            && Schema::hasTable('fimeco_souscriptions');
    }

    /**
     * Journal des imports FIMECO (réussis et en échec), pour consultation.
     *
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function importLogs(): \Illuminate\Support\Collection
    {
        if (!Schema::hasTable('fimeco_import_logs')) {
            return collect();
        }

        return FimecoImportLog::query()
            ->with('user:id,nom,prenom')
            ->latest()
            ->take(25)
            ->get()
            ->map(fn (FimecoImportLog $log) => [
                'id' => $log->id,
                'type' => $log->type,
                'fichier' => $log->original_filename,
                'auteur' => $log->user
                    ? trim(($log->user->prenom ?? '') . ' ' . ($log->user->nom ?? '')) ?: null
                    : null,
                'success' => $log->success,
                'message' => $log->message,
                'created' => $log->created_count,
                'updated' => $log->updated_count,
                'duplicates' => $log->duplicate_count,
                'skipped' => $log->skipped_count,
                'errors_count' => $log->error_count,
                'errors' => array_slice($log->errors ?? [], 0, 200),
                'date' => optional($log->created_at)->toISOString(),
            ]);
    }

    private function emptyPayload(): array
    {
        return [
            'available' => false,
            'annee' => (int) now()->year,
            'annees' => [(int) now()->year],
            'stats' => [
                'montant_souscrit' => 0,
                'montant_paye' => 0,
                'montant_restant' => 0,
                'taux_realisation' => 0,
                'familles_total' => 0,
                'familles_souscrites' => 0,
                'familles_soldees' => 0,
                'versements_sans_annee' => 0,
            ],
            'familles' => [],
            'classes' => [],
            'versements' => [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'total' => 0,
                'per_page' => self::VERSEMENTS_PER_PAGE,
            ],
            'optionsFamilles' => [],
            'cotisationsFimeco' => [],
            'importLogs' => [],
        ];
    }
}
