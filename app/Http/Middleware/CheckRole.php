<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

        // Debug: Log the user role
        $user = auth()->user();
        \Log::debug('CheckRole middleware - User role check:', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'user_role_raw' => $user->role,
            'user_role_type' => gettype($user->role),
            'expected_roles' => $roles,
            'request_uri' => $request->getUri(),
        ]);

        // Check role with case-insensitive comparison
        $userRole = strtolower($user->role);
        $allowedRoles = array_map('strtolower', $roles);

        if (in_array($userRole, $allowedRoles)) {
            return $next($request);
        }

        // Throw AuthorizationException for proper JSON handling in Handler
        throw new AuthorizationException('Insufficient permissions - Rôle insufficient.');
    }
}
