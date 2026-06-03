<?php

namespace App\Services;

use App\Models\ClassTransferRequest;
use App\Models\Family;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Collection;

class TransferWorkflowService
{
    private const PENDING_STATUSES = ['EN_ATTENTE_SOURCE', 'EN_ATTENTE_ACCUEIL'];
    private const COMPLETED_STATUS = 'TERMINEE';

    public function hasPendingTransferForMember(User $member): bool
    {
        return $this->resolveUserTransferState($member)['status'] === 'pending';
    }

    public function hasPendingTransferForFamily(Family $family): bool
    {
        return $this->resolveFamilyTransferState($family)['status'] === 'pending';
    }

    public function lockForPendingTransfer(ClassTransferRequest $transfer): void
    {
        // La table demandes_transfert_classe est la source de vérité.
    }

    public function releaseTransferLock(ClassTransferRequest $transfer): void
    {
        // Le verrouillage est déduit du statut de la demande, aucune synchronisation users/families n'est nécessaire.
    }

    public function completeTransfer(ClassTransferRequest $transfer): void
    {
        if ($transfer->type === 'member') {
            $this->completeMemberTransfer($transfer);

            return;
        }

        $this->completeFamilyTransfer($transfer);
    }

    public function isTransferLocked(User|Family|null $record): bool
    {
        if (!$record) {
            return false;
        }

        if ($record instanceof User) {
            return $this->resolveUserTransferState($record)['locked'];
        }

        return $this->resolveFamilyTransferState($record)['locked'];
    }

    public function hydrateUsersTransferState(iterable $users): Collection
    {
        $users = collect($users)->values();

        if ($users->isEmpty()) {
            return $users;
        }

        $requests = $this->loadTransferRequestsForUsers($users);
        $requestsByMember = $requests
            ->filter(fn (ClassTransferRequest $request) => !empty($request->membre_id))
            ->groupBy('membre_id');
        $requestsByFamily = $requests
            ->filter(fn (ClassTransferRequest $request) => !empty($request->famille_id))
            ->groupBy('famille_id');

        return $users->map(function (User $user) use ($requestsByMember, $requestsByFamily) {
            $memberRequests = $requestsByMember->get($user->id, collect());
            $familyRequests = $requestsByFamily->get($user->family_id, collect());

            return $this->applyUserTransferState(
                $user,
                $this->buildUserTransferState($user, $memberRequests, $familyRequests)
            );
        });
    }

    public function hydrateFamiliesTransferState(iterable $families): Collection
    {
        $families = collect($families)->values();

        if ($families->isEmpty()) {
            return $families;
        }

        $requestsByFamily = $this->loadTransferRequestsForFamilies($families)
            ->groupBy('famille_id');

        return $families->map(function (Family $family) use ($requestsByFamily) {
            $familyRequests = $requestsByFamily->get($family->id, collect());

            return $this->applyFamilyTransferState(
                $family,
                $this->buildFamilyTransferState($familyRequests)
            );
        });
    }

    private function completeMemberTransfer(ClassTransferRequest $transfer): void
    {
        $sourceMember = $transfer->user()->with('family')->firstOrFail();
        $sourceFamily = $sourceMember->family;

        if ($this->isExternalTransfer($transfer)) {
            $this->archiveUser($sourceMember, $transfer, null, null, 'Ancien membre');

            return;
        }

        $newFamily = Family::create([
            'nom' => $sourceMember->nom,
            'email' => $sourceMember->email,
            'classe_id' => $transfer->target_class_id,
            'responsable_id' => null,
            'adresse' => $sourceFamily?->adresse,
            'quartier' => $sourceFamily?->quartier,
            'telephone' => $sourceFamily?->telephone,
            'telephone2' => $sourceFamily?->telephone2,
            'ville_id' => $sourceFamily?->ville_id,
        ]);

        $memberUpdates = [
            'role' => 'responsable_famille',
            'is_family_responsible' => true,
            'family_id' => $newFamily->id,
            'classe_id' => $transfer->target_class_id,
        ];

        $this->applyUserStatus($memberUpdates, true);
        $this->updateUserAttributes($sourceMember, $memberUpdates);

        $newFamily->update([
            'responsable_id' => $sourceMember->id,
        ]);
    }

