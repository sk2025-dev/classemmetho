<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Auth\Access\AuthorizationException;
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
            // Let the standard auth middleware handle unauthenticated requests
            abort(401, 'Unauthenticated');
        }

        if (in_array(auth()->user()->role, $roles)) {
            return $next($request);
        }

        // Throw AuthorizationException for proper JSON handling in Handler
        throw new AuthorizationException('Insufficient permissions - Rôle insufficient.');
    }
}
