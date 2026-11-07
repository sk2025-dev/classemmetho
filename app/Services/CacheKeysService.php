<?php

namespace App\Services;

use App\Models\Classe;
use App\Models\Ville;
use App\Models\Fonction;
use Illuminate\Support\Facades\Cache;

/**
 * Service de cache pour les données de référence
 * Réduit les N+1 queries et accélère les recherches
 */
class CacheKeysService
{
    // TTL en secondes (24 heures)
    private const CACHE_TTL = 86400;

    /**
     * Récupérer une classe par ID avec cache
     */
    public static function getClasse(?int $id): ?Classe
    {
        if (!$id) {
            return null;
        }

        return Cache::remember("classe:{$id}", self::CACHE_TTL, function () use ($id) {
            return Classe::find($id);
        });
    }

    /**
     * Récupérer une ville par ID avec cache
     */
    public static function getVille(?int $id): ?Ville
    {
        if (!$id) {
            return null;
        }

        return Cache::remember("ville:{$id}", self::CACHE_TTL, function () use ($id) {
            return Ville::find($id);
        });
    }

    /**
     * Récupérer une fonction par ID avec cache
     */
    public static function getFonction(?int $id): ?Fonction
    {
        if (!$id) {
            return null;
        }

        return Cache::remember("fonction:{$id}", self::CACHE_TTL, function () use ($id) {
            return Fonction::find($id);
        });
    }

    /**
     * Récupérer une ville par nom avec cache
     */
    public static function getVilleByNom(string $nom): ?Ville
    {
        return Cache::remember("ville_nom:{$nom}", self::CACHE_TTL, function () use ($nom) {
            return Ville::where('nom', $nom)->first();
        });
    }

    /**
     * Invalider le cache d'une classe
     */
    public static function invalidateClasse(int $id): void
    {
        Cache::forget("classe:{$id}");
    }

    /**
     * Invalider le cache d'une ville
     */
    public static function invalidateVille(int $id): void
    {
        Cache::forget("ville:{$id}");
    }

    /**
     * Récupérer toutes les classes avec cache
     */
    public static function getAllClasses()
    {
        return Cache::remember('classes:all', self::CACHE_TTL, function () {
            return Classe::select('id', 'nom', 'status')->get();
        });
    }

    /**
     * Récupérer toutes les villes avec cache
     */
    public static function getAllVilles()
    {
        return Cache::remember('villes:all', self::CACHE_TTL, function () {
            return Ville::select('id', 'nom', 'code', 'region')->get();
        });
    }

    /**
     * Vider tout le cache
     */
    public static function flushAll(): void
    {
        Cache::forget('classes:all');
        Cache::forget('villes:all');
        // Note: Les caches individuels seront supprimés naturellement après TTL
    }
}