    private function completeFamilyTransfer(ClassTransferRequest $transfer): void
    {
        $sourceFamily = $transfer->family()->with('users')->firstOrFail();

        if ($this->isExternalTransfer($transfer)) {
            foreach ($sourceFamily->users as $user) {
                $label = $user->id === $sourceFamily->responsable_id
                    ? 'Ancien responsable'
                    : 'Ancien membre';

                $this->archiveUser($user, $transfer, null, null, $label);
            }

            $this->archiveFamily($sourceFamily, $transfer, null, 'Ancienne famille');

            return;
        }

        $this->updateFamilyTransferState($sourceFamily, [
            'classe_id' => $transfer->target_class_id,
        ]);

        foreach ($sourceFamily->users as $user) {
            $updates = [
                'classe_id' => $transfer->target_class_id,
            ];

            $this->applyUserStatus($updates, true);
            $this->updateUserAttributes($user, $updates);
        }
    }

    private function archiveUser(
        User $user,
        ClassTransferRequest $transfer,
        ?int $transferredToUserId,
        ?int $transferredToFamilyId,
        string $label
    ): void {
        $updates = [];

        $this->applyUserStatus($updates, false);
        $this->updateUserAttributes($user, $updates);
    }

    private function archiveFamily(
        Family $family,
        ClassTransferRequest $transfer,
        ?int $transferredToFamilyId,
        string $label
    ): void {
        // L'archivage de famille est déduit de la demande de transfert externe terminée.
    }

    private function updateUserAttributes(User $user, array $attributes): void
    {
        if (empty($attributes)) {
            return;
        }

        $user->forceFill($attributes);
        User::query()->whereKey($user->id)->update($attributes);
        $user->syncOriginal();
    }

    private function updateFamilyTransferState(Family $family, array $attributes): void
    {
        $family->forceFill($attributes);
        $family->save();
    }

    private function applyUserStatus(array &$attributes, bool $active): void
    {
        if (Schema::hasColumn('users', 'status')) {
            $attributes['status'] = $active ? 'active' : 'inactive';
        }

        if (Schema::hasColumn('users', 'statut')) {
            $attributes['statut'] = $active ? 'actif' : 'inactif';
        }
    }

    private function isExternalTransfer(ClassTransferRequest $transfer): bool
    {
        return $transfer->transfer_mode === 'external' || !$transfer->target_class_id;
    }

    private function resolveUserTransferState(User $user): array
    {
        $state = $this->hydrateUsersTransferState([$user])->first();

        return [
            'status' => $state?->transfer_status,
            'label' => $state?->transfer_label,
            'locked' => (bool) ($state?->transfer_locked),
        ];
    }

    private function resolveFamilyTransferState(Family $family): array
    {
        $state = $this->hydrateFamiliesTransferState([$family])->first();

        return [
            'status' => $state?->transfer_status,
            'label' => $state?->transfer_label,
            'locked' => (bool) ($state?->transfer_locked),
        ];
    }

    private function loadTransferRequestsForUsers(Collection $users): Collection
    {
        $userIds = $users->pluck('id')->filter()->unique()->values();
        $familyIds = $users->pluck('family_id')->filter()->unique()->values();

        return $this->baseTransferRequestQuery()
            ->where(function ($query) use ($userIds, $familyIds) {
                if ($userIds->isNotEmpty()) {
                    $query->whereIn('membre_id', $userIds);
                }

                if ($familyIds->isNotEmpty()) {
                    $query->orWhereIn('famille_id', $familyIds);
                }
            })
            ->get();
    }

    private function loadTransferRequestsForFamilies(Collection $families): Collection
    {
        $familyIds = $families->pluck('id')->filter()->unique()->values();

        if ($familyIds->isEmpty()) {
            return collect();
        }

        return $this->baseTransferRequestQuery()
            ->whereIn('famille_id', $familyIds)
            ->get();
    }

    private function baseTransferRequestQuery()
    {
        return ClassTransferRequest::query()
            ->with([
                'family:id,nom,code_famille,classe_id',
                'sourceClass:id,nom',
            ])
            ->whereIn('statut', array_merge(self::PENDING_STATUSES, [self::COMPLETED_STATUS]))
            ->orderByDesc('date_validation_accueil')
            ->orderByDesc('date_validation_source')
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at');
    }

