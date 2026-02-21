<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CacheGetRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Ne mettre en cache que les requêtes GET
        if ($request->method() !== 'GET' || !Auth::check()) {
            return $next($request);
        }

        // Ne pas mettre en cache les requêtes avec pagination ou filtres complexes
        if ($request->has('page') || $request->has('sort') || $request->has('filter')) {
            return $next($request);
        }

        // Créer une clé de cache basée sur la route et les paramètres
        $cacheKey = 'http_' . md5($request->getPathInfo() . json_encode($request->all()));

        // Vérifier si la réponse est en cache
        if (Cache::has($cacheKey)) {
            return response(Cache::get($cacheKey), 200, [
                'X-Cache' => 'HIT',
                'Content-Type' => 'application/json'
            ]);
        }

        // Obtenir la réponse
        $response = $next($request);

        // Mettre en cache les réponses réussies
        if ($response->getStatusCode() === 200 && $response->headers->get('Content-Type') === 'application/json') {
            Cache::put($cacheKey, $response->getContent(), 300); // 5 minutes
            $response->header('X-Cache', 'MISS');
        }

        return $response;
    }
}
