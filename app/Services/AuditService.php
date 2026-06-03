<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Enregistrer un log d'audit pour une création
     * DÉSACTIVÉ: Utiliser les colonnes décentralisées (is_modified, last_modified_at, last_modified_by, is_deleted, deleted_at, deleted_by)
     */
    public static function logCreate(Model $model): void
    {
        // AuditLog désactivé - utiliser le suivi décentralisé dans chaque table
        return;
    }

    /**
     * Enregistrer un log d'audit pour une modification
     * DÉSACTIVÉ: Utiliser les colonnes décentralisées (is_modified, last_modified_at, last_modified_by)
     */
    public static function logUpdate(Model $model): void
    {
        // AuditLog désactivé - utiliser le suivi décentralisé dans chaque table
        return;
    }

    /**
     * Enregistrer un log d'audit pour une suppression
     * DÉSACTIVÉ: Utiliser les colonnes décentralisées (is_deleted, deleted_at, deleted_by)
     */
    public static function logDelete(Model $model): void
    {
        // AuditLog désactivé - utiliser le suivi décentralisé dans chaque table
        return;
    }

    /**
     * Obtenir l'historique complet d'un enregistrement
     * DÉSACTIVÉ: Utiliser les colonnes décentralisées dans chaque table (is_modified, last_modified_at, last_modified_by)
     */
    public static function getRecordHistory(string $table, int $recordId)
    {
        // AuditLog désactivé - historique décentralisé
        return collect();
    }

    /**
     * Obtenir l'historique de toutes les modifications d'un utilisateur
     * DÉSACTIVÉ: Utiliser les colonnes décentralisées
     */
    public static function getUserHistory(int $userId)
    {
        // AuditLog désactivé - historique décentralisé
        return collect();
    }

    /**
     * Obtenir l'historique par table
     * DÉSACTIVÉ: Utiliser les colonnes décentralisées
     */
    public static function getTableHistory(string $table)
    {
        // AuditLog désactivé - historique décentralisé
        return collect();
    }
}
