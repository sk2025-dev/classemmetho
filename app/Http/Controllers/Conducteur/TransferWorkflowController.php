<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\ClassTransferRequest;
use App\Models\Classe;
use App\Models\Family;
use App\Models\User;
use App\Services\TransferWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TransferWorkflowController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $transferService = app(TransferWorkflowService::class);

        $pendingTransfers = ClassTransferRequest::with([
            'family',
            'user.family',
            'sourceClass',
            'targetClass',
            'validatedBySource',
            'validatedByAccueil',
            'createdBy.family',
        ])
            ->where(function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('classe_source_id', $user->classe_id)
                        ->where('statut', 'EN_ATTENTE_SOURCE');
                })
                    ->orWhere(function ($q) use ($user) {
                        $q->where('classe_cible_id', $user->classe_id)
                            ->where('statut', 'EN_ATTENTE_ACCUEIL');
                    })
                    ->orWhere(function ($q) use ($user) {
                        $q->where('validateur_source_id', $user->id)
                            ->where('statut', 'EN_ATTENTE_ACCUEIL');
                    });
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (ClassTransferRequest $transfer) => $this->transformTransfer($transfer, $user));

        $processedTransfers = ClassTransferRequest::with([
            'family',
            'user.family',
            'sourceClass',
            'targetClass',
            'validatedBySource',
            'validatedByAccueil',
            'createdBy.family',
        ])
            ->whereIn('statut', ['TERMINEE', 'REFUSEE'])
            ->where(function ($query) use ($user) {
                $query->where('validateur_source_id', $user->id)
                    ->orWhere('validateur_accueil_id', $user->id)
                    ->orWhere('createur_id', $user->id);
            })
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn (ClassTransferRequest $transfer) => $this->transformTransfer($transfer, $user));

        $classes = Classe::query()
            ->where('id', '!=', $user->classe_id)
            ->orderBy('nom')
            ->get(['id', 'nom']);

        $families = Family::query()
            ->with(['responsable:id,nom,prenom'])
            ->withCount('users')
            ->where('classe_id', $user->classe_id)
            ->orderBy('nom')
            ->get();

        $families = $transferService
            ->hydrateFamiliesTransferState($families)
            ->values()
            ->map(function (Family $family) {
                return [
                    'id' => $family->id,
                    'nom' => $family->nom,
                    'code_famille' => $family->code_famille,
                    'transfer_status' => $family->transfer_status,
                    'transfer_label' => $family->transfer_label,
                    'transfer_locked' => (bool) $family->transfer_locked,
                    'responsable' => $family->responsable
                        ? trim($family->responsable->nom . ' ' . $family->responsable->prenom)
                        : null,
                    'members_count' => $family->users_count,
                ];
            });

        $members = User::query()
            ->with(['family:id,nom,code_famille'])
            ->where('classe_id', $user->classe_id)
            ->where('role', '!=', 'conducteur')
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get([
                'id',
                'classe_id',
                'nom',
                'prenom',
                'email',
                'telephone',
                'code_membre',
                'family_id',
                'is_family_responsible',
            ]);

        $members = $transferService
            ->hydrateUsersTransferState($members)
            ->values()
            ->map(function (User $member) {
                return [
                    'id' => $member->id,
                    'classe_id' => $member->classe_id,
                    'nom' => $member->nom,
                    'prenom' => $member->prenom,
                    'email' => $member->email,
                    'telephone' => $member->telephone,
                    'code_membre' => $member->code_membre,
                    'family_id' => $member->family_id,
                    'family_name' => $member->family?->nom,
                    'family_code' => $member->family?->code_famille,
                    'transfer_status' => $member->transfer_status,
                    'transfer_label' => $member->transfer_label,
                    'transfer_locked' => (bool) $member->transfer_locked,
                ];
            });

        return Inertia::render('Conducteur/TransfersWorkflow', [
            'pendingTransfers' => $pendingTransfers,
            'processedTransfers' => $processedTransfers,
            'classes' => $classes,
            'families' => $families,
            'members' => $members,
            'stats' => [
                'total' => $pendingTransfers->count() + $processedTransfers->count(),
                'pending_source' => $pendingTransfers->where('approval_stage', 'source')->count(),
                'pending_accueil' => $pendingTransfers->where('approval_stage', 'accueil')->count(),
                'pending_other_class' => $pendingTransfers->where('waiting_on_other_class', true)->count(),
                'completed' => $processedTransfers->where('status', 'TERMINEE')->count(),
                'refused' => $processedTransfers->where('status', 'REFUSEE')->count(),
            ],
            'userClass' => [
                'id' => $user->classe_id,
                'nom' => $user->classe?->nom ?? 'Classe inconnue',
            ],
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $transferService = app(TransferWorkflowService::class);
        $request->replace($this->normalizeTransferPayload($request));

        $validated = $request->validate([
            'type' => ['required', Rule::in(['member', 'family'])],
            'transfer_mode' => ['required', Rule::in(['internal', 'external'])],
            'user_id' => [
                Rule::requiredIf(fn () => $request->input('type') === 'member'),
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'family_id' => [
                Rule::requiredIf(fn () => $request->input('type') === 'family'),
                'nullable',
                'integer',
                'exists:families,id',
            ],
            'target_class_id' => [
                Rule::requiredIf(fn () => $request->input('transfer_mode') === 'internal'),
                'nullable',
                'integer',
                'exists:classes,id',
            ],
            'destination_city' => [
                Rule::requiredIf(fn () => $request->input('transfer_mode') === 'external'),
                'nullable',
                'string',
                'max:255',
            ],
            'destination_church' => [
                Rule::requiredIf(fn () => $request->input('transfer_mode') === 'external'),
                'nullable',
                'string',
                'max:255',
            ],
            'reason' => 'nullable|string|max:500',
        ]);

        if (!$user->classe_id) {
            return redirect()->back()->with('error', 'Classe conducteur introuvable.');
        }

        try {
            DB::beginTransaction();

            $member = null;
            $family = null;

            if ($validated['type'] === 'member') {
                $member = User::query()
                    ->with('family')
                    ->findOrFail($validated['user_id']);

                if ((int) $member->classe_id !== (int) $user->classe_id) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Ce membre n\'appartient pas a votre classe.');
                }

                if (!$member->family_id || !$member->family) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Le membre selectionne n\'est rattache a aucune famille.');
                }

                if ($member->is_family_responsible) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Le responsable de famille ne peut pas etre transfere seul. Utilisez un transfert de famille.');
                }

                if (in_array($member->role, ['admin', 'pasteur', 'conducteur'], true)) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Ce profil ne peut pas etre transfere depuis cet ecran.');
                }

                if ($transferService->isTransferLocked($member) || $transferService->hasPendingTransferForMember($member)) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Ce membre est deja un ancien membre ou a un transfert en cours.');
                }

                $family = $member->family;
            } else {
                $family = Family::query()->findOrFail($validated['family_id']);

                if ((int) $family->classe_id !== (int) $user->classe_id) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Cette famille n\'appartient pas a votre classe.');
                }

                if ($transferService->isTransferLocked($family) || $transferService->hasPendingTransferForFamily($family)) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Cette famille est deja un ancien dossier ou a un transfert en cours.');
                }
            }

            $sourceClassId = $member?->classe_id ?? $family?->classe_id ?? $user->classe_id;
            $isExternal = $validated['transfer_mode'] === 'external';

            if (!$isExternal && (int) $validated['target_class_id'] === (int) $sourceClassId) {
                DB::rollBack();
                return redirect()->back()->with('error', 'La classe d\'accueil doit etre differente de la classe source.');
            }

            $now = now();

            $transfer = ClassTransferRequest::create([
                'family_id' => $family?->id,
                'user_id' => $member?->id,
                'source_class_id' => $sourceClassId,
                'target_class_id' => $isExternal ? null : $validated['target_class_id'],
                'type' => $validated['type'],
                'transfer_mode' => $validated['transfer_mode'],
                'reason' => $validated['reason'] ?? null,
                'destination_city' => $isExternal ? $validated['destination_city'] : null,
                'destination_church' => $isExternal ? $validated['destination_church'] : null,
                'status' => $isExternal ? 'TERMINEE' : 'EN_ATTENTE_ACCUEIL',
                'reference' => ClassTransferRequest::generateReference(),
                'created_by_id' => $user->id,
                'validated_by_source_id' => $user->id,
                'validated_by_source_at' => $now,
                'validated_by_accueil_id' => $isExternal ? $user->id : null,
                'validated_by_accueil_at' => $isExternal ? $now : null,
            ]);

            if ($isExternal) {
                $transferService->completeTransfer($transfer);
            } else {
                $transferService->lockForPendingTransfer($transfer);
            }

            DB::commit();

            $message = $isExternal
                ? "Sortie externe enregistree et cloturee avec succes (Ref: {$transfer->reference})."
                : "Demande de transfert envoyee avec succes (Ref: {$transfer->reference}). En attente du conducteur de la classe d'accueil.";

            return redirect()
                ->route('conducteur.transferts.index')
                ->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur lors de la creation : ' . $e->getMessage());
        }
    }

    public function approveAsSource($id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);
        $user = Auth::user();
        $transferService = app(TransferWorkflowService::class);

        if ($user->classe_id != $transfer->source_class_id) {
            return redirect()->back()->with('error', 'Non autorise');
        }

        if ($transfer->status !== 'EN_ATTENTE_SOURCE') {
            return redirect()->back()->with('error', 'Cette demande ne peut pas etre approuvee a ce stade');
        }

        if ($this->isExternalTransfer($transfer)) {
            try {
                DB::beginTransaction();

                $transfer->update([
                    'status' => 'TERMINEE',
                    'validated_by_source_id' => $user->id,
                    'validated_by_source_at' => now(),
                    'validated_by_accueil_id' => $user->id,
                    'validated_by_accueil_at' => now(),
                ]);

                $transferService->completeTransfer($transfer);

                DB::commit();
                return redirect()->back()->with('success', 'Sortie externe validee et cloturee.');
            } catch (\Exception $e) {
                DB::rollBack();
                return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
            }
        }

        try {
            DB::beginTransaction();

            $transfer->update([
                'status' => 'EN_ATTENTE_ACCUEIL',
                'validated_by_source_id' => $user->id,
                'validated_by_source_at' => now(),
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Demande approuvee. En attente de validation accueil.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    public function approveAsAccueil($id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);
        $user = Auth::user();
        $transferService = app(TransferWorkflowService::class);

        if ($user->classe_id != $transfer->target_class_id) {
            return redirect()->back()->with('error', 'Non autorise');
        }

        if ($transfer->status !== 'EN_ATTENTE_ACCUEIL') {
            return redirect()->back()->with('error', 'Cette demande ne peut pas etre approuvee a ce stade');
        }

        try {
            DB::beginTransaction();

            $transfer->update([
                'status' => 'TERMINEE',
                'validated_by_accueil_id' => $user->id,
                'validated_by_accueil_at' => now(),
            ]);

            $transferService->completeTransfer($transfer);

            DB::commit();

            return redirect()->back()->with('success', 'Demande approuvee et transfert complete.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    public function refuse(Request $request, $id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);
        $user = Auth::user();
        $transferService = app(TransferWorkflowService::class);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $isSource = $user->classe_id === $transfer->source_class_id && $transfer->status === 'EN_ATTENTE_SOURCE';
        $isAccueil = $user->classe_id === $transfer->target_class_id && $transfer->status === 'EN_ATTENTE_ACCUEIL';

        if (!$isSource && !$isAccueil) {
            return redirect()->back()->with('error', 'Non autorise');
        }

        try {
            $updateData = [
                'status' => 'REFUSEE',
                'refusal_reason' => $validated['reason'],
            ];

            if ($isSource) {
                $updateData['validated_by_source_id'] = $user->id;
                $updateData['validated_by_source_at'] = now();
            } else {
                $updateData['validated_by_accueil_id'] = $user->id;
                $updateData['validated_by_accueil_at'] = now();
            }

            $transfer->update($updateData);
            $transferService->releaseTransferLock($transfer);

            return redirect()->back()->with('success', 'Demande refusee');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    private function transformTransfer(ClassTransferRequest $transfer, User $user): array
    {
        $requiresSourceApproval = (int) $user->classe_id === (int) $transfer->source_class_id
            && $transfer->status === 'EN_ATTENTE_SOURCE';
        $requiresAccueilApproval = (int) $user->classe_id === (int) $transfer->target_class_id
            && $transfer->status === 'EN_ATTENTE_ACCUEIL';
        $requiresAction = $requiresSourceApproval || $requiresAccueilApproval;
        $waitingOnOtherClass = !$requiresAction
            && $transfer->status === 'EN_ATTENTE_ACCUEIL'
            && (int) $transfer->validated_by_source_id === (int) $user->id;

        return [
            'id' => $transfer->id,
            'reference' => $transfer->reference,
            'status' => $transfer->status,
            'type' => $transfer->type,
            'transfer_mode' => $transfer->transfer_mode ?? ($transfer->target_class_id ? 'internal' : 'external'),
            'reason' => $transfer->reason,
            'member' => $transfer->type === 'member' && $transfer->user ? [
                'id' => $transfer->user->id,
                'name' => $transfer->user->nom . ' ' . $transfer->user->prenom,
                'email' => $transfer->user->email,
                'telephone' => $transfer->user->telephone,
                'code_membre' => $transfer->user->code_membre,
            ] : null,
            'family' => $transfer->family ? [
                'id' => $transfer->family->id,
                'name' => $transfer->family->nom,
            ] : null,
            'classe_source' => $transfer->sourceClass ? [
                'id' => $transfer->sourceClass->id,
                'nom' => $transfer->sourceClass->nom,
            ] : null,
            'classe_cible' => $transfer->targetClass ? [
                'id' => $transfer->targetClass->id,
                'nom' => $transfer->targetClass->nom,
            ] : null,
            'destination_city' => $transfer->destination_city,
            'destination_church' => $transfer->destination_church,
            'external_destination' => $this->formatExternalDestination($transfer),
            'created_at' => $transfer->created_at?->format('Y-m-d H:i'),
            'created_by' => $transfer->createdBy ? $transfer->createdBy->nom . ' ' . $transfer->createdBy->prenom : null,
            'validated_source_by' => $transfer->validatedBySource ? $transfer->validatedBySource->nom . ' ' . $transfer->validatedBySource->prenom : null,
            'validated_source_at' => $transfer->validated_by_source_at ? $transfer->validated_by_source_at->format('Y-m-d H:i') : null,
            'validated_accueil_by' => $transfer->validatedByAccueil ? $transfer->validatedByAccueil->nom . ' ' . $transfer->validatedByAccueil->prenom : null,
            'validated_accueil_at' => $transfer->validated_by_accueil_at ? $transfer->validated_by_accueil_at->format('Y-m-d H:i') : null,
            'famille_source' => $transfer->family ? [
                'id' => $transfer->family->id,
                'nom' => $transfer->family->nom,
                'code_famille' => $transfer->family->code_famille,
            ] : ($transfer->user && $transfer->user->family ? [
                'id' => $transfer->user->family->id,
                'nom' => $transfer->user->family->nom,
                'code_famille' => $transfer->user->family->code_famille,
            ] : ($transfer->createdBy && $transfer->createdBy->family ? [
                'id' => $transfer->createdBy->family->id,
                'nom' => $transfer->createdBy->family->nom,
                'code_famille' => $transfer->createdBy->family->code_famille,
            ] : null)),
            'requires_action' => $requiresAction,
            'approval_stage' => $requiresSourceApproval ? 'source' : ($requiresAccueilApproval ? 'accueil' : null),
            'waiting_on_other_class' => $waitingOnOtherClass,
            'created_by_me' => (int) $transfer->created_by_id === (int) $user->id,
            'is_external' => $this->isExternalTransfer($transfer),
        ];
    }

    private function normalizeTransferPayload(Request $request): array
    {
        $payload = $request->all();
        $legacyExternal = ($payload['type'] ?? null) === 'external';

        if ($legacyExternal) {
            $payload['transfer_mode'] = 'external';
            $payload['type'] = !empty($payload['user_id']) ? 'member' : 'family';
        }

        $payload['transfer_mode'] = $payload['transfer_mode'] ?? 'internal';

        return $payload;
    }

    private function isExternalTransfer(ClassTransferRequest $transfer): bool
    {
        return $transfer->transfer_mode === 'external' || !$transfer->target_class_id;
    }

    private function formatExternalDestination(ClassTransferRequest $transfer): ?string
    {
        $parts = array_values(array_filter([
            $transfer->destination_church,
            $transfer->destination_city,
        ]));

        return empty($parts) ? null : implode(' - ', $parts);
    }
}
