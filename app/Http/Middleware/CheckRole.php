<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!auth()->check()) {
            return redirect('/login');
        }

        $userRole = auth()->user()->role;

        // Mapper pasteur -> responsable_famille pour accès aux fonctionnalités identiques
        $effectiveRole = ($userRole === 'pasteur') ? 'responsable_famille' : $userRole;

        if (in_array($effectiveRole, $roles) || in_array($userRole, $roles)) {
            return $next($request);
        }

        abort(403, 'Accès non autorisé pour ce rôle.');
    }
}
