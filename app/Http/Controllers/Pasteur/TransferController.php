<?php

namespace App\Http\Controllers\Pasteur;

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

class TransferController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $transferService = app(TransferWorkflowService::class);

        $transfers = ClassTransferRequest::with([
            'family',
            'user',
            'sourceClass',
            'targetClass',
            'validatedBySource',
            'validatedByAccueil',
        ])
            ->where('famille_id', $user->family_id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (ClassTransferRequest $transfer) {
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
                    'created_at' => $transfer->created_at?->format('Y-m-d'),
                    'validated_source_by' => $transfer->validatedBySource ? $transfer->validatedBySource->nom . ' ' . $transfer->validatedBySource->prenom : null,
                    'validated_source_at' => $transfer->validated_by_source_at ? $transfer->validated_by_source_at->format('Y-m-d') : null,
                    'validated_accueil_by' => $transfer->validatedByAccueil ? $transfer->validatedByAccueil->nom . ' ' . $transfer->validatedByAccueil->prenom : null,
                    'validated_accueil_at' => $transfer->validated_by_accueil_at ? $transfer->validated_by_accueil_at->format('Y-m-d') : null,
                ];
            });

        $members = User::where('family_id', $user->family_id)
            ->where('id', '!=', $user->id)
            ->where('is_family_responsible', false)
            ->get(['id', 'nom', 'prenom', 'email', 'classe_id', 'family_id', 'is_family_responsible']);

        $members = $transferService->hydrateUsersTransferState($members)->values();

        $family = $transferService
            ->hydrateFamiliesTransferState([Family::findOrFail($user->family_id)])
            ->first();
        $classes = Classe::where('id', '!=', $family->classe_id)->get(['id', 'nom']);

        // Transferts externes hors-communauté en attente de validation pasteur
        $externalPending = ClassTransferRequest::with([
            'user', 'family', 'sourceClass', 'createdBy',
        ])
            ->where('statut', 'EN_ATTENTE_PASTEUR')
            ->where('mode_transfert', 'external')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($t) => [
                'id'                  => $t->id,
                'reference'           => $t->reference,
                'status'              => $t->statut,
                'type'                => $t->type,
                'transfer_mode'       => 'external',
                'reason'              => $t->motif,
                'member'              => $t->user ? ['id' => $t->user->id, 'name' => $t->user->nom . ' ' . $t->user->prenom] : null,
                'family'              => $t->family ? ['id' => $t->family->id, 'name' => $t->family->nom] : null,
                'classe_source'       => $t->sourceClass ? ['id' => $t->sourceClass->id, 'nom' => $t->sourceClass->nom] : null,
                'destination_city'    => $t->ville_destination,
                'destination_church'  => $t->eglise_destination,
                'external_destination'=> implode(' - ', array_filter([$t->eglise_destination, $t->ville_destination])) ?: null,
                'created_at'          => $t->created_at?->format('Y-m-d H:i'),
                'created_by'          => $t->createdBy ? $t->createdBy->nom . ' ' . $t->createdBy->prenom : null,
            ]);

        return Inertia::render('Pasteur/TableauBordTransferts', [
            'transfers'       => $transfers,
            'externalPending' => $externalPending,
            'classes'         => $classes,
            'members'         => $members,
            'family'          => $family,
            'auth'            => ['user' => $user],
        ]);
    }

    public function approve($id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);

        if ($transfer->statut !== 'EN_ATTENTE_PASTEUR') {
            return redirect()->back()->with('error', 'Cette demande ne peut pas être approuvée à ce stade.');
        }

        try {
            DB::beginTransaction();

            $transfer->update([
                'statut'                   => 'TERMINEE',
                'validateur_accueil_id'    => Auth::id(),
                'date_validation_accueil'  => now(),
            ]);

            app(TransferWorkflowService::class)->completeTransfer($transfer);

            DB::commit();
            return redirect()->back()->with('success', 'Sortie externe validée et clôturée.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    public function refuse(Request $request, $id)
    {
        $transfer = ClassTransferRequest::findOrFail($id);

        if ($transfer->statut !== 'EN_ATTENTE_PASTEUR') {
            return redirect()->back()->with('error', 'Cette demande ne peut pas être refusée à ce stade.');
        }

        $request->validate(['reason' => 'required|string|max:500']);

        try {
            $transfer->update([
                'statut'                   => 'REFUSEE',
                'motif_refus'              => $request->reason,
                'validateur_accueil_id'    => Auth::id(),
                'date_validation_accueil'  => now(),
            ]);

            app(TransferWorkflowService::class)->releaseTransferLock($transfer);

            return redirect()->back()->with('success', 'Demande refusée.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erreur : ' . $e->getMessage());
        }
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

        if (!$user->family_id) {
            return redirect()->back()->with('error', 'Non autorise');
        }

        try {
            DB::beginTransaction();

            $family = Family::findOrFail($user->family_id);
            $member = null;

            if ($validated['type'] === 'member') {
                $member = User::findOrFail($validated['user_id']);

                if ((int) $member->family_id !== (int) $user->family_id) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Le membre n\'appartient pas a cette famille');
                }

                if ($member->is_family_responsible || ((int) $member->id === (int) $user->id && $user->is_family_responsible)) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Le responsable de famille ne peut pas etre transfere seul. Utilisez le transfert de famille.');
                }

                if ($transferService->isTransferLocked($member) || $transferService->hasPendingTransferForMember($member)) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Ce membre est deja un ancien membre ou a un transfert en cours.');
                }
            } else {
                if ($transferService->isTransferLocked($family) || $transferService->hasPendingTransferForFamily($family)) {
                    DB::rollBack();
                    return redirect()->back()->with('error', 'Cette famille est deja un ancien dossier ou a un transfert en cours.');
                }
            }

            $sourceClassId = $member?->classe_id ?? $family->classe_id ?? $user->classe_id;
            $isExternal = $validated['transfer_mode'] === 'external';

            if (!$isExternal && (int) $validated['target_class_id'] === (int) $sourceClassId) {
                DB::rollBack();
                return redirect()->back()->with('error', 'La classe d\'accueil doit etre differente de la classe source.');
            }

            $transfer = ClassTransferRequest::create([
                'family_id' => $user->family_id,
                'user_id' => $validated['type'] === 'member' ? $validated['user_id'] : null,
                'source_class_id' => $sourceClassId,
                'target_class_id' => $isExternal ? null : $validated['target_class_id'],
                'type' => $validated['type'],
                'transfer_mode' => $validated['transfer_mode'],
                'reason' => $validated['reason'] ?? null,
                'destination_city' => $isExternal ? $validated['destination_city'] : null,
                'destination_church' => $isExternal ? $validated['destination_church'] : null,
                'status' => 'EN_ATTENTE_SOURCE',
                'reference' => ClassTransferRequest::generateReference(),
                'created_by_id' => $user->id,
            ]);

            $transferService->lockForPendingTransfer($transfer);

            DB::commit();

            $message = $isExternal
                ? "Demande de sortie externe creee avec succes (Ref: {$transfer->reference}). En attente de confirmation du conducteur de la classe."
                : "Demande de transfert creee avec succes (Ref: {$transfer->reference}). En attente de validation du conducteur source.";

            return redirect()
                ->route('pasteur.transferts.index')
                ->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur lors de la creation : ' . $e->getMessage());
        }
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

    private function formatExternalDestination(ClassTransferRequest $transfer): ?string
    {
        $parts = array_values(array_filter([
            $transfer->destination_church,
            $transfer->destination_city,
        ]));

        return empty($parts) ? null : implode(' - ', $parts);
    }
}
