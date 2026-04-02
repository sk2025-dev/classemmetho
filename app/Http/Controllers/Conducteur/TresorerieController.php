<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\Campagne;
use App\Models\Cotisation;
use App\Models\Family;
use App\Models\NotificationFinanciere;
use App\Models\Paiement;
use App\Models\User;
use Carbon\Carbon;
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

        $className = $user->classe?->nom ?? 'Classe non definie';
        $classeId = $user->classe_id;

        if (!$classeId || !Schema::hasTable('cotisations') || !Schema::hasTable('campagnes') || !Schema::hasTable('paiements')) {
            return Inertia::render('Conducteur/Tresorerie/Index', [
                'classInfo' => [
                    'nom' => $className,
                    'totalFamilles' => 0,
                    'payeesAJour' => 0,
                    'enRetard' => 0,
                ],
                'stats' => [
                    'cotisationsAttendues' => 0,
                    'payeesConfirmees' => 0,
                    'tauxPaiement' => 0,
                    'donsMois' => 0,
                ],
                'famillesSuivi' => [],
                'famillesEnRetard' => [],
                'paiementsRecents' => [],
                'paiementsParFamille' => [],
                'campagnesClasse' => [],
                'collectesClasse' => [],
                'cotisationsCreees' => [],
                'fimecoSuivi' => [],
                'membresClasse' => [],
                'notificationsFinancieres' => [],
            ]);
        }

        $families = Family::query()
            ->where('classe_id', $classeId)
            ->with(['users:id,family_id,nom,prenom,role,genre,employment_status'])
            ->get();

        $familyIds = $families->pluck('id');

        $cotisationsFamiliales = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->where(function ($query) {
                $query->whereNull('target_scope')
                    ->orWhere('target_scope', Cotisation::TARGET_SCOPE_FAMILLE);
            })
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $classeId);
            })
            ->get();

        $cotisationUnit = (int) $cotisationsFamiliales->sum('montant');
        $cotisationsAttendues = $cotisationUnit * max(0, $families->count());

        $payeesConfirmees = (int) Paiement::query()
            ->whereIn('family_id', $familyIds)
            ->whereIn('cotisation_id', $cotisationsFamiliales->pluck('id'))
            ->sum('montant');

        $paidByFamily = Paiement::query()
            ->select('family_id', DB::raw('SUM(montant) as total_paye'))
            ->whereIn('family_id', $familyIds)
            ->whereIn('cotisation_id', $cotisationsFamiliales->pluck('id'))
            ->groupBy('family_id')
            ->pluck('total_paye', 'family_id');

        $famillesSuivi = $families->map(function (Family $family) use ($paidByFamily, $cotisationUnit) {
            $paid = (int) ($paidByFamily[$family->id] ?? 0);
            $due = max(0, $cotisationUnit - $paid);

            return [
                'id' => $family->id,
                'nom' => $family->nom,
                'membersCount' => $family->users->count(),
                'totalPaye' => $paid,
                'totalDu' => $due,
                'statut' => $due === 0 ? 'A JOUR' : 'EN RETARD',
            ];
        })->values();

        $famillesEnRetard = $famillesSuivi
            ->filter(fn($item) => $item['totalDu'] > 0)
            ->map(function ($item) {
                return [
                    'id' => $item['id'],
                    'nom' => $item['nom'],
                    'montantDu' => $item['totalDu'],
                    'daysEnRetard' => 0,
                    'dernier' => 'A verifier',
                ];
            })
            ->values();

        $paiementsRecents = Paiement::query()
            ->whereIn('family_id', $familyIds)
            ->with(['family:id,nom', 'cotisation:id,nom'])
            ->orderByDesc('date_paiement')
            ->limit(20)
            ->get()
            ->map(function (Paiement $paiement) {
                return [
                    'id' => $paiement->id,
                    'famille' => $paiement->family?->nom ?? 'Famille',
                    'cotisation' => $paiement->cotisation?->nom ?? '-',
                    'montant' => (int) $paiement->montant,
                    'date' => optional($paiement->date_paiement)->format('d/m/Y'),
                    'mode' => match ($paiement->mode_paiement) {
                        Paiement::MODE_ESPECES => 'Especes',
                        Paiement::MODE_VIREMENT => 'Virement',
                        default => 'Mobile Money',
                    },
                    'recu' => $paiement->reference_recu,
                ];
            })
            ->values();

        $paiementsParFamille = Paiement::query()
            ->whereIn('family_id', $familyIds)
            ->with(['family:id,nom', 'cotisation:id,nom', 'user:id,nom,prenom'])
            ->orderByDesc('date_paiement')
            ->limit(100)
            ->get()
            ->map(function (Paiement $paiement) {
                return [
                    'id' => $paiement->id,
                    'famille' => $paiement->family?->nom ?? 'Famille',
                    'membre' => trim(($paiement->user?->prenom ?? '') . ' ' . ($paiement->user?->nom ?? '')),
                    'cotisation' => $paiement->cotisation?->nom ?? '-',
                    'montant' => (int) $paiement->montant,
                    'mode' => $paiement->mode_paiement,
                    'date' => optional($paiement->date_paiement)->format('d/m/Y'),
                    'reference' => $paiement->reference_recu,
                ];
            })
            ->values();

        $campagnesClasse = Campagne::query()
            ->where('scope', Campagne::SCOPE_CLASSE)
            ->where('classe_id', $classeId)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Campagne $campagne) {
                return [
                    'id' => $campagne->id,
                    'nom' => $campagne->titre,
                    'objectif' => (int) $campagne->objectif_montant,
                    'collecte' => (int) $campagne->montant_collecte,
                    'progression' => $campagne->objectif_montant > 0
                        ? round(($campagne->montant_collecte / $campagne->objectif_montant) * 100)
                        : 0,
                    'statut' => $campagne->statut,
                ];
            })
            ->values();

        $collectesClasse = $campagnesClasse;

        $cotisationsCreees = Cotisation::query()
            ->where('classe_id', $classeId)
            ->where('created_by', $user->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Cotisation $cotisation) {
                return [
                    'id' => $cotisation->id,
                    'nom' => $cotisation->nom,
                    'montant' => (int) $cotisation->montant,
                    'periodicite' => $cotisation->periodicite,
                    'target_scope' => $cotisation->target_scope ?? Cotisation::TARGET_SCOPE_FAMILLE,
                    'target_genders' => $cotisation->target_genders ?? [],
                    'target_employment_statuses' => $cotisation->target_employment_statuses ?? [],
                    'target_rules' => $cotisation->target_rules ?? [],
                    'statut' => $cotisation->statut,
                    'description' => $cotisation->description,
                    'date_debut' => optional($cotisation->date_debut)->format('Y-m-d'),
                    'date_fin' => optional($cotisation->date_fin)->format('Y-m-d'),
                    'date_echeance' => optional($cotisation->date_echeance)->format('Y-m-d'),
                    'late_after_days' => (int) ($cotisation->late_after_days ?? 2),
                ];
            })
            ->values();

        $cotisationsPaiement = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $classeId);
            })
            ->orderBy('nom')
            ->get()
            ->map(function (Cotisation $cotisation) {
                return [
                    'id' => $cotisation->id,
                    'nom' => $cotisation->nom,
                    'target_scope' => $cotisation->target_scope ?? Cotisation::TARGET_SCOPE_FAMILLE,
                    'montant' => (int) $cotisation->montant,
                    'target_rules' => $cotisation->target_rules ?? [],
                    'target_genders' => $cotisation->target_genders ?? [],
                    'target_employment_statuses' => $cotisation->target_employment_statuses ?? [],
                    'date_echeance' => optional($cotisation->date_echeance)->format('Y-m-d'),
                    'late_after_days' => (int) ($cotisation->late_after_days ?? 2),
                ];
            })
            ->values();

        $membresClasse = User::query()
            ->where('classe_id', $classeId)
            ->whereIn('role', ['membre_famille', 'responsable_famille'])
            ->with('family:id,nom')
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get();

        $cotisationsIndividuelles = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->where('target_scope', Cotisation::TARGET_SCOPE_INDIVIDUELLE)
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $classeId);
            })
            ->get();

        $cotisationIndividuelleTotal = (int) $cotisationsIndividuelles->sum('montant');
        $memberIds = $membresClasse->pluck('id');
        $paiementsByMember = Paiement::query()
            ->select('user_id', DB::raw('SUM(montant) as total_paye'))
            ->whereIn('family_id', $familyIds)
            ->whereIn('user_id', $memberIds)
            ->whereIn('cotisation_id', $cotisationsIndividuelles->pluck('id'))
            ->groupBy('user_id')
            ->pluck('total_paye', 'user_id');

        $membresClasseData = $membresClasse->map(function (User $member) use ($paiementsByMember, $cotisationIndividuelleTotal) {
            $paid = (int) ($paiementsByMember[$member->id] ?? 0);
            $due = max(0, $cotisationIndividuelleTotal - $paid);

            return [
                'id' => $member->id,
                'nom' => trim(($member->prenom ?? '') . ' ' . ($member->nom ?? '')),
                'famille' => $member->family?->nom ?? 'Sans famille',
                'role' => $member->role,
                'genre' => $member->genre,
                'employment_status' => $member->employment_status,
                'statut' => $due === 0 ? 'A JOUR' : 'EN ATTENTE',
                'totalPaye' => $paid,
                'totalDu' => $due,
            ];
        })->values();

        $fimeco = Cotisation::query()
            ->where('nom', 'FIMECO')
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $classeId);
            })
            ->orderByDesc('id')
            ->first();

        $fimecoSuivi = $membresClasse->map(function (User $member) use ($fimeco) {
            $paid = 0;
            if ($fimeco && $member->family_id) {
                $paid = (int) Paiement::query()
                    ->where('family_id', $member->family_id)
                    ->where('cotisation_id', $fimeco->id)
                    ->sum('montant');
            }

            $target = (int) ($fimeco?->montant ?? 0);
            $due = max(0, $target - $paid);

            return [
                'user_id' => $member->id,
                'nom' => trim(($member->prenom ?? '') . ' ' . ($member->nom ?? '')),
                'famille' => $member->family?->nom ?? 'Sans famille',
                'montant_cible' => $target,
                'montant_paye' => $paid,
                'montant_restant' => $due,
                'statut' => $due === 0 ? 'A JOUR' : 'EN RETARD',
            ];
        })->values();

        $notificationsFinancieres = NotificationFinanciere::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(function (NotificationFinanciere $notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'titre' => $notification->titre,
                    'message' => $notification->message,
                    'lue' => (bool) $notification->lue,
                    'date' => optional($notification->created_at)->format('d/m/Y H:i'),
                ];
            })
            ->values();

        $payeesAJour = max(0, $families->count() - $famillesEnRetard->count());

        return Inertia::render('Conducteur/Tresorerie/Index', [
            'classInfo' => [
                'nom' => $className,
                'totalFamilles' => $families->count(),
                'payeesAJour' => $payeesAJour,
                'enRetard' => $famillesEnRetard->count(),
            ],
            'stats' => [
                'cotisationsAttendues' => $cotisationsAttendues,
                'payeesConfirmees' => $payeesConfirmees,
                'tauxPaiement' => $cotisationsAttendues > 0 ? round(($payeesConfirmees / $cotisationsAttendues) * 100, 2) : 0,
                'donsMois' => 0,
            ],
            'famillesSuivi' => $famillesSuivi,
            'famillesEnRetard' => $famillesEnRetard,
            'paiementsRecents' => $paiementsRecents,
            'paiementsParFamille' => $paiementsParFamille,
            'campagnesClasse' => $campagnesClasse,
            'collectesClasse' => $collectesClasse,
            'cotisationsCreees' => $cotisationsCreees,
            'cotisationsPaiement' => $cotisationsPaiement,
            'membresClasse' => $membresClasseData,
            'fimecoSuivi' => $fimecoSuivi,
            'notificationsFinancieres' => $notificationsFinancieres,
        ]);
    }

    public function storeCotisation(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->classe_id) {
            return response()->json(['message' => 'Conducteur sans classe associee.'], 422);
        }

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'montant' => ['required', 'integer', 'min:100'],
            'periodicite' => ['required', 'in:HEBDOMADAIRE,MENSUEL,TRIMESTRIEL,ANNUEL,UNIQUE'],
            'target_scope' => ['required', 'in:FAMILLE,INDIVIDUELLE'],
            'description' => ['nullable', 'string', 'max:1000'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
            'date_echeance' => ['nullable', 'date'],
            'late_after_days' => ['nullable', 'integer', 'min:0', 'max:31'],
            'target_rules' => ['nullable', 'array'],
            'target_rules.*.type' => ['required_with:target_rules', 'in:GENRE,EMPLOI,ENFANT'],
            'target_rules.*.value' => ['nullable', 'string', 'max:50'],
            'target_rules.*.amount' => ['required_with:target_rules', 'integer', 'min:100'],
            'target_rules.*.priority' => ['nullable', 'integer', 'min:1'],
        ]);

        $rules = collect($validated['target_rules'] ?? [])
            ->map(function (array $rule, int $index) {
                return [
                    'type' => strtoupper((string) ($rule['type'] ?? '')),
                    'value' => strtoupper(trim((string) ($rule['value'] ?? ''))),
                    'amount' => (int) ($rule['amount'] ?? 0),
                    'priority' => (int) ($rule['priority'] ?? ($index + 1)),
                ];
            })
            ->filter(function (array $rule) {
                if ($rule['amount'] < 100) {
                    return false;
                }

                if ($rule['type'] === Cotisation::RULE_TYPE_ENFANT) {
                    return true;
                }

                return $rule['value'] !== '';
            })
            ->sortBy('priority')
            ->values();

        if (($validated['target_scope'] ?? '') === Cotisation::TARGET_SCOPE_INDIVIDUELLE && $rules->isEmpty()) {
            return response()->json([
                'message' => 'Ajoutez au moins une regle de ciblage pour une cotisation individuelle.',
            ], 422);
        }

        $targetGenders = $rules
            ->where('type', Cotisation::RULE_TYPE_GENRE)
            ->pluck('value')
            ->filter(fn($v) => in_array($v, ['M', 'F'], true))
            ->unique()
            ->values()
            ->all();

        $targetEmploymentStatuses = $rules
            ->where('type', Cotisation::RULE_TYPE_EMPLOI)
            ->pluck('value')
            ->filter(fn($v) => in_array($v, Cotisation::EMPLOYMENT_STATUSES, true))
            ->unique()
            ->values()
            ->all();

        $cotisation = Cotisation::create([
            'nom' => $validated['nom'],
            'montant' => $validated['montant'],
            'periodicite' => $validated['periodicite'],
            'statut' => Cotisation::STATUT_ACTIVE,
            'target_scope' => $validated['target_scope'],
            'classe_id' => $user->classe_id,
            'created_by' => $user->id,
            'description' => $validated['description'] ?? null,
            'date_debut' => $validated['date_debut'] ?? now()->toDateString(),
            'date_fin' => $validated['date_fin'] ?? null,
            'date_echeance' => $validated['date_echeance'] ?? null,
            'late_after_days' => (int) ($validated['late_after_days'] ?? 2),
            'target_rules' => $rules->all(),
            'target_genders' => $targetGenders,
            'target_employment_statuses' => $targetEmploymentStatuses,
        ]);

        return response()->json([
            'message' => 'Cotisation de classe creee avec succes.',
            'data' => $cotisation,
        ], 201);
    }

    public function updateCotisation(Request $request, Cotisation $cotisation): JsonResponse
    {
        $user = Auth::user();

        if ($cotisation->classe_id !== $user->classe_id || $cotisation->created_by !== $user->id) {
            return response()->json(['message' => 'Cotisation non modifiable.'], 403);
        }

        $validated = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'montant' => ['sometimes', 'integer', 'min:100'],
            'periodicite' => ['sometimes', 'in:HEBDOMADAIRE,MENSUEL,TRIMESTRIEL,ANNUEL,UNIQUE'],
            'target_scope' => ['sometimes', 'in:FAMILLE,INDIVIDUELLE'],
            'statut' => ['sometimes', 'in:ACTIVE,SUSPENDUE,ANNULEE'],
            'description' => ['nullable', 'string', 'max:1000'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
            'date_echeance' => ['nullable', 'date'],
            'late_after_days' => ['nullable', 'integer', 'min:0', 'max:31'],
            'target_rules' => ['nullable', 'array'],
            'target_rules.*.type' => ['required_with:target_rules', 'in:GENRE,EMPLOI,ENFANT'],
            'target_rules.*.value' => ['nullable', 'string', 'max:50'],
            'target_rules.*.amount' => ['required_with:target_rules', 'integer', 'min:100'],
            'target_rules.*.priority' => ['nullable', 'integer', 'min:1'],
        ]);

        if (array_key_exists('target_rules', $validated)) {
            $rules = collect($validated['target_rules'] ?? [])
                ->map(function (array $rule, int $index) {
                    return [
                        'type' => strtoupper((string) ($rule['type'] ?? '')),
                        'value' => strtoupper(trim((string) ($rule['value'] ?? ''))),
                        'amount' => (int) ($rule['amount'] ?? 0),
                        'priority' => (int) ($rule['priority'] ?? ($index + 1)),
                    ];
                })
                ->filter(function (array $rule) {
                    if ($rule['amount'] < 100) {
                        return false;
                    }

                    if ($rule['type'] === Cotisation::RULE_TYPE_ENFANT) {
                        return true;
                    }

                    return $rule['value'] !== '';
                })
                ->sortBy('priority')
                ->values();

            $validated['target_rules'] = $rules->all();
            $validated['target_genders'] = $rules
                ->where('type', Cotisation::RULE_TYPE_GENRE)
                ->pluck('value')
                ->filter(fn($v) => in_array($v, ['M', 'F'], true))
                ->unique()
                ->values()
                ->all();
            $validated['target_employment_statuses'] = $rules
                ->where('type', Cotisation::RULE_TYPE_EMPLOI)
                ->pluck('value')
                ->filter(fn($v) => in_array($v, Cotisation::EMPLOYMENT_STATUSES, true))
                ->unique()
                ->values()
                ->all();
        }

        $cotisation->update($validated);

        return response()->json([
            'message' => 'Cotisation mise a jour.',
            'data' => $cotisation->fresh(),
        ]);
    }

    public function destroyCotisation(Cotisation $cotisation): JsonResponse
    {
        $user = Auth::user();

        if ($cotisation->classe_id !== $user->classe_id || $cotisation->created_by !== $user->id) {
            return response()->json(['message' => 'Cotisation non supprimable.'], 403);
        }

        $cotisation->delete();

        return response()->json([
            'message' => 'Cotisation supprimee avec succes.',
        ]);
    }

    public function showCotisation(Cotisation $cotisation): JsonResponse
    {
        $user = Auth::user();

        if ($cotisation->classe_id !== $user->classe_id) {
            return response()->json(['message' => 'Acces refuse.'], 403);
        }

        return response()->json([
            'data' => [
                'id' => $cotisation->id,
                'nom' => $cotisation->nom,
                'montant' => (int) $cotisation->montant,
                'periodicite' => $cotisation->periodicite,
                'target_scope' => $cotisation->target_scope,
                'statut' => $cotisation->statut,
                'description' => $cotisation->description,
                'date_debut' => optional($cotisation->date_debut)->format('Y-m-d'),
                'date_fin' => optional($cotisation->date_fin)->format('Y-m-d'),
                'date_echeance' => optional($cotisation->date_echeance)->format('Y-m-d'),
                'late_after_days' => (int) ($cotisation->late_after_days ?? 2),
                'target_rules' => $cotisation->target_rules ?? [],
                'target_genders' => $cotisation->target_genders ?? [],
                'target_employment_statuses' => $cotisation->target_employment_statuses ?? [],
            ],
        ]);
    }

    public function storeCollecte(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->classe_id) {
            return response()->json(['message' => 'Conducteur sans classe associee.'], 422);
        }

        $validated = $request->validate([
            'titre' => ['required', 'string', 'max:255'],
            'objectif_montant' => ['required', 'integer', 'min:1000'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
        ]);

        $campagne = Campagne::create([
            'titre' => $validated['titre'],
            'objectif_montant' => $validated['objectif_montant'],
            'montant_collecte' => 0,
            'scope' => Campagne::SCOPE_CLASSE,
            'classe_id' => $user->classe_id,
            'date_debut' => $validated['date_debut'] ?? now()->toDateString(),
            'date_fin' => $validated['date_fin'] ?? null,
            'statut' => Campagne::STATUT_ACTIVE,
        ]);

        return response()->json([
            'message' => 'Collecte creee avec succes.',
            'data' => $campagne,
        ], 201);
    }

    public function storePaiement(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'cotisation_id' => ['nullable', 'exists:cotisations,id'],
            'montant' => ['required', 'integer', 'min:100'],
            'mode_paiement' => ['required', 'in:MOBILE_MONEY,ESPECES,VIREMENT'],
            'date_paiement' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $member = User::query()->findOrFail($validated['user_id']);
        if ($member->classe_id !== $user->classe_id) {
            return response()->json(['message' => 'Ce membre n\'est pas dans votre classe.'], 403);
        }

        if (!$member->family_id) {
            return response()->json(['message' => 'Ce membre n\'a pas de famille associee.'], 422);
        }

        $paymentStatus = Paiement::STATUT_PAYE;
        $resolvedCotisationId = $validated['cotisation_id'] ?? null;

        if ($resolvedCotisationId) {
            /** @var Cotisation $cotisation */
            $cotisation = Cotisation::query()->findOrFail($resolvedCotisationId);

            if ($cotisation->classe_id !== null && (int) $cotisation->classe_id !== (int) $user->classe_id) {
                return response()->json(['message' => 'Cette cotisation n\'est pas disponible dans votre classe.'], 403);
            }

            $expectedAmount = $cotisation->resolveAmountForUser($member);
            if (!$expectedAmount || $expectedAmount < 100) {
                return response()->json(['message' => 'Aucune regle de cotisation ne cible ce membre.'], 422);
            }

            $alreadyPaid = (int) Paiement::query()
                ->where('user_id', $member->id)
                ->where('cotisation_id', $cotisation->id)
                ->sum('montant');

            $remainingBefore = max(0, $expectedAmount - $alreadyPaid);
            if ($remainingBefore === 0) {
                return response()->json(['message' => 'Cette cotisation est deja reglee pour ce membre.'], 422);
            }

            if ((int) $validated['montant'] > $remainingBefore) {
                return response()->json([
                    'message' => 'Le montant depasse le reste a payer (' . number_format($remainingBefore, 0, ',', ' ') . ' F CFA).',
                ], 422);
            }

            $remainingAfter = max(0, $remainingBefore - (int) $validated['montant']);

            if ($remainingAfter > 0) {
                $isLate = false;
                if ($cotisation->date_echeance) {
                    $lateAt = Carbon::parse($cotisation->date_echeance)->addDays((int) ($cotisation->late_after_days ?? 2))->startOfDay();
                    $isLate = Carbon::parse($validated['date_paiement'])->startOfDay()->greaterThan($lateAt);
                }
                $paymentStatus = $isLate ? Paiement::STATUT_EN_RETARD : Paiement::STATUT_PARTIELLEMENT_PAYE;
            }
        }

        $paiement = Paiement::create([
            'family_id' => $member->family_id,
            'user_id' => $member->id,
            'cotisation_id' => $resolvedCotisationId,
            'montant' => $validated['montant'],
            'mode_paiement' => $validated['mode_paiement'],
            'date_paiement' => $validated['date_paiement'],
            'reference_recu' => 'RECU-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5((string) random_int(1, 9999999)), 0, 6)),
            'statut' => $paymentStatus,
            'note' => $validated['note'] ?? 'Paiement saisi par conducteur',
        ]);

        NotificationFinanciere::query()->create([
            'user_id' => $user->id,
            'type' => 'PAIEMENT_RECU',
            'entity_id' => $paiement->id,
            'entity_type' => Paiement::class,
            'titre' => 'Paiement recu',
            'message' => 'Paiement de ' . number_format((int) $paiement->montant, 0, ',', ' ') . ' F CFA enregistre pour ' . trim(($member->prenom ?? '') . ' ' . ($member->nom ?? '')),
            'lue' => false,
        ]);

        return response()->json([
            'message' => 'Paiement enregistre avec succes.',
            'data' => $paiement,
        ], 201);
    }

    public function assignTresorier(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user->classe_id) {
            return response()->json(['message' => 'Conducteur sans classe associee.'], 422);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $member = User::query()->findOrFail($validated['user_id']);

        // Vérifier que le membre est dans la même classe
        if ($member->classe_id !== $user->classe_id) {
            return response()->json(['message' => 'Ce membre n\'est pas dans votre classe.'], 403);
        }

        // Vérifier que le membre a un rôle membre_famille
        if ($member->role !== 'membre_famille') {
            return response()->json(['message' => 'Seul un membre de famille peut devenir tresorier.'], 422);
        }

        // Assigner le rôle tresorier
        $member->update(['role' => 'tresorier']);

        return response()->json([
            'message' => 'Tresorier assigne avec succes.',
            'data' => [
                'id' => $member->id,
                'nom' => $member->nom,
                'prenom' => $member->prenom,
                'role' => $member->role,
            ],
        ], 200);
    }
}
