<?php

namespace App\Http\Controllers\ResponsableFamille;

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

        return Inertia::render('ResponsableFamille/TableauBordTransferts', [
            'transfers' => $transfers,
            'classes' => $classes,
            'members' => $members,
            'family' => $family,
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
                ->route('responsable_famille.transferts.index')
                ->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erreur lors de la creation : ' . $e->getMessage());
        }
    }

    public function transfer(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:membre,famille',
            'member_id' => 'nullable|integer|exists:users,id',
            'family_id' => 'required|integer|exists:families,id',
            'target_class_id' => 'required|integer|exists:classes,id',
        ]);

        $user = Auth::user();

        if ($user->family_id != $validated['family_id']) {
            return response()->json(['message' => 'Non autorise'], 403);
        }

        try {
            DB::beginTransaction();

            $targetClass = Classe::findOrFail($validated['target_class_id']);
            $transferredCount = 0;

            if ($validated['type'] === 'membre') {
                $member = User::findOrFail($validated['member_id']);

                if ($member->family_id != $validated['family_id']) {
                    DB::rollBack();
                    return response()->json(['message' => 'Le membre n\'appartient pas a cette famille'], 403);
                }

                $member->update(['classe_id' => $targetClass->id]);
                $transferredCount = 1;
            } elseif ($validated['type'] === 'famille') {
                $transferred = User::where('family_id', $validated['family_id'])
                    ->where('id', '!=', $user->id)
                    ->update(['classe_id' => $targetClass->id]);

                $transferredCount = $transferred;
            }

            DB::commit();

            return response()->json([
                'message' => "Transfert reussi : {$transferredCount} membre(s) transferes vers {$targetClass->nom}",
                'success' => true,
                'transferred_count' => $transferredCount,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors du transfert : ' . $e->getMessage(),
                'success' => false,
            ], 500);
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
