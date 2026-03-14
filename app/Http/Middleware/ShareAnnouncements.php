<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ActeLiturgique;
use Illuminate\Support\Facades\Log;

class ShareAnnouncements
{
    public function handle(Request $request, Closure $next)
    {
        // Récupère les annonces publiées des 30 derniers jours
        $annonces = ActeLiturgique::where('est_annonce', true)
            ->whereIn('statut', ['PUBLIEE']) // Adaptez selon vos statuts réels
            ->where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['id', 'details', 'created_at']);

        // Log pour déboguer (à consulter dans storage/logs/laravel.log)
        Log::info('Middleware ShareAnnouncements - Nombre d\'annonces trouvées : ' . $annonces->count());
        if ($annonces->count() > 0) {
            Log::info('Première annonce : ', $annonces->first()->toArray());
        }

        // Si aucune annonce, on peut éventuellement fournir un message par défaut (optionnel)
        // Mais le frontend gère déjà un message par défaut

        Inertia::share('flashAnnouncements', $annonces);

        return $next($request);
    }
}