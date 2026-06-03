<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ville;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class VilleController extends Controller
{
    public function index(Request $request)
    {
        try {
            $searchTerm = $request->input('nom', '');
            $limit = $request->input('limit', 500);

            $cacheKey = 'villes_search_' . md5($searchTerm . '_' . $limit);

            $villes = Cache::remember($cacheKey, 3600, function () use ($searchTerm, $limit) {
                $query = Ville::select('id', 'nom');

                if (!empty($searchTerm)) {
                    $query->where('nom', 'LIKE', $searchTerm . '%')
                          ->orWhere('nom', 'LIKE', '%' . $searchTerm . '%');
                }

                return $query->orderBy('nom', 'ASC')
                             ->limit($limit)
                             ->get()
                             ->toArray();
            });

            return response()->json($villes, 200);
        } catch (\Exception $e) {
            \Log::error('Erreur API villes: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Erreur lors de la recherche'], 500);
        }
    }
}
