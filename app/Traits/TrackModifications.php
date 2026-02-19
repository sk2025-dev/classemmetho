<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;

trait TrackModifications
{
    /**
     * Boot the trait - enregistre les événements de création, mise à jour et suppression
     */
    protected static function bootTrackModifications()
    {
        // Lors de la création
        static::created(function ($model) {
            $model->is_modified = false;
            $model->last_modified_at = now();
            $model->last_modified_by = Auth::check() ? Auth::id() : null;
            $model->save();
        });

        // Lors de la mise à jour
        static::updating(function ($model) {
            // Utiliser une requête DB directe pour enregistrer la modification
            // AVANT que le modèle ne soit mis à jour
            \Illuminate\Support\Facades\DB::table($model->getTable())
                ->where($model->getKeyName(), $model->getKey())
                ->update([
                    'is_modified' => true,
                    'last_modified_at' => now(),
                    'last_modified_by' => Auth::check() ? Auth::id() : null,
                    'updated_at' => now(),
                ]);
        });

        // Lors de la suppression (soft delete)
        static::deleting(function ($model) {
            // Mettre à jour deleted_by si c'est un soft delete
            // (SoftDeletes ajoute deleted_at automatiquement)
            if (!$model->forceDeleting) {
                // Mettre à jour directement en BD AVANT la suppression
                \Illuminate\Support\Facades\DB::table($model->getTable())
                    ->where($model->getKeyName(), $model->getKey())
                    ->update([
                        'deleted_by' => Auth::check() ? Auth::id() : null,
                        'is_deleted' => true,
                        'last_modified_by' => Auth::check() ? Auth::id() : null,
                        'last_modified_at' => now(),
                        'updated_at' => now(),
                    ]);
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
