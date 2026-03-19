<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\Cotisation;
use App\Models\Don;
use App\Models\Family;
use App\Models\Paiement;
use App\Models\ProjectionFinanciere;
use App\Services\PayDunyaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class TresorerieController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $family = Family::query()
            ->where('responsable_id', $user->id)
            ->with(['classe', 'users'])
            ->first();

        if (!$family) {
            return Inertia::render('ResponsableFamille/Tresorerie/Index', [
                'familyInfo' => null,
                'membres' => [],
                'cotisations' => [],
                'historiquePaiements' => [],
                'donsFamille' => [],
                'projection' => [
                    'expected' => 0,
                    'paid' => 0,
                    'due' => 0,
                    'payment_rate' => 0,
                ],
            ]);
        }

        if (!Schema::hasTable('cotisations') || !Schema::hasTable('paiements') || !Schema::hasTable('dons')) {
            return Inertia::render('ResponsableFamille/Tresorerie/Index', [
                'familyInfo' => [
                    'id' => $family->id,
                    'nom' => $family->nom,
                    'chef' => trim(($user->prenom ?? '') . ' ' . ($user->nom ?? '')),
                    'classe' => $family->classe?->nom ?? 'Classe non définie',
                    'totalMembers' => $family->users->count(),
                ],
                'membres' => [],
                'cotisations' => [],
                'historiquePaiements' => [],
                'donsFamille' => [],
                'projection' => [
                    'expected' => 0,
                    'paid' => 0,
                    'due' => 0,
                    'payment_rate' => 0,
                ],
            ]);
        }

        $members = $family->users;
        $memberIds = $members->pluck('id');

        $cotisationsBase = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->where(function ($query) {
                $query->whereNull('target_scope')
                    ->orWhere('target_scope', Cotisation::TARGET_SCOPE_FAMILLE);
            })
            ->where(function ($query) use ($family) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $family->classe_id);
            })
            ->orderBy('nom')
            ->get();

        $activeCotisationsTotal = (int) $cotisationsBase->sum('montant');

        $paiements = Paiement::query()
            ->where('family_id', $family->id)
            ->with(['user:id,prenom,nom', 'cotisation:id,nom'])
            ->orderByDesc('date_paiement')
            ->limit(50)
            ->get();

        $paiementsByMember = Paiement::query()
            ->select('user_id', DB::raw('SUM(montant) as total_paye'))
            ->where('family_id', $family->id)
            ->whereIn('user_id', $memberIds)
            ->groupBy('user_id')
            ->pluck('total_paye', 'user_id');

        $cotisations = $cotisationsBase->map(function (Cotisation $cotisation) use ($family, $paiements) {
            $expected = (int) $cotisation->montant * max(1, $family->users->count());
            $paid = (int) $paiements
                ->where('cotisation_id', $cotisation->id)
                ->sum('montant');

            return [
                'id' => $cotisation->id,
                'nom' => $cotisation->nom,
                'montant' => (int) $cotisation->montant,
                'periodicite' => ucfirst(strtolower($cotisation->periodicite)),
                'statut' => $cotisation->statut === Cotisation::STATUT_ACTIVE ? 'Actif' : $cotisation->statut,
                'montant_attendu' => $expected,
                'montant_paye' => $paid,
                'montant_restant' => max(0, $expected - $paid),
            ];
        });

        $membres = $members->map(function ($member) use ($paiementsByMember, $activeCotisationsTotal, $family) {
            $paid = (int) ($paiementsByMember[$member->id] ?? 0);
            $due = max(0, $activeCotisationsTotal - $paid);

            return [
                'id' => $member->id,
                'nom' => trim(($member->prenom ?? '') . ' ' . ($member->nom ?? '')),
                'role' => $member->id === $family->responsable_id ? 'Chef' : 'Membre',
                'cotisationDue' => $due,
                'paiements' => $paid,
            ];
        })->values();

        $historiquePaiements = $paiements->map(function (Paiement $paiement) {
            return [
                'id' => $paiement->id,
                'membre' => trim(($paiement->user?->prenom ?? '') . ' ' . ($paiement->user?->nom ?? '')) ?: 'Famille',
                'type' => $paiement->cotisation?->nom ?? 'Paiement libre',
                'montant' => (int) $paiement->montant,
                'year' => $paiement->year,
                'date' => optional($paiement->date_paiement)->format('d/m/Y'),
                'mode' => match ($paiement->mode_paiement) {
                    Paiement::MODE_ESPECES => 'Espèces',
                    Paiement::MODE_VIREMENT => 'Virement',
                    default => $paiement->provider ? ucfirst($paiement->provider) : 'Mobile Money',
                },
                'provider' => $paiement->provider,
                'recu' => $paiement->reference_recu,
                'payment_status' => $paiement->payment_status ?? Paiement::PAYMENT_STATUS_PAYE,
                'paydunya_reference' => $paiement->paydunya_reference,
            ];
        })->values();

        $donsFamille = Don::query()
            ->where('family_id', $family->id)
            ->with(['user:id,prenom,nom', 'campagne:id,titre'])
            ->orderByDesc('date_don')
            ->limit(20)
            ->get()
            ->map(function (Don $don) {
                return [
                    'id' => $don->id,
                    'date' => optional($don->date_don)->format('d/m/Y'),
                    'montant' => (int) $don->montant,
                    'campagne' => $don->campagne?->titre ?? 'Don libre',
                    'contributeur' => trim(($don->user?->prenom ?? '') . ' ' . ($don->user?->nom ?? '')) ?: 'Famille',
                    'recu' => $don->reference_recu ?? '-',
                ];
            })
            ->values();

        $projection = ProjectionFinanciere::summarize($cotisations, $paiements);

        return Inertia::render('ResponsableFamille/Tresorerie/Index', [
            'familyInfo' => [
                'id' => $family->id,
                'nom' => $family->nom,
                'chef' => trim(($user->prenom ?? '') . ' ' . ($user->nom ?? '')),
                'classe' => $family->classe?->nom ?? 'Classe non définie',
                'totalMembers' => $members->count(),
            ],
            'membres' => $membres,
            'cotisations' => $cotisations,
            'historiquePaiements' => $historiquePaiements,
            'donsFamille' => $donsFamille,
            'projection' => $projection,
        ]);
    }

    public function storePaiement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'family_id' => ['required', 'exists:families,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'cotisation_id' => ['nullable', 'exists:cotisations,id'],
            'montant' => ['required', 'integer', 'min:100'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY,ESPECES,VIREMENT'],
            'date_paiement' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        if (!empty($validated['cotisation_id'])) {
            $cotisation = Cotisation::query()->find($validated['cotisation_id']);
            if (!$cotisation || ($cotisation->target_scope !== null && $cotisation->target_scope !== Cotisation::TARGET_SCOPE_FAMILLE)) {
                return response()->json(['message' => 'Cette cotisation ne peut pas être payée par famille.'], 422);
            }
        }

        $validated['reference_recu'] = 'RECU-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 6));
        $validated['statut'] = Paiement::STATUT_PAYE;

        $paiement = Paiement::create($validated);

        return response()->json([
            'message' => 'Paiement enregistré avec succès.',
            'data' => $paiement,
        ], 201);
    }

    public function storeDon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'family_id' => ['nullable', 'exists:families,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'campagne_id' => ['nullable', 'exists:campagnes,id'],
            'montant' => ['required', 'integer', 'min:100'],
            'type' => ['required', 'in:LIBRE,CAMPAGNE'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY,ESPECES,VIREMENT'],
            'date_don' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['reference_recu'] = 'DON-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 6));

        $don = Don::create($validated);

        return response()->json([
            'message' => 'Don enregistré avec succès.',
            'data' => $don,
        ], 201);
    }

    /**
     * Initier un paiement PayDunya
     * POST /api/responsable-famille/tresorerie/paiements/initiate
     */
    public function initiatePaiement(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'family_id' => ['required', 'exists:families,id'],
            'user_id' => ['required', 'exists:users,id'],
            'cotisation_id' => ['required', 'exists:cotisations,id'],
            'montant' => ['required', 'integer', 'min:100'],
            'year' => ['required', 'digits:4', 'numeric'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY'],
            'provider' => ['required', 'in:wave,orange,mtn'],
            'date_paiement' => ['required', 'date'],
        ]);

        // Vérifier que c'est bien sa famille
        $family = Family::where('id', $validated['family_id'])
            ->where('responsable_id', $user->id)
            ->first();

        if (!$family) {
            return response()->json(
                ['message' => 'Accès refusé à cette famille.'],
                403
            );
        }

        // Vérifier la cotisation
        $cotisation = Cotisation::query()->find($validated['cotisation_id']);
        if (!$cotisation || $cotisation->statut !== Cotisation::STATUT_ACTIVE) {
            return response()->json(
                ['message' => 'Cotisation invalide ou inactive.'],
                422
            );
        }

        // Créer le paiement localement
        $paiement = Paiement::create([
            'family_id' => $validated['family_id'],
            'user_id' => $validated['user_id'],
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

        // Initier chez PayDunya
        try {
            $service = new PayDunyaService();
            $callbackUrl = route('responsable_famille.tresorerie.paiement.verify', $paiement->id);

            $result = $service->initiatePaiement($paiement, $callbackUrl);

            if (!$result['success']) {
                $paiement->delete();

                return response()->json(
                    ['message' => $result['error'] ?? 'Erreur PayDunya'],
                    400
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Paiement initié avec succès',
                'redirect_url' => $result['redirect_url'],
                'transaction_id' => $result['transaction_id'],
                'paiement_id' => $paiement->id,
            ], 200);
        } catch (\Exception $e) {
            $paiement->delete();

            return response()->json(
                ['message' => 'Erreur: ' . $e->getMessage()],
                500
            );
        }
    }

    /**
     * Vérifier le statut d'un paiement au retour de PayDunya
     * GET /responsable-famille/tresorerie/paiement/{id}/verify
     */
    public function verifyPaiement(Request $request, Paiement $paiement)
    {
        $user = Auth::user();

        // Vérifier l'accès
        $family = $paiement->family;
        if ($family->responsable_id !== $user->id) {
            return redirect('/dashboard')->with('error', 'Accès refusé');
        }

        try {
            $service = new PayDunyaService();
            $result = $service->verifyTransaction($paiement, $request->query('token'));

            // Rechargement du paiement pour avoir les dernières données
            $paiement = $paiement->fresh();

            $status = $paiement->payment_status;
            $message = match ($status) {
                Paiement::PAYMENT_STATUS_PAYE => 'Paiement confirmé avec succès',
                Paiement::PAYMENT_STATUS_ECHEC => 'Le paiement a échoué',
                Paiement::PAYMENT_STATUS_ANNULE => 'Paiement annulé',
                Paiement::PAYMENT_STATUS_EN_ATTENTE => 'En attente de confirmation',
                default => 'Statut inconnu',
            };

            return Inertia::render('ResponsableFamille/Tresorerie/PaiementResultat', [
                'paiement' => [
                    'id' => $paiement->id,
                    'reference_recu' => $paiement->reference_recu,
                    'montant' => (int) $paiement->montant,
                    'status' => $status,
                    'payment_status' => $paiement->payment_status,
                    'cotisation_nom' => $paiement->cotisation?->nom,
                    'member_name' => trim(($paiement->user?->prenom ?? '') . ' ' . ($paiement->user?->nom ?? '')),
                    'year' => $paiement->year,
                    'date_paiement' => $paiement->date_paiement->format('d/m/Y'),
                ],
                'message' => $message,
                'success' => $status === Paiement::PAYMENT_STATUS_PAYE,
            ]);
        } catch (\Exception $e) {
            return Inertia::render('ResponsableFamille/Tresorerie/PaiementResultat', [
                'message' => 'Erreur lors de la vérification: ' . $e->getMessage(),
                'success' => false,
            ]);
        }
    }
}
