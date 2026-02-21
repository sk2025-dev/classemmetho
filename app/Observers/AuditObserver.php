<?php

namespace App\Observers;

use App\Models\User;
use App\Services\AuditService;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    /**
     * Handle the Model "created" event.
     */
    public function created(Model $model): void
    {
        AuditService::logCreate($model);
    }

    /**
     * Handle the Model "updated" event.
     */
    public function updated(Model $model): void
    {
        AuditService::logUpdate($model);
    }

    /**
     * Handle the Model "deleted" event.
     * Note: utilisé quand hasSoftDeletes() est false
     */
    public function deleted(Model $model): void
    {
        AuditService::logDelete($model);
    }

    /**
     * Handle the Model "restored" event.
     * Utilisé quand un soft delete est restauré
     */
    public function restored(Model $model): void
    {
        AuditService::logRestore($model);
    }

    /**
     * Handle the Model "force deleted" event.
     * Utilisé quand un enregistrement soft deleted est supprimé définitivement
     */
    public function forceDeleted(Model $model): void
    {
        AuditService::logForceDelete($model);
    }
}
