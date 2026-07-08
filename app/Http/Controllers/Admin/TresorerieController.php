<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campagne;
use App\Models\Cotisation;
use App\Models\Don;
use App\Models\Family;
use App\Models\Paiement;
use App\Services\TresorerieReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TresorerieController extends Controller
{
    public function index()
    {
        if (!Schema::hasTable('cotisations') || !Schema::hasTable('campagnes') || !Schema::hasTable('paiements') || !Schema::hasTable('dons')) {
            return Inertia::render('Admin/Tresorerie/Index', [
                'stats' => [
                    'cotisationsTotales' => 0,
                    'cotisationsPayees' => 0,
                    'cotisationsEnRetard' => 0,
                    'tauxPaiement' => 0,
                    'donsTotaux' => 0,
                    'campagnesActives' => 0,
                    'famillesActives' => 0,
                ],
                'cotisations' => [],
                'campagnes' => [],
                'paiementsRecents' => [],
            ]);
        }

        $cotisations = Cotisation::query()
            ->with(['classe:id,nom', 'creator:id,prenom,nom'])
            ->orderBy('nom')
            ->get();

        $campagnes = Campagne::query()
            ->with('classe:id,nom')
            ->orderByDesc('created_at')
            ->get();

        $dons = Don::query()
            ->with(['family:id,nom', 'user:id,prenom,nom,classe_id', 'user.classe:id,nom'])
            ->orderByDesc('date_don')
            ->get();

        // Debug: Log le nombre de dons chargés
        \Log::info('Dons chargés admin tresorerie: ' . $dons->count());

        $paiementsRecents = Paiement::query()
            ->with(['family:id,nom', 'cotisation:id,nom'])
            ->orderByDesc('date_paiement')
            ->limit(20)
            ->get();

        $cotisationsTotales = (int) $cotisations->sum('montant');
        $cotisationsPayees = (int) Paiement::query()->where('statut', Paiement::STATUT_PAYE)->sum('montant');
        $donsTotaux = (int) Don::query()->sum('montant');
        $famillesActives = (int) Family::query()->count();
        $campagnesActives = (int) $campagnes->where('statut', Campagne::STATUT_ACTIVE)->count();

        $montantAttendu = $cotisationsTotales * $famillesActives;

        $stats = [
            'cotisationsTotales' => $montantAttendu,
            'cotisationsPayees' => $cotisationsPayees,
            'cotisationsEnRetard' => max(0, $montantAttendu - $cotisationsPayees),
            'tauxPaiement' => $montantAttendu > 0 ? min(100, round(($cotisationsPayees / $montantAttendu) * 100, 2)) : 0,
            'donsTotaux' => $donsTotaux,
            'campagnesActives' => $campagnesActives,
            'famillesActives' => $famillesActives,
        ];

        return Inertia::render('Admin/Tresorerie/Index', [
            'stats' => $stats,
            'cotisations' => $cotisations->map(function (Cotisation $cotisation) {
                return [
                    'id' => $cotisation->id,
                    'nom' => $cotisation->nom,
                    'montant' => (int) $cotisation->montant,
                    'periodicite' => ucfirst(strtolower($cotisation->periodicite)),
                    'statut' => ucfirst(strtolower($cotisation->statut)),
                    'classes' => $cotisation->classe?->nom ?? 'Toutes',
                    'classe_nom' => $cotisation->classe?->nom ?? 'Toutes',
                    'created_at' => optional($cotisation->created_at)->toISOString(),
                    'created_by' => trim((string) ($cotisation->creator?->prenom ? $cotisation->creator?->prenom . ' ' : '') . ($cotisation->creator?->nom ?? '')) ?: null,
                ];
            })->values(),
            'dons' => $dons->map(function (Don $don) {
                $modeLabels = [
                    'WAVE'         => 'Wave',
                    'ORANGE'       => 'Orange Money',
                    'MOOV_CI'      => 'Moov CI',
                    'MOBILE_MONEY' => 'Mobile Money',
                    'ESPECES'      => 'Espèces',
                    'VIREMENT'     => 'Virement bancaire',
                    'CARTE'        => 'Carte bancaire',
                ];
                $isOnline = in_array($don->mode_paiement, ['WAVE', 'ORANGE', 'MOOV_CI', 'MOBILE_MONEY', 'CARTE'], true);

                return [
                    'id'              => $don->id,
                    'donor_name'      => $don->nom_donateur
                                        ?? $don->family?->nom
                                        ?? 'Anonyme',
                    'numero_donateur' => $don->numero_donateur,
                    'amount'          => (int) $don->montant,
                    'donation_date'   => optional($don->date_don)->format('d/m/Y'),
                    'donation_time'   => optional($don->created_at)->format('H:i'),
                    'treasurer_name'  => trim(($don->user?->prenom ?? '') . ' ' . ($don->user?->nom ?? '')) ?: null,
                    'class_name'      => $don->user?->classe?->nom ?? null,
                    'type'            => $don->type,
                    'mode_paiement'   => $modeLabels[$don->mode_paiement] ?? $don->mode_paiement,
                    'reference_recu'  => $don->reference_recu,
                    'note'            => $don->note,
                    'is_online'       => $isOnline,
                ];
            })->values(),
            'campagnes' => $campagnes->map(function (Campagne $campagne) {
                $progression = $campagne->objectif_montant > 0
                    ? round(($campagne->montant_collecte / $campagne->objectif_montant) * 100)
                    : 0;

                return [
                    'id' => $campagne->id,
                    'nom' => $campagne->titre,
                    'objectif' => (int) $campagne->objectif_montant,
                    'collecté' => (int) $campagne->montant_collecte,
                    'collecte' => (int) $campagne->montant_collecte,
                    'classe' => $campagne->classe?->nom ?? 'Global',
                    'statut' => $campagne->statut,
                    'progression' => $progression,
                ];
            })->values(),
            'paiementsRecents' => $paiementsRecents->map(function (Paiement $paiement) {
                return [
                    'id' => $paiement->id,
                    'famille' => $paiement->family?->nom ?? 'Famille',
                    'montant' => (int) $paiement->montant,
                    'type' => $paiement->cotisation?->nom ?? 'Paiement',
                    'date' => optional($paiement->date_paiement)->format('d/m/Y'),
                    'mode' => match ($paiement->mode_paiement) {
                        Paiement::MODE_ESPECES => 'Espèces',
                        Paiement::MODE_VIREMENT => 'Virement',
                        default => 'Mobile Money',
                    },
                    'statut' => $paiement->statut === Paiement::STATUT_PAYE ? '✓ Payé' : $paiement->statut,
                ];
            })->values(),
        ]);
    }

    public function storeCotisation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'montant' => ['required', 'integer', 'min:100'],
            'periodicite' => ['required', 'in:MENSUEL,TRIMESTRIEL,ANNUEL,UNIQUE'],
            'statut' => ['required', 'in:ACTIVE,SUSPENDUE,ANNULEE'],
            'target_scope' => ['nullable', 'in:FAMILLE,INDIVIDUELLE'],
            'classe_id' => ['nullable', 'exists:classes,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
        ]);

        $validated['target_scope'] = $validated['target_scope'] ?? Cotisation::TARGET_SCOPE_FAMILLE;

        $cotisation = Cotisation::create($validated);

        return response()->json([
            'message' => 'Cotisation créée avec succès.',
            'data' => $cotisation,
        ], 201);
    }

    public function updateCotisation(Request $request, Cotisation $cotisation): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'montant' => ['sometimes', 'integer', 'min:100'],
            'periodicite' => ['sometimes', 'in:MENSUEL,TRIMESTRIEL,ANNUEL,UNIQUE'],
            'statut' => ['sometimes', 'in:ACTIVE,SUSPENDUE,ANNULEE'],
            'target_scope' => ['sometimes', 'in:FAMILLE,INDIVIDUELLE'],
            'classe_id' => ['nullable', 'exists:classes,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
        ]);

        $cotisation->update($validated);

        return response()->json([
            'message' => 'Cotisation mise à jour.',
            'data' => $cotisation->fresh(),
        ]);
    }

    public function storeCampagne(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titre' => ['required', 'string', 'max:255'],
            'objectif_montant' => ['required', 'integer', 'min:1000'],
            'scope' => ['required', 'in:GLOBAL,CLASSE'],
            'classe_id' => ['nullable', 'exists:classes,id'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
            'statut' => ['required', 'in:ACTIVE,CLOTUREE,ANNULEE'],
        ]);

        if (($validated['scope'] ?? null) === Campagne::SCOPE_GLOBAL) {
            $validated['classe_id'] = null;
        }

        $campagne = Campagne::create($validated + ['montant_collecte' => 0]);

        return response()->json([
            'message' => 'Campagne créée avec succès.',
            'data' => $campagne,
        ], 201);
    }

    public function updateCampagne(Request $request, Campagne $campagne): JsonResponse
    {
        $validated = $request->validate([
            'titre' => ['sometimes', 'string', 'max:255'],
            'objectif_montant' => ['sometimes', 'integer', 'min:1000'],
            'scope' => ['sometimes', 'in:GLOBAL,CLASSE'],
            'classe_id' => ['nullable', 'exists:classes,id'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
            'statut' => ['sometimes', 'in:ACTIVE,CLOTUREE,ANNULEE'],
        ]);

        if (($validated['scope'] ?? null) === Campagne::SCOPE_GLOBAL) {
            $validated['classe_id'] = null;
        }

        $campagne->update($validated);

        return response()->json([
            'message' => 'Campagne mise à jour.',
            'data' => $campagne->fresh(),
        ]);
    }

    public function closeCampagne(Campagne $campagne): JsonResponse
    {
        $campagne->update([
            'statut' => Campagne::STATUT_CLOTUREE,
            'date_fin' => $campagne->date_fin ?? now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Campagne clôturée.',
            'data' => $campagne->fresh(),
        ]);
    }
    public function export(Request $request, TresorerieReportService $reportService): StreamedResponse
    {
        if (! Schema::hasTable('paiements') || ! Schema::hasTable('dons')) {
            abort(404, 'Treasury data is not available yet.');
        }

        $validated = $request->validate([
            'scope' => ['nullable', 'in:monthly,annual'],
            'month' => ['nullable', 'date_format:Y-m'],
            'year' => ['nullable', 'integer', 'digits:4', 'min:2000', 'max:2100'],
        ]);

        $period = $reportService->resolvePeriod(
            $validated['scope'] ?? 'monthly',
            $validated['month'] ?? null,
            isset($validated['year']) ? (int) $validated['year'] : null,
        );

        return $reportService->streamExcel(
            $reportService->buildReport($period),
        );
    }
}
