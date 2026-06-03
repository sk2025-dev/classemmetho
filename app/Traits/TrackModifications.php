<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

trait TrackModifications
{
    /**
     * Boot the trait - enregistre les événements de création, mise à jour et suppression
     */
    protected static function bootTrackModifications()
    {
        // Lors de la création
        static::created(function ($model) {
            // Définir uniquement les colonnes existantes pour éviter les erreurs SQL
            if (Schema::hasColumn($model->getTable(), 'is_modified')) {
                $model->is_modified = false;
            }
            if (Schema::hasColumn($model->getTable(), 'last_modified_at')) {
                $model->last_modified_at = now();
            }
            if (Schema::hasColumn($model->getTable(), 'last_modified_by')) {
                $model->last_modified_by = Auth::check() ? Auth::id() : null;
            }

            // Sauvegarder uniquement si au moins une colonne existe
            if (Schema::hasColumn($model->getTable(), 'is_modified') || Schema::hasColumn($model->getTable(), 'last_modified_at') || Schema::hasColumn($model->getTable(), 'last_modified_by')) {
                $model->save();
            }
        });

        // Lors de la mise à jour
        static::updating(function ($model) {
            if (Schema::hasColumn($model->getTable(), 'is_modified')) {
                $model->is_modified = true;
            }
            if (Schema::hasColumn($model->getTable(), 'last_modified_at')) {
                $model->last_modified_at = now();
            }
            if (Schema::hasColumn($model->getTable(), 'last_modified_by')) {
                $model->last_modified_by = Auth::check() ? Auth::id() : null;
            }
        });

        // Lors de la suppression (soft delete)
        static::deleting(function ($model) {
            // Vérifier si c'est un soft delete ou hard delete
            if (property_exists($model, 'forceDeleting') && $model->forceDeleting === false) {
                if (Schema::hasColumn($model->getTable(), 'is_deleted')) {
                    $model->is_deleted = true;
                }
                if (Schema::hasColumn($model->getTable(), 'deleted_at')) {
                    $model->deleted_at = now();
                }
                if (Schema::hasColumn($model->getTable(), 'deleted_by')) {
                    $model->deleted_by = Auth::check() ? Auth::id() : null;
                }

                if (Schema::hasColumn($model->getTable(), 'is_deleted') || Schema::hasColumn($model->getTable(), 'deleted_at') || Schema::hasColumn($model->getTable(), 'deleted_by')) {
                    $model->save();
                }
            }
        });
    }

    /**
     * Scope pour récupérer les enregistrements modifiés
     */
    public function scopeIsModified($query)
    {
        return $query->where('is_modified', true);
    }

    /**
     * Scope pour récupérer les enregistrements supprimés
     */
    public function scopeIsDeleted($query)
    {
        return $query->where('is_deleted', true);
    }

    /**
     * Scope pour récupérer les enregistrements non supprimés
     */
    public function scopeNotDeleted($query)
    {
        return $query->where('is_deleted', false);
    }

    /**
     * Relation: l'utilisateur qui a fait la dernière modification
     */
    public function lastModifiedBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'last_modified_by');
    }

    /**
     * Relation: l'utilisateur qui a supprimé l'enregistrement
     */
    public function deletedBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'deleted_by');
    }

    /**
     * Obtenir le nom de l'utilisateur qui a modifié
     */
    public function getModifiedByName()
    {
        if (!$this->last_modified_by) {
            return 'Système';
        }
        $user = $this->lastModifiedBy;
        return $user ? "{$user->nom} {$user->prenom}" : 'Inconnu';
    }

    /**
     * Obtenir le nom de l'utilisateur qui a supprimé
     */
    public function getDeletedByName()
    {
        if (!$this->deleted_by) {
            return null;
        }
        $user = $this->deletedBy;
        return $user ? "{$user->nom} {$user->prenom}" : 'Inconnu';
    }
}
