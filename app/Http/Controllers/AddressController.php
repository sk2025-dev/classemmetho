<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AddressController extends Controller
{
    /**
     * Recherche d'adresses via Google Places API
     */
    public function autocomplete(Request $request): JsonResponse
    {
        try {
            $query = $request->get('query');

            if (!$query || strlen($query) < 3) {
                return response()->json(['predictions' => []]);
            }

            $apiKey = config('services.google_maps.api_key');
            if (!$apiKey) {
                Log::error('Google Maps API key not configured');
                return response()->json(['error' => 'Configuration manquante'], 500);
            }

            $response = Http::get('https://maps.googleapis.com/maps/api/place/autocomplete/json', [
                'input' => $query,
                'key' => $apiKey,
                'language' => 'fr',
                'components' => 'country:fr',
                'types' => 'address'
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'predictions' => $data['predictions'] ?? []
                ]);
            }

            Log::error('Google Places API error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return response()->json(['error' => 'Erreur API externe'], 500);

        } catch (\Exception $e) {
            Log::error('Address autocomplete error', [
                'message' => $e->getMessage(),
                'query' => $request->get('query')
            ]);

            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Obtenir les détails d'une adresse
     */
    public function details(Request $request): JsonResponse
    {
        try {
            $placeId = $request->get('place_id');

            if (!$placeId) {
                return response()->json(['error' => 'Place ID requis'], 400);
            }

            $apiKey = config('services.google_maps.api_key');
            if (!$apiKey) {
                Log::error('Google Maps API key not configured');
                return response()->json(['error' => 'Configuration manquante'], 500);
            }

            $response = Http::get('https://maps.googleapis.com/maps/api/place/details/json', [
                'place_id' => $placeId,
                'key' => $apiKey,
                'language' => 'fr',
                'fields' => 'address_components,formatted_address,geometry'
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return response()->json($data['result'] ?? []);
            }

            Log::error('Google Places Details API error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return response()->json(['error' => 'Erreur API externe'], 500);

        } catch (\Exception $e) {
            Log::error('Address details error', [
                'message' => $e->getMessage(),
                'place_id' => $request->get('place_id')
            ]);

            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }
}
