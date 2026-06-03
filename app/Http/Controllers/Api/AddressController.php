<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class AddressController extends Controller
{
    /**
     * Autocomplete des adresses en Côte d'Ivoire
     */
    public function autocomplete(Request $request)
    {
        $request->validate([
            'input' => 'required|string|min:3',
        ]);

        $input = $request->input('input');
        $apiKey = config('google_maps.api_key');

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Configuration Google Maps manquante'
            ], 500);
        }

        try {
            // Utiliser le cache pour éviter trop de requêtes
            $cacheKey = 'address_autocomplete_' . md5($input);
            $cached = Cache::get($cacheKey);

            if ($cached) {
                return response()->json([
                    'success' => true,
                    'predictions' => $cached,
                    'cached' => true
                ]);
            }

            // Appel à Google Places Autocomplete API
            $response = Http::get('https://maps.googleapis.com/maps/api/place/autocomplete/json', [
                'input' => $input,
                'key' => $apiKey,
                'language' => 'fr',
                'components' => 'country:CI', // Limiter à la Côte d'Ivoire
                'types' => 'address', // Retourner uniquement les adresses
            ]);

            if ($response->successful()) {
                $predictions = $response->json('predictions', []);

                // Mettre en cache pendant 30 minutes
                Cache::put($cacheKey, $predictions, now()->addMinutes(30));

                return response()->json([
                    'success' => true,
                    'predictions' => $predictions,
                    'cached' => false
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche d\'adresses'
            ], 400);
        } catch (\Exception $e) {
            \Log::error('Erreur autocomplete adresse', [
                'error' => $e->getMessage(),
                'input' => $input
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche'
            ], 500);
        }
    }

    /**
     * Obtenir les détails d'une adresse par place_id
     */
    public function placeDetails(Request $request)
    {
        $request->validate([
            'place_id' => 'required|string',
        ]);

        $placeId = $request->input('place_id');
        $apiKey = config('google_maps.api_key');

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Configuration Google Maps manquante'
            ], 500);
        }

        try {
            $cacheKey = 'place_details_' . md5($placeId);
            $cached = Cache::get($cacheKey);

            if ($cached) {
                return response()->json([
                    'success' => true,
                    'place' => $cached,
                    'cached' => true
                ]);
            }

            $response = Http::get('https://maps.googleapis.com/maps/api/place/details/json', [
                'place_id' => $placeId,
                'key' => $apiKey,
                'language' => 'fr',
                'fields' => 'formatted_address,address_component,geometry,place_id',
            ]);

            if ($response->successful() && $response->json('status') === 'OK') {
                $place = $response->json('result');

                // Mettre en cache pendant 1 jour
                Cache::put($cacheKey, $place, now()->addDay());

                return response()->json([
                    'success' => true,
                    'place' => $place,
                    'cached' => false
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Lieu introuvable'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Erreur place details', [
                'error' => $e->getMessage(),
                'place_id' => $placeId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des détails'
            ], 500);
        }
    }

    /**
     * Valider une adresse saisie
     */
    public function validate(Request $request)
    {
        $request->validate([
            'address' => 'required|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
        ]);

        $address = $request->input('address');
        $lat = $request->input('lat');
        $lng = $request->input('lng');

        try {
            $apiKey = config('google_maps.api_key');

            // Si on a les coordonnées, faire une reverse geocode
            if ($lat !== null && $lng !== null) {
                $response = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
                    'latlng' => "$lat,$lng",
                    'key' => $apiKey,
                    'language' => 'fr',
                ]);
            } else {
                // Sinon, geocoder l'adresse
                $response = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
                    'address' => $address,
                    'key' => $apiKey,
                    'language' => 'fr',
                    'components' => 'country:CI',
                ]);
            }

            if ($response->successful() && !empty($response->json('results'))) {
                $results = $response->json('results');
                $location = $results[0];

                // Vérifier que c'est en Côte d'Ivoire
                $isIvoryCoast = collect($location['address_components'] ?? [])
                    ->contains(fn($component) =>
                        in_array('country', $component['types']) &&
                        $component['short_name'] === 'CI'
                    );

                if (!$isIvoryCoast) {
                    return response()->json([
                        'success' => false,
                        'message' => 'L\'adresse doit être en Côte d\'Ivoire',
                        'address' => $address
                    ], 422);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Adresse validée',
                    'address' => [
                        'formatted_address' => $location['formatted_address'],
                        'latitude' => $location['geometry']['location']['lat'],
                        'longitude' => $location['geometry']['location']['lng'],
                        'address_components' => $location['address_components'],
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Adresse introuvable ou invalide'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Erreur validation adresse', [
                'error' => $e->getMessage(),
                'address' => $address
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation'
            ], 500);
        }
    }
}
