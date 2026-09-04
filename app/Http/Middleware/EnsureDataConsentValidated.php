<?php

namespace App\Http\Middleware;

use App\Support\DataConsent;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bloque toute la plateforme (sauf l'écran de consentement lui-même et la
 * déconnexion) tant que l'utilisateur connecté — ou le responsable de sa
 * famille — n'a pas validé les conditions d'utilisation des données
 * personnelles, quand la fonctionnalité est active (voir DataConsent).
 */
class EnsureDataConsentValidated
{
    /**
     * Routes toujours accessibles, même sans consentement validé.
     */
    private const ROUTES_AUTORISEES = [
        'consentement.show',
        'consentement.valider',
        'logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user || !DataConsent::isEnabled()) {
            return $next($request);
        }

        if (in_array($request->route()?->getName(), self::ROUTES_AUTORISEES, true)) {
            return $next($request);
        }

        if (!$user->aValideConsentement()) {
            return redirect()->route('consentement.show');
        }

        return $next($request);
    }
}
