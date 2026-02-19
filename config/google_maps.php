<?php

return [
    // Clé API Google Maps
    'api_key' => env('GOOGLE_MAPS_API_KEY', ''),
    
    // Clé API Google Places
    'places_api_key' => env('GOOGLE_PLACES_API_KEY', ''),
    
    // Configuration de recherche
    'search' => [
        'language' => 'fr',
        'region' => 'CI', // Code pour Côte d'Ivoire
        'components' => 'country:CI', // Limiter à la Côte d'Ivoire
    ],
    
    // Domaines autorisés (restriction HTTP)
    'allowed_domains' => [
        'localhost',
        '127.0.0.1',
        'classemetho-jubile.local',
        // Ajouter votre domaine de production
        // 'yourdomain.com',
    ],
];
