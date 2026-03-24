<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Models\Campagne;
use App\Models\Cotisation;
use App\Models\Don;
use App\Models\Paiement;
use App\Services\PayDunyaService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class FinancesController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $family = $user->family;

        if (!$family) {
            return Inertia::render('MembreFamille/Finances/Index', [
                'familyInfo' => null,
                'cotisations' => [],
                'historiquePaiements' => [],
                'donsFamille' => [],
                'campagnesActives' => [],
            ]);
        }

        if (!Schema::hasTable('cotisations') || !Schema::hasTable('paiements') || !Schema::hasTable('dons')) {
            return Inertia::render('MembreFamille/Finances/Index', [
                'familyInfo' => [
                    'nom' => $family->nom,
                    'chef' => trim(($family->responsable?->prenom ?? '') . ' ' . ($family->responsable?->nom ?? '')),
                    'classe' => $family->classe?->nom ?? 'Classe non définie',
                ],
                'cotisations' => [],
                'historiquePaiements' => [],
                'donsFamille' => [],
                'campagnesActives' => [],
            ]);
        }

        $cotisationsBase = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->where(function ($query) {
                $query->whereNull('target_scope')
                    ->orWhere('target_scope', Cotisation::TARGET_SCOPE_FAMILLE)
                    ->orWhere('target_scope', Cotisation::TARGET_SCOPE_INDIVIDUELLE);
            })
            ->where(function ($query) use ($family) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $family->classe_id);
            })
            ->orderBy('nom')
            ->get();

        $paiementsFamille = Paiement::query()
            ->where('family_id', $family->id)
            ->get();

        $paiementsMembre = $paiementsFamille
            ->where('user_id', $user->id)
            ->values();

        $historiquePaiementsSource = Paiement::query()
            ->where('family_id', $family->id)
            ->where('user_id', $user->id)
            ->with('cotisation:id,nom')
            ->orderByDesc('date_paiement')
            ->get();

        $cotisations = $cotisationsBase->map(function (Cotisation $cotisation) use ($user, $paiementsFamille, $paiementsMembre) {
            $expected = $this->resolveExpectedAmountForMember($cotisation, $user);
            $isIndividualScope = $cotisation->target_scope === Cotisation::TARGET_SCOPE_INDIVIDUELLE;

            $paye = $isIndividualScope
                ? (int) $paiementsMembre->where('cotisation_id', $cotisation->id)->sum('montant')
                : (int) $paiementsFamille->where('cotisation_id', $cotisation->id)->sum('montant');

            $du = max(0, $expected - $paye);
            $isFimeco = str_contains(mb_strtolower((string) $cotisation->nom), 'fimeco');

            return [
                'id' => $cotisation->id,
                'nom' => $cotisation->nom,
                'montant' => $expected,
                'periodicite' => ucfirst(strtolower($cotisation->periodicite)),
                'target_scope' => $cotisation->target_scope,
                'type_finance' => $isFimeco ? 'FIMECO' : 'COTISATION',
                'montant_attendu' => $expected,
                'paye' => $paye,
                'du' => $du,
                'reliquat' => max(0, $paye - $expected),
                'date_echeance' => optional($cotisation->date_echeance)->format('Y-m-d'),
                'late_after_days' => (int) ($cotisation->late_after_days ?? 2),
            ];
        })->values();

        $historiquePaiements = $historiquePaiementsSource
            ->take(50)
            ->map(function (Paiement $paiement) {
                return [
                    'id' => $paiement->id,
                    'type' => $paiement->cotisation?->nom ?? 'Paiement',
                    'montant' => (int) $paiement->montant,
                    'year' => $paiement->year,
                    'date' => optional($paiement->date_paiement)->format('d/m/Y'),
                    'mode' => match ($paiement->mode_paiement) {
                        Paiement::MODE_ESPECES => 'Espèces',
                        Paiement::MODE_VIREMENT => 'Virement',
                        default => $paiement->provider ? ucfirst($paiement->provider) : 'Mobile Money',
                    },
                    'recu' => $paiement->reference_recu,
                    'payment_status' => $paiement->payment_status ?? Paiement::PAYMENT_STATUS_PAYE,
                ];
            })
            ->values();

        $donsFamille = Don::query()
            ->where('family_id', $family->id)
            ->with('campagne:id,titre')
            ->orderByDesc('date_don')
            ->limit(30)
            ->get()
            ->map(function (Don $don) {
                return [
                    'id' => $don->id,
                    'date' => optional($don->date_don)->format('d/m/Y'),
                    'montant' => (int) $don->montant,
                    'campagne' => $don->campagne?->titre ?? 'Don libre',
                    'recu' => $don->reference_recu ?? '-',
                ];
            })
            ->values();

        $campagnesActives = Campagne::query()
            ->where('statut', Campagne::STATUT_ACTIVE)
            ->where(function ($query) use ($family) {
                $query->where('scope', Campagne::SCOPE_GLOBAL)
                    ->orWhere(function ($q) use ($family) {
                        $q->where('scope', Campagne::SCOPE_CLASSE)
                            ->where('classe_id', $family->classe_id);
                    });
            })
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (Campagne $campagne) {
                $progression = $campagne->objectif_montant > 0
                    ? round(($campagne->montant_collecte / $campagne->objectif_montant) * 100)
                    : 0;

                return [
                    'id' => $campagne->id,
                    'titre' => $campagne->titre,
                    'objectif' => (int) $campagne->objectif_montant,
                    'collecte' => (int) $campagne->montant_collecte,
                    'progression' => $progression,
                ];
            })
            ->values();

        return Inertia::render('MembreFamille/Finances/Index', [
            'familyInfo' => [
                'nom' => $family->nom,
                'chef' => trim(($family->responsable?->prenom ?? '') . ' ' . ($family->responsable?->nom ?? '')),
                'classe' => $family->classe?->nom ?? 'Classe non définie',
            ],
            'cotisations' => $cotisations,
            'historiquePaiements' => $historiquePaiements,
            'donsFamille' => $donsFamille,
            'campagnesActives' => $campagnesActives,
        ]);
    }

    public function storePaiement(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'cotisation_id' => ['nullable', 'exists:cotisations,id'],
            'montant' => ['required', 'integer', 'min:100'],
            'year' => ['nullable', 'digits:4', 'numeric'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY,ESPECES,VIREMENT'],
            'provider' => ['nullable', 'in:wave,orange,mtn'],
            'date_paiement' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        if (!$user->family_id) {
            return response()->json(['message' => 'Aucune famille associée.'], 422);
        }

        $paymentStatus = Paiement::STATUT_PAYE;

        if (!empty($validated['cotisation_id'])) {
            /** @var Cotisation|null $cotisation */
            $cotisation = Cotisation::query()->find($validated['cotisation_id']);
            if (!$cotisation || !$this->isCotisationPayableByMember($cotisation, $user)) {
                return response()->json(['message' => 'Cette cotisation n\'est pas disponible pour votre profil.'], 422);
            }

            $expectedAmount = $this->resolveExpectedAmountForMember($cotisation, $user);
            $isIndividualScope = $cotisation->target_scope === Cotisation::TARGET_SCOPE_INDIVIDUELLE;

            $alreadyPaid = (int) Paiement::query()
                ->where('family_id', $user->family_id)
                ->when($isIndividualScope, fn($query) => $query->where('user_id', $user->id))
                ->where('cotisation_id', $cotisation->id)
                ->sum('montant');

            $remainingBefore = max(0, $expectedAmount - $alreadyPaid);
            if ($remainingBefore === 0) {
                return response()->json(['message' => 'Cette cotisation est déjà réglée.'], 422);
            }

            if ((int) $validated['montant'] > $remainingBefore) {
                return response()->json([
                    'message' => 'Le montant dépasse le reste à payer (' . number_format($remainingBefore, 0, ',', ' ') . ' F CFA).',
                ], 422);
            }

            $remainingAfter = max(0, $remainingBefore - (int) $validated['montant']);
            if ($remainingAfter > 0) {
                $paidAt = !empty($validated['date_paiement'])
                    ? Carbon::parse($validated['date_paiement'])
                    : null;
                $isLate = $cotisation->isLate($paidAt);
                $paymentStatus = $isLate ? Paiement::STATUT_EN_RETARD : Paiement::STATUT_PARTIELLEMENT_PAYE;
            }
        }

        $paiement = Paiement::create([
            'family_id' => $user->family_id,
            'user_id' => $user->id,
            'cotisation_id' => $validated['cotisation_id'] ?? null,
            'montant' => $validated['montant'],
            'year' => $validated['year'] ?? null,
            'mode_paiement' => $validated['mode_paiement'],
            'provider' => $validated['provider'] ?? null,
            'date_paiement' => $validated['date_paiement'],
            'reference_recu' => 'RECU-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 6)),
            'statut' => $paymentStatus,
            'payment_status' => Paiement::PAYMENT_STATUS_PAYE,
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'message' => 'Paiement enregistré avec succès.',
            'data' => $paiement,
        ], 201);
    }

    public function initiatePaiement(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->family_id) {
            return response()->json(['message' => 'Aucune famille associée.'], 422);
        }

        $validated = $request->validate([
            'cotisation_id' => ['required', 'exists:cotisations,id'],
            'montant' => ['required', 'integer', 'min:100'],
            'year' => ['required', 'digits:4', 'numeric'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY'],
            'provider' => ['required', 'in:wave,orange,mtn'],
            'date_paiement' => ['required', 'date'],
        ]);

        /** @var Cotisation|null $cotisation */
        $cotisation = Cotisation::query()->find($validated['cotisation_id']);
        if (!$cotisation || !$this->isCotisationPayableByMember($cotisation, $user)) {
            return response()->json(['message' => 'Cette cotisation n\'est pas disponible pour votre profil.'], 422);
        }

        $expectedAmount = $this->resolveExpectedAmountForMember($cotisation, $user);
        $isIndividualScope = $cotisation->target_scope === Cotisation::TARGET_SCOPE_INDIVIDUELLE;

        $alreadyPaid = (int) Paiement::query()
            ->where('family_id', $user->family_id)
            ->when($isIndividualScope, fn($query) => $query->where('user_id', $user->id))
            ->where('cotisation_id', $cotisation->id)
            ->sum('montant');

        $remainingBefore = max(0, $expectedAmount - $alreadyPaid);
        if ($remainingBefore === 0) {
            return response()->json(['message' => 'Cette cotisation est déjà réglée.'], 422);
        }

        if ((int) $validated['montant'] > $remainingBefore) {
            return response()->json([
                'message' => 'Le montant dépasse le reste à payer (' . number_format($remainingBefore, 0, ',', ' ') . ' F CFA).',
            ], 422);
        }

        $paiement = Paiement::create([
            'family_id' => $user->family_id,
            'user_id' => $user->id,
            'cotisation_id' => $validated['cotisation_id'],
            'montant' => $validated['montant'],
            'year' => $validated['year'],
            'mode_paiement' => $validated['mode_paiement'],
            'provider' => $validated['provider'],
            'date_paiement' => $validated['date_paiement'],
            'reference_recu' => 'RECU-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 6)),
            'statut' => Paiement::STATUT_EN_RETARD,
            'payment_status' => Paiement::PAYMENT_STATUS_INITIE,
        ]);

        try {
            $service = new PayDunyaService();
            $callbackUrl = route('membre_famille.finances.paiement.verify', $paiement->id);
            $result = $service->initiatePaiement($paiement, $callbackUrl);

            if (!$result['success']) {
                $paiement->delete();

                return response()->json([
                    'message' => $result['error'] ?? 'Erreur PayDunya',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Paiement initié avec succès',
                'redirect_url' => $result['redirect_url'],
                'transaction_id' => $result['transaction_id'],
                'paiement_id' => $paiement->id,
            ]);
        } catch (\Exception $e) {
            $paiement->delete();

            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function verifyPaiement(Request $request, Paiement $paiement)
    {
        $user = Auth::user();
        if ((int) $paiement->user_id !== (int) $user->id) {
            return redirect('/dashboard')->with('error', 'Accès refusé');
        }

        try {
            $service = new PayDunyaService();
            $service->verifyTransaction($paiement, $request->query('token'));

            $paiement = $paiement->fresh();
            $status = $paiement->payment_status;
            $message = match ($status) {
                Paiement::PAYMENT_STATUS_PAYE => 'Paiement confirmé avec succès',
                Paiement::PAYMENT_STATUS_ECHEC => 'Le paiement a échoué',
                Paiement::PAYMENT_STATUS_ANNULE => 'Paiement annulé',
                Paiement::PAYMENT_STATUS_EN_ATTENTE => 'En attente de confirmation',
                default => 'Statut en cours de mise à jour',
            };

            return Inertia::render('MembreFamille/Finances/PaiementResultat', [
                'paiement' => [
                    'id' => $paiement->id,
                    'reference_recu' => $paiement->reference_recu,
                    'montant' => (int) $paiement->montant,
                    'status' => $status,
                    'payment_status' => $paiement->payment_status,
                    'cotisation_nom' => $paiement->cotisation?->nom,
                    'year' => $paiement->year,
                    'date_paiement' => optional($paiement->date_paiement)->format('d/m/Y'),
                ],
                'message' => $message,
                'success' => $status === Paiement::PAYMENT_STATUS_PAYE,
            ]);
        } catch (\Exception $e) {
            return Inertia::render('MembreFamille/Finances/PaiementResultat', [
                'message' => 'Erreur lors de la vérification: ' . $e->getMessage(),
                'success' => false,
            ]);
        }
    }

    public function storeDon(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'campagne_id' => ['nullable', 'exists:campagnes,id'],
            'montant' => ['required', 'integer', 'min:100'],
            'type' => ['required', 'in:LIBRE,CAMPAGNE'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY,ESPECES,VIREMENT'],
            'date_don' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $don = Don::create([
            'family_id' => $user->family_id,
            'user_id' => $user->id,
            'campagne_id' => $validated['campagne_id'] ?? null,
            'montant' => $validated['montant'],
            'type' => $validated['type'],
            'mode_paiement' => $validated['mode_paiement'],
            'date_don' => $validated['date_don'],
            'reference_recu' => 'DON-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 6)),
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'message' => 'Don enregistré avec succès.',
            'data' => $don,
        ], 201);
    }

    private function resolveExpectedAmountForMember(Cotisation $cotisation, $user): int
    {
        if ($cotisation->target_scope === Cotisation::TARGET_SCOPE_INDIVIDUELLE) {
            return max(0, (int) $cotisation->resolveAmountForUser($user));
        }

        return max(0, (int) $cotisation->montant);
    }

    private function isCotisationPayableByMember(Cotisation $cotisation, $user): bool
    {
        if ($cotisation->statut !== Cotisation::STATUT_ACTIVE) {
            return false;
        }

        if ($cotisation->classe_id !== null && (int) $cotisation->classe_id !== (int) $user->classe_id) {
            return false;
        }

        $scope = $cotisation->target_scope;
        if ($scope === Cotisation::TARGET_SCOPE_INDIVIDUELLE) {
            return $this->resolveExpectedAmountForMember($cotisation, $user) >= 100;
        }

        return $scope === null || $scope === Cotisation::TARGET_SCOPE_FAMILLE;
    }
}
