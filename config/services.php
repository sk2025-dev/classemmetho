<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'google_maps' => [
        'api_key' => env('GOOGLE_MAPS_API_KEY'),
        'places_api_key' => env('GOOGLE_PLACES_API_KEY'),
    ],

    'paydunya' => [
        // Compat: support both API_KEY/SECRET_KEY and MASTER/PUBLIC/PRIVATE/TOKEN naming styles.
        'api_key' => env('PAYDUNYA_API_KEY', env('PAYDUNYA_PRIVATE_KEY', env('PAYDUNYA_PUBLIC_KEY'))),
        'secret_key' => env('PAYDUNYA_SECRET_KEY', env('PAYDUNYA_TOKEN', env('PAYDUNYA_MASTER_KEY'))),
        'master_key' => env('PAYDUNYA_MASTER_KEY'),
        'public_key' => env('PAYDUNYA_PUBLIC_KEY'),
        'private_key' => env('PAYDUNYA_PRIVATE_KEY'),
        'token' => env('PAYDUNYA_TOKEN'),
        'mode' => env('PAYDUNYA_MODE', 'test'),
        'channel_wave' => env('PAYDUNYA_CHANNEL_WAVE'),
        'channel_orange' => env('PAYDUNYA_CHANNEL_ORANGE'),
        'channel_mtn' => env('PAYDUNYA_CHANNEL_MTN'),
        'base_url' => env('PAYDUNYA_BASE_URL', 'https://app.paydunya.com/api'),
        'webhook_secret' => env('PAYDUNYA_WEBHOOK_SECRET', env('PAYDUNYA_TOKEN')),
    ],

];
