<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use App\Models\Classe;
use App\Models\Ville;
use App\Models\Fonction;

class CacheService
{
    const CACHE_TTL = 3600; // 1 heure

    /**
     * Récupérer les classes avec cache
     */
    public static function getClasses()
    {
        return Cache::remember('classes_list', self::CACHE_TTL, function () {
            return Classe::select('id', 'nom')
                ->orderBy('nom')
                ->get()
                ->toArray();
        });
    }

    /**
     * Récupérer les villes avec cache
     */
    public static function getVilles()
    {
        return Cache::remember('villes_list', self::CACHE_TTL, function () {
            return Ville::select('id', 'nom')
                ->orderBy('nom')
                ->get()
                ->toArray();
        });
    }

    /**
     * Récupérer les fonctions avec cache
     */
    public static function getFonctions()
    {
        return Cache::remember('fonctions_list', self::CACHE_TTL, function () {
            return Fonction::select('id', 'nom', 'description')
                ->orderBy('nom')
                ->get()
                ->toArray();
        });
    }

    /**
     * Invalider le cache des classes
     */
    public static function invalidateClasses()
    {
        Cache::forget('classes_list');
    }

    /**
     * Invalider le cache des villes
     */
    public static function invalidateVilles()
    {
        Cache::forget('villes_list');
    }

    /**
     * Invalider le cache des fonctions
     */
    public static function invalidateFonctions()
    {
        Cache::forget('fonctions_list');
    }
}
