<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\Campagne;
use App\Models\Cotisation;
use App\Models\Don;
use App\Models\Family;
use App\Models\Notification;
use App\Models\Paiement;
use App\Models\ProjectionFinanciere;
use App\Services\PayDunyaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Paydunya\Checkout\CheckoutInvoice;
use Paydunya\Checkout\Store;
use Paydunya\Setup;

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
                'campagnesActives' => [],
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
                'campagnesActives' => [],
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
        $classeId = $family->classe_id ?? $user->classe_id;

        $cotisationsBase = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->where(function ($query) {
                $query->whereNull('target_scope')
                    ->orWhere('target_scope', Cotisation::TARGET_SCOPE_FAMILLE)
                    ->orWhere('target_scope', Cotisation::TARGET_SCOPE_INDIVIDUELLE);
            })
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id');
                if ($classeId) {
                    $query->orWhere('classe_id', $classeId);
                }
            })
            ->orderBy('nom')
            ->get();

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

        $paiementsByCotisationAndMember = Paiement::query()
            ->select('cotisation_id', 'user_id', DB::raw('SUM(montant) as total_paye'))
            ->where('family_id', $family->id)
            ->whereNotNull('cotisation_id')
            ->whereIn('user_id', $memberIds)
            ->groupBy('cotisation_id', 'user_id')
            ->get()
            ->groupBy('cotisation_id')
            ->map(function ($rows) {
                return $rows->pluck('total_paye', 'user_id');
            });

        $cotisations = $cotisationsBase->map(function (Cotisation $cotisation) use ($family, $paiements, $paiementsByCotisationAndMember) {
            $isIndividualScope = $cotisation->target_scope === Cotisation::TARGET_SCOPE_INDIVIDUELLE;

            if ($isIndividualScope) {
                $expected = (int) $family->users
                    ->sum(fn($member) => max(0, (int) $cotisation->resolveAmountForUser($member)));

                $paid = (int) $paiements
                    ->where('cotisation_id', $cotisation->id)
                    ->sum('montant');
            } else {
                $expected = (int) $cotisation->montant * max(1, $family->users->count());
                $paid = (int) $paiements
                    ->where('cotisation_id', $cotisation->id)
                    ->sum('montant');
            }

            $isFimeco = str_contains(mb_strtolower((string) $cotisation->nom), 'fimeco');

            // Montant ciblé par membre pour cette cotisation
            $amountsParMembre = $family->users->mapWithKeys(function ($member) use ($cotisation) {
                $amount = $cotisation->resolveAmountForUser($member);
                return [$member->id => $amount !== null ? (int) $amount : null];
            })->toArray();

            $paidParMembre = $family->users->mapWithKeys(function ($member) use ($cotisation, $paiementsByCotisationAndMember) {
                $paidForCotisation = (int) (($paiementsByCotisationAndMember[$cotisation->id][$member->id] ?? 0));
                return [$member->id => $paidForCotisation];
            })->toArray();

            $remainingParMembre = $family->users->mapWithKeys(function ($member) use ($amountsParMembre, $paidParMembre) {
                $amount = $amountsParMembre[$member->id] ?? null;
                if ($amount === null) {
                    return [$member->id => null];
                }

                $remaining = max(0, (int) $amount - (int) ($paidParMembre[$member->id] ?? 0));
                return [$member->id => $remaining];
            })->toArray();

            return [
                'id' => $cotisation->id,
                'nom' => $cotisation->nom,
                'montant' => (int) $cotisation->montant,
                'periodicite' => ucfirst(strtolower($cotisation->periodicite)),
                'target_scope' => $cotisation->target_scope,
                'type_finance' => $isFimeco ? 'FIMECO' : 'COTISATION',
                'statut' => $cotisation->statut === Cotisation::STATUT_ACTIVE ? 'Actif' : $cotisation->statut,
                'montant_attendu' => $expected,
                'montant_paye' => $paid,
                'montant_restant' => max(0, $expected - $paid),
                'date_echeance' => optional($cotisation->date_echeance)->format('Y-m-d'),
                'amounts_par_membre' => $amountsParMembre,
                'paid_par_membre' => $paidParMembre,
                'remaining_par_membre' => $remainingParMembre,
            ];
        })->values();

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
            ->limit(30)
            ->get()
            ->map(function (Campagne $campagne) {
                return [
                    'id' => $campagne->id,
                    'titre' => $campagne->titre,
                    'scope' => $campagne->scope,
                    'statut' => $campagne->statut,
                    'objectif' => (int) $campagne->objectif_montant,
                    'collecte' => (int) $campagne->montant_collecte,
                    'date_debut' => optional($campagne->date_debut)->format('d/m/Y'),
                    'date_fin' => optional($campagne->date_fin)->format('d/m/Y'),
                ];
            })
            ->values();

        $membres = $members->map(function ($member) use ($paiementsByMember, $cotisationsBase, $family) {
            $paid = (int) ($paiementsByMember[$member->id] ?? 0);

            // Montant total ciblé pour ce membre (selon les règles de chaque cotisation)
            $totalDuMembre = (int) $cotisationsBase->sum(function (Cotisation $cot) use ($member) {
                return max(0, (int) ($cot->resolveAmountForUser($member) ?? 0));
            });
            $remaining = max(0, $totalDuMembre - $paid);

            // Profil démographique
            $dateNaissance = $member->date_naissance
                ? \Carbon\Carbon::parse($member->date_naissance)
                : null;
            $isEnfant = $dateNaissance && $dateNaissance->age < 20;
            $genre = strtoupper((string) ($member->genre ?? ''));

            if ($isEnfant) {
                $profil = 'enfant';
                $profilLabel = 'Enfant';
            } elseif ($genre === 'F') {
                $profil = 'femme';
                $profilLabel = 'Femme';
            } elseif ($genre === 'M') {
                $profil = 'homme';
                $profilLabel = 'Homme';
            } else {
                $profil = 'inconnu';
                $profilLabel = '—';
            }

            return [
                'id'            => $member->id,
                'nom'           => trim(($member->prenom ?? '') . ' ' . ($member->nom ?? '')),
                'role'          => $member->id === $family->responsable_id ? 'Chef' : 'Membre',
                'profil'        => $profil,
                'profil_label'  => $profilLabel,
                'montant_cible' => $totalDuMembre,
                'cotisationDue' => $remaining,
                'paiements'     => $paid,
            ];
        })->values();

        $historiquePaiements = $paiements->map(function (Paiement $paiement) {
            return [
                'id' => $paiement->id,
                'cotisation_id' => $paiement->cotisation_id,
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
                'payment_status' => match ($paiement->statut) {
                    Paiement::STATUT_PAYE             => Paiement::PAYMENT_STATUS_PAYE,
                    Paiement::STATUT_PARTIELLEMENT_PAYE,
                    Paiement::STATUT_EN_RETARD        => 'PARTIEL',
                    Paiement::STATUT_ANNULE           => Paiement::PAYMENT_STATUS_ANNULE,
                    default                           => $paiement->payment_status ?? Paiement::PAYMENT_STATUS_PAYE,
                },
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

        $notifications = Notification::query()
            ->where('user_id', $user->id)
            ->latest('sent_at')
            ->limit(100)
            ->get()
            ->filter(function (Notification $n) {
                $link = (string) ($n->data['link'] ?? '');
                return !str_contains($link, 'liturgie') && !str_contains($link, 'annonce');
            })
            ->take(30)
            ->map(function (Notification $n) {
                $subject = strtolower((string) ($n->subject ?? ''));
                $type = 'info';
                if (str_contains($subject, 'validé') || str_contains($subject, 'confirmé') || str_contains($subject, 'succès')) {
                    $type = 'success';
                } elseif (str_contains($subject, 'refus') || str_contains($subject, 'échoué') || str_contains($subject, 'erreur')) {
                    $type = 'warning';
                } elseif (str_contains($subject, 'rappel') || str_contains($subject, 'échéance') || str_contains($subject, 'retard')) {
                    $type = 'warning';
                } elseif (str_contains($subject, 'annonce') || str_contains($subject, 'liturgie')) {
                    $type = 'purple';
                }
                return [
                    'id'      => $n->id,
                    'type'    => $type,
                    'titre'   => $n->subject ?? 'Notification',
                    'message' => $n->body ?? '',
                    'date'    => optional($n->sent_at)->format('d/m/Y H:i') ?? optional($n->created_at)->format('d/m/Y H:i'),
                    'lu'      => false,
                ];
            })
            ->values();

        return Inertia::render('ResponsableFamille/Tresorerie/Index', [
            'familyInfo' => [
                'id' => $family->id,
                'nom' => $family->nom,
                'chef' => trim(($user->prenom ?? '') . ' ' . ($user->nom ?? '')),
                'classe' => $family->classe?->nom ?? 'Classe non définie',
                'totalMembers' => $members->count(),
                'responsable_id' => $user->id,
            ],
            'membres' => $membres,
            'cotisations' => $cotisations,
            'campagnesActives' => $campagnesActives,
            'historiquePaiements' => $historiquePaiements,
            'donsFamille' => $donsFamille,
            'projection' => $projection,
            'notifications' => $notifications,
        ]);
    }

    public function storePaiement(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'family_id' => ['required', 'exists:families,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'cotisation_id' => ['nullable', 'exists:cotisations,id'],
            'montant' => ['required', 'integer', 'min:100'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY,ESPECES,VIREMENT'],
            'date_paiement' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $family = Family::query()
            ->where('id', $validated['family_id'])
            ->where('responsable_id', $user->id)
            ->with('users:id,family_id')
            ->first();

        if (!$family) {
            return response()->json(['message' => 'Accès refusé à cette famille.'], 403);
        }

        if (!empty($validated['user_id']) && !$family->users->pluck('id')->contains((int) $validated['user_id'])) {
            return response()->json(['message' => 'Le membre sélectionné n\'appartient pas à votre famille.'], 422);
        }

        $paymentStatus = Paiement::STATUT_PAYE;

        if (!empty($validated['cotisation_id'])) {
            /** @var Cotisation|null $cotisation */
            $cotisation = Cotisation::query()->find($validated['cotisation_id']);
            if (
                !$cotisation
                || $cotisation->statut !== Cotisation::STATUT_ACTIVE
                || ($cotisation->target_scope !== null && $cotisation->target_scope !== Cotisation::TARGET_SCOPE_FAMILLE)
            ) {
                return response()->json(['message' => 'Cette cotisation ne peut pas être payée par famille.'], 422);
            }

            if ($cotisation->classe_id !== null && (int) $cotisation->classe_id !== (int) $family->classe_id) {
                return response()->json(['message' => 'Cette cotisation n\'est pas disponible dans votre classe.'], 403);
            }

            $expectedAmount = (int) $cotisation->montant * max(1, $family->users->count());
            $alreadyPaid = (int) Paiement::query()
                ->where('family_id', $family->id)
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

            if ((int) $validated['montant'] < $remainingBefore) {
                $paymentStatus = Paiement::STATUT_PARTIELLEMENT_PAYE;
            }
        }

        $validated['reference_recu'] = 'RECU-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 6));
        $validated['statut'] = $paymentStatus;

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
        if (
            !$cotisation
            || $cotisation->statut !== Cotisation::STATUT_ACTIVE
            || ($cotisation->target_scope !== null && $cotisation->target_scope !== Cotisation::TARGET_SCOPE_FAMILLE)
        ) {
            return response()->json(
                ['message' => 'Cotisation invalide ou inactive.'],
                422
            );
        }

        if ($cotisation->classe_id !== null && (int) $cotisation->classe_id !== (int) $family->classe_id) {
            return response()->json(
                ['message' => 'Cette cotisation n\'est pas disponible dans votre classe.'],
                403
            );
        }

        if (!$family->users()->where('id', $validated['user_id'])->exists()) {
            return response()->json(
                ['message' => 'Le membre sélectionné n\'appartient pas à votre famille.'],
                422
            );
        }

        $expectedAmount = (int) $cotisation->montant * max(1, $family->users()->count());
        $alreadyPaid = (int) Paiement::query()
            ->where('family_id', $family->id)
            ->where('cotisation_id', $cotisation->id)
            ->sum('montant');

        $remainingBefore = max(0, $expectedAmount - $alreadyPaid);
        if ($remainingBefore === 0) {
            return response()->json(
                ['message' => 'Cette cotisation est déjà réglée.'],
                422
            );
        }

        if ((int) $validated['montant'] > $remainingBefore) {
            return response()->json(
                ['message' => 'Le montant dépasse le reste à payer (' . number_format($remainingBefore, 0, ',', ' ') . ' F CFA).'],
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
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Accès refusé'], 403);
            }
            return redirect('/dashboard')->with('error', 'Accès refusé');
        }

        try {
            $service = new PayDunyaService();
            $service->verifyTransaction($paiement, $request->query('token'));

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

            // Retourner JSON si c'est une requête AJAX (du modal)
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => $status === Paiement::PAYMENT_STATUS_PAYE,
                    'status' => $status,
                    'message' => $message,
                    'paiement' => [
                        'id' => $paiement->id,
                        'reference_recu' => $paiement->reference_recu,
                        'montant' => (int) $paiement->montant,
                        'payment_status' => $paiement->payment_status,
                        'cotisation_nom' => $paiement->cotisation?->nom,
                        'member_name' => trim(($paiement->user?->prenom ?? '') . ' ' . ($paiement->user?->nom ?? '')),
                        'year' => $paiement->year,
                        'date_paiement' => $paiement->date_paiement->format('d/m/Y'),
                    ],
                ], 200);
            }

            // Sinon retourner une page Inertia
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
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la vérification: ' . $e->getMessage(),
                ], 500);
            }

            return Inertia::render('ResponsableFamille/Tresorerie/PaiementResultat', [
                'message' => 'Erreur lors de la vérification: ' . $e->getMessage(),
                'success' => false,
            ]);
        }
    }

    /**
     * Initier un don libre via PayDunya
     * POST /responsable-famille/tresorerie/dons/initiate
     */
    public function initiateDonLibre(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'montant'     => ['required', 'integer', 'min:100'],
            'campagne_id' => ['nullable', 'exists:campagnes,id'],
            'note'        => ['nullable', 'string', 'max:500'],
        ]);

        $family = Family::where('responsable_id', $user->id)->first();
        $reference = 'DON-RF-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 6));

        try {
            $this->bootstrapPayDunya();

            $returnUrl = route('responsable_famille.tresorerie.dons.verify', ['ref' => $reference]);

            $invoice = new CheckoutInvoice();
            $invoice->setReturnUrl($returnUrl);
            $invoice->setCancelUrl($returnUrl . '&status=cancelled');
            $invoice->setCallbackUrl(route('paydunya.webhook'));
            $invoice->setTotalAmount((int) $validated['montant']);
            $invoice->setDescription('Don libre — ' . trim(($user->prenom ?? '') . ' ' . ($user->nom ?? '')));
            $invoice->addItem('Don libre', 1, (int) $validated['montant'], (int) $validated['montant'], 'Don depuis espace famille');
            $invoice->addCustomData('reference_recu', $reference);

            if (!$invoice->create()) {
                return response()->json([
                    'message' => 'Erreur PayDunya : ' . ($invoice->response_text ?: $invoice->response_code),
                ], 400);
            }

            $request->session()->put('don_libre_rf.' . $reference, [
                'user_id'     => $user->id,
                'family_id'   => $family?->id,
                'campagne_id' => $validated['campagne_id'] ?? null,
                'montant'     => (int) $validated['montant'],
                'note'        => $validated['note'] ?? null,
            ]);

            return response()->json([
                'redirect_url' => $invoice->getInvoiceUrl(),
                'reference'    => $reference,
            ]);
        } catch (\Throwable $e) {
            Log::error('Don libre RF init failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de l\'initialisation du paiement.'], 500);
        }
    }

    /**
     * Callback PayDunya après paiement d'un don libre
     * GET /responsable-famille/tresorerie/dons/verify
     */
    public function verifyDonLibre(Request $request)
    {
        $reference   = trim((string) $request->query('ref', ''));
        $token       = trim((string) $request->query('token', ''));
        $redirectBase = '/responsable-famille/tresorerie';

        if ($reference === '') {
            return redirect($redirectBase . '?don=error');
        }

        if (strtolower((string) $request->query('status', '')) === 'cancelled') {
            $request->session()->forget('don_libre_rf.' . $reference);
            return redirect($redirectBase . '?don=cancelled');
        }

        $pending = $request->session()->pull('don_libre_rf.' . $reference);
        if (!$pending || !$token) {
            return redirect($redirectBase . '?don=error');
        }

        try {
            $this->bootstrapPayDunya();

            $invoice      = new CheckoutInvoice();
            $confirmed    = $invoice->confirm($token);
            $gatewayStatus = strtolower((string) $invoice->getStatus());

            $isPaid = in_array($gatewayStatus, ['completed', 'paid', 'success', 'done'], true)
                || ($confirmed && !in_array($gatewayStatus, ['cancelled', 'failed', 'rejected', 'expired'], true));

            if (!$isPaid) {
                return redirect($redirectBase . '?don=failed');
            }

            Don::create([
                'family_id'       => $pending['family_id'],
                'user_id'         => $pending['user_id'],
                'campagne_id'     => $pending['campagne_id'],
                'montant'         => (int) $pending['montant'],
                'type'            => Don::TYPE_LIBRE,
                'mode_paiement'   => 'MOBILE_MONEY',
                'date_don'        => now()->toDateString(),
                'reference_recu'  => $reference,
                'note'            => $pending['note'] ?? 'Don libre en ligne — responsable famille',
            ]);

            return redirect($redirectBase . '?don=success');
        } catch (\Throwable $e) {
            Log::error('Don libre RF verify failed', ['error' => $e->getMessage(), 'reference' => $reference]);
            return redirect($redirectBase . '?don=error');
        }
    }

    private function bootstrapPayDunya(): void
    {
        $masterKey  = trim((string) config('services.paydunya.master_key', env('PAYDUNYA_MASTER_KEY', '')));
        $publicKey  = trim((string) config('services.paydunya.public_key', env('PAYDUNYA_PUBLIC_KEY', '')));
        $privateKey = trim((string) config('services.paydunya.private_key', env('PAYDUNYA_PRIVATE_KEY', '')));
        $token      = trim((string) config('services.paydunya.token', env('PAYDUNYA_TOKEN', '')));
        $mode       = trim((string) config('services.paydunya.mode', env('PAYDUNYA_MODE', 'test')));

        if (!$masterKey || !$publicKey || !$privateKey || !$token) {
            throw new \RuntimeException('Configuration PayDunya manquante.');
        }

        Setup::setMasterKey($masterKey);
        Setup::setPublicKey($publicKey);
        Setup::setPrivateKey($privateKey);
        Setup::setToken($token);
        Setup::setMode($mode === 'live' ? 'live' : 'test');

        Store::setName((string) config('app.name', 'Application'));
        Store::setTagline('Don en ligne');
        Store::setPhoneNumber('00000000');
        Store::setPostalAddress('Cocody, Abidjan');

        $appUrl = rtrim((string) config('app.url', 'http://localhost'), '/');
        Store::setWebsiteUrl($appUrl);
        Store::setLogoUrl($appUrl . '/images/logo.png');
    }
}
