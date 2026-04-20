<?php

namespace App\Services;

use App\Models\ClassTransferRequest;
use App\Models\Family;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

class TransferWorkflowService
{
    public function hasPendingTransferForMember(User $member): bool
    {
        return ClassTransferRequest::query()
            ->where('membre_id', $member->id)
            ->whereIn('statut', ['EN_ATTENTE_SOURCE', 'EN_ATTENTE_ACCUEIL'])
            ->exists();
    }

    public function hasPendingTransferForFamily(Family $family): bool
    {
        $familyRequestPending = ClassTransferRequest::query()
            ->where('famille_id', $family->id)
            ->whereIn('statut', ['EN_ATTENTE_SOURCE', 'EN_ATTENTE_ACCUEIL'])
            ->exists();

        if ($familyRequestPending) {
            return true;
        }

        return $family->users()
            ->where('transfer_status', 'pending')
            ->exists();
    }

    public function lockForPendingTransfer(ClassTransferRequest $transfer): void
    {
        if ($transfer->type === 'member' && $transfer->user) {
            $this->updateUserTransferState($transfer->user, [
                'transfer_status' => 'pending',
                'transfer_label' => 'Transfert en cours',
                'transfer_request_id' => $transfer->id,
                'transfer_locked_at' => now(),
                'transferred_at' => null,
            ]);

            return;
        }

        if ($transfer->family) {
            $this->updateFamilyTransferState($transfer->family, [
                'transfer_status' => 'pending',
                'transfer_label' => 'Transfert en cours',
                'transfer_request_id' => $transfer->id,
                'transfer_locked_at' => now(),
                'transferred_at' => null,
            ]);

            foreach ($transfer->family->users()->get() as $member) {
                $this->updateUserTransferState($member, [
                    'transfer_status' => 'pending',
                    'transfer_label' => 'Transfert en cours',
                    'transfer_request_id' => $transfer->id,
                    'transfer_locked_at' => now(),
                    'transferred_at' => null,
                ]);
            }
        }
    }

    public function releaseTransferLock(ClassTransferRequest $transfer): void
    {
        if ($transfer->type === 'member' && $transfer->user) {
            $this->clearPendingTransferForUser($transfer->user, $transfer);

            return;
        }

        if ($transfer->family) {
            $this->clearPendingTransferForFamily($transfer->family, $transfer);

            foreach ($transfer->family->users()->get() as $member) {
                $this->clearPendingTransferForUser($member, $transfer);
            }
        }
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

        return in_array((string) $record->transfer_status, ['pending', 'completed'], true);
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
            'transfer_origin_family_id' => $sourceFamily?->id,
        ]);

        $memberUpdates = [
            'role' => 'responsable_famille',
            'is_family_responsible' => true,
            'family_id' => $newFamily->id,
            'classe_id' => $transfer->target_class_id,
            'transfer_status' => null,
            'transfer_label' => null,
            'transfer_request_id' => null,
            'transfer_locked_at' => null,
            'transferred_at' => now(),
            'transferred_to_user_id' => null,
            'transferred_to_family_id' => $newFamily->id,
            'transfer_origin_user_id' => null,
            'transfer_origin_family_id' => $sourceFamily?->id,
        ];

        $this->applyUserStatus($memberUpdates, true);
        $this->updateUserTransferState($sourceMember, $memberUpdates);

        $newFamily->update([
            'responsable_id' => $sourceMember->id,
            'transfer_status' => null,
            'transfer_label' => null,
            'transfer_request_id' => null,
            'transfer_locked_at' => null,
            'transferred_at' => now(),
            'transferred_to_family_id' => $newFamily->id,
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
            'transfer_status' => null,
            'transfer_label' => null,
            'transfer_request_id' => null,
            'transfer_locked_at' => null,
            'transferred_at' => now(),
            'transferred_to_family_id' => $sourceFamily->id,
        ]);

        foreach ($sourceFamily->users as $user) {
            $updates = [
                'classe_id' => $transfer->target_class_id,
                'transfer_status' => null,
                'transfer_label' => null,
                'transfer_request_id' => null,
                'transfer_locked_at' => null,
                'transferred_at' => now(),
                'transferred_to_user_id' => null,
                'transferred_to_family_id' => $sourceFamily->id,
            ];

            $this->applyUserStatus($updates, true);
            $this->updateUserTransferState($user, $updates);
        }
    }

    private function archiveUser(
        User $user,
        ClassTransferRequest $transfer,
        ?int $transferredToUserId,
        ?int $transferredToFamilyId,
        string $label
    ): void {
        $updates = [
            'transfer_status' => 'completed',
            'transfer_label' => $label,
            'transfer_request_id' => $transfer->id,
            'transfer_locked_at' => now(),
            'transferred_at' => now(),
            'transferred_to_user_id' => $transferredToUserId,
            'transferred_to_family_id' => $transferredToFamilyId,
            'transfer_origin_family_id' => $user->family_id,
        ];

        $this->applyUserStatus($updates, false);
        $this->updateUserTransferState($user, $updates);
    }

    private function archiveFamily(
        Family $family,
        ClassTransferRequest $transfer,
        ?int $transferredToFamilyId,
        string $label
    ): void {
        $this->updateFamilyTransferState($family, [
            'transfer_status' => 'completed',
            'transfer_label' => $label,
            'transfer_request_id' => $transfer->id,
            'transfer_locked_at' => now(),
            'transferred_at' => now(),
            'transferred_to_family_id' => $transferredToFamilyId,
        ]);
    }

    private function clearPendingTransferForUser(User $user, ClassTransferRequest $transfer): void
    {
        if ((int) $user->transfer_request_id !== (int) $transfer->id || $user->transfer_status !== 'pending') {
            return;
        }

        $this->updateUserTransferState($user, [
            'transfer_status' => null,
            'transfer_label' => null,
            'transfer_request_id' => null,
            'transfer_locked_at' => null,
        ]);
    }

    private function clearPendingTransferForFamily(Family $family, ClassTransferRequest $transfer): void
    {
        if ((int) $family->transfer_request_id !== (int) $transfer->id || $family->transfer_status !== 'pending') {
            return;
        }

        $this->updateFamilyTransferState($family, [
            'transfer_status' => null,
            'transfer_label' => null,
            'transfer_request_id' => null,
            'transfer_locked_at' => null,
        ]);
    }

    private function updateUserTransferState(User $user, array $attributes): void
    {
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
}
