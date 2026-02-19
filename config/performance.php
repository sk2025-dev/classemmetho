<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Application Performance Settings
    |--------------------------------------------------------------------------
    */

    'database' => [
        // Nombre de requêtes maximum avant avertissement
        'max_queries_per_request' => 100,

        // Utiliser query caching
        'enable_query_cache' => true,

        // TTL du cache des requêtes (secondes)
        'query_cache_ttl' => 3600,
    ],

    'cache' => [
        // Désactiver le cache en développement
        'enable' => env('APP_DEBUG') === false,

        // Durée par défaut du cache (minutes)
        'default_ttl' => 60,

        // Cache des listes
        'lists_ttl' => 60,

        // Cache des données utilisateur
        'user_data_ttl' => 30,
    ],

    'api' => [
        // Rate limiting
        'rate_limit' => env('API_RATE_LIMIT', 60),

        // Pagination par défaut
        'default_per_page' => 20,

        // Maximum par page
        'max_per_page' => 100,

        // Timeout des requêtes (secondes)
        'timeout' => 30,
    ],

    'database_optimization' => [
        // Utiliser les indexes
        'use_indexes' => true,

        // Eager loading automatique
        'auto_eager_load' => true,

        // Limite des résultats sans pagination
        'default_limit' => 50,
    ],

    'frontend' => [
        // Lazy loading pour les images
        'lazy_load_images' => true,

        // Code splitting
        'code_splitting' => true,

        // Minification
        'minify_assets' => env('APP_DEBUG') === false,

        // Compression gzip
        'gzip_compression' => true,
    ],

    'session' => [
        // Durée de session (minutes)
        'lifetime' => 120,

        // Garbage collection
        'gc_probability' => 2,
        'gc_divisor' => 100,
    ],

    'cdn' => [
        // URL du CDN pour les assets
        'url' => env('CDN_URL'),

        // Utiliser le CDN
        'enabled' => env('CDN_ENABLED', false),
    ],
];
