<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SiteSetting extends Model
{
    protected $fillable = ['key', 'value'];

    private const CACHE_KEY = 'site_settings.all';

    public static function get(string $key, ?string $default = null): ?string
    {
        // memo() garde la valeur en mémoire pour la requête (ou le job) en
        // cours : get() est appelé des milliers de fois sur les pages qui
        // listent tous les comptes (consentement RGPD par utilisateur), et
        // chaque appel relisait sinon le fichier de cache.
        $all = Cache::memo()->rememberForever(self::CACHE_KEY, function () {
            return static::pluck('value', 'key')->all();
        });

        return $all[$key] ?? $default;
    }

    public static function set(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::memo()->forget(self::CACHE_KEY);
    }
}