    private function buildUserTransferState(User $user, Collection $memberRequests, Collection $familyRequests): array
    {
        $pendingRequest = $memberRequests->first(fn (ClassTransferRequest $request) => $this->isPendingStatus($request->statut))
            ?? $familyRequests->first(fn (ClassTransferRequest $request) => $request->type === 'family' && $this->isPendingStatus($request->statut));

        $completedExternalRequest = $memberRequests->first(fn (ClassTransferRequest $request) => $this->isCompletedExternalRequest($request))
            ?? $familyRequests->first(fn (ClassTransferRequest $request) => $request->type === 'family' && $this->isCompletedExternalRequest($request));

        $latestCompletedMemberRequest = $memberRequests->first(fn (ClassTransferRequest $request) => $this->isCompletedStatus($request->statut));
        $latestCompletedFamilyRequest = $familyRequests->first(fn (ClassTransferRequest $request) => $request->type === 'family' && $this->isCompletedStatus($request->statut));
        $originFamilyTransferRequest = $memberRequests->first(function (ClassTransferRequest $request) use ($user) {
            return $this->isCompletedStatus($request->statut)
                && !$this->isExternalTransfer($request)
                && (int) $request->famille_id !== (int) $user->family_id;
        });

        $status = null;
        $label = null;
        $locked = false;

        if ($pendingRequest) {
            $status = 'pending';
            $label = 'Transfert en cours';
            $locked = true;
        } elseif ($completedExternalRequest) {
            $status = 'completed';
            $label = $completedExternalRequest->type === 'family' && $user->is_family_responsible
                ? 'Ancien responsable'
                : 'Ancien membre';
            $locked = true;
        }

        return [
            'status' => $status,
            'label' => $label,
            'locked' => $locked,
            'pending_request' => $pendingRequest,
            'completed_external_request' => $completedExternalRequest,
            'latest_completed_member_request' => $latestCompletedMemberRequest,
            'latest_completed_family_request' => $latestCompletedFamilyRequest,
            'origin_family_transfer_request' => $originFamilyTransferRequest,
        ];
    }

    private function buildFamilyTransferState(Collection $familyRequests): array
    {
        $pendingRequest = $familyRequests->first(fn (ClassTransferRequest $request) => $this->isPendingStatus($request->statut));
        $completedExternalRequest = $familyRequests->first(fn (ClassTransferRequest $request) => $request->type === 'family' && $this->isCompletedExternalRequest($request));
        $latestCompletedFamilyRequest = $familyRequests->first(fn (ClassTransferRequest $request) => $request->type === 'family' && $this->isCompletedStatus($request->statut));

        $status = null;
        $label = null;
        $locked = false;

        if ($pendingRequest) {
            $status = 'pending';
            $label = 'Transfert en cours';
            $locked = true;
        } elseif ($completedExternalRequest) {
            $status = 'completed';
            $label = 'Ancienne famille';
            $locked = true;
        }

        return [
            'status' => $status,
            'label' => $label,
            'locked' => $locked,
            'pending_request' => $pendingRequest,
            'completed_external_request' => $completedExternalRequest,
            'latest_completed_family_request' => $latestCompletedFamilyRequest,
        ];
    }

    private function applyUserTransferState(User $user, array $state): User
    {
        $user->transfer_status = $state['status'];
        $user->transfer_label  = $state['label'];
        $user->transfer_locked = $state['locked'];
        $user->setRelation('computedPendingTransferRequest', $state['pending_request']);
        $user->setRelation('computedCompletedExternalTransferRequest', $state['completed_external_request']);
        $user->setRelation('computedLatestCompletedMemberTransferRequest', $state['latest_completed_member_request']);
        $user->setRelation('computedLatestCompletedFamilyTransferRequest', $state['latest_completed_family_request']);
        $user->setRelation('computedOriginFamilyTransferRequest', $state['origin_family_transfer_request']);

        return $user;
    }

    private function applyFamilyTransferState(Family $family, array $state): Family
    {
        $family->transfer_status = $state['status'];
        $family->transfer_label  = $state['label'];
        $family->transfer_locked = $state['locked'];
        $family->setRelation('computedPendingTransferRequest', $state['pending_request']);
        $family->setRelation('computedCompletedExternalTransferRequest', $state['completed_external_request']);
        $family->setRelation('computedLatestCompletedFamilyTransferRequest', $state['latest_completed_family_request']);

        return $family;
    }

    private function isPendingStatus(?string $status): bool
    {
        return in_array($status, self::PENDING_STATUSES, true);
    }

    private function isCompletedStatus(?string $status): bool
    {
        return $status === self::COMPLETED_STATUS;
    }

    private function isCompletedExternalRequest(ClassTransferRequest $request): bool
    {
        return $this->isCompletedStatus($request->statut) && $this->isExternalTransfer($request);
    }
}
