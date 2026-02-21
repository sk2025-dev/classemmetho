<?php

namespace App\Traits;

/**
 * Trait pour optimiser les requêtes Eloquent
 */
trait OptimizedQueries
{
    /**
     * Scope pour sélectionner uniquement les colonnes essentielles pour les listes
     */
    public function scopeForList($query)
    {
        return $query->select(
            $this->table . '.id',
            $this->table . '.nom',
            $this->table . '.prenom',
            $this->table . '.email',
            $this->table . '.created_at'
        );
    }

    /**
     * Scope pour sélectionner uniquement les colonnes essentielles pour les tables
     */
    public function scopeForTable($query)
    {
        return $query->select(
            $this->table . '.id',
            $this->table . '.nom',
            $this->table . '.prenom',
            $this->table . '.email',
            $this->table . '.telephone',
            $this->table . '.status',
            $this->table . '.created_at',
            $this->table . '.updated_at'
        );
    }

    /**
     * Scope pour eager loading des relations essentielles
     */
    public function scopeWithEssentials($query)
    {
        return $query->with([
            'classe:id,nom',
            'ville:id,nom'
        ]);
    }
}
