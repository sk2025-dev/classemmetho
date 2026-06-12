<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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
        if (!Auth::check()) {
            return redirect('/login');
        }

        $user = Auth::user();
        $userRole = trim((string) $user->role);
        $isFamilyResponsible = (bool) ($user->is_family_responsible ?? false);

        // Mapper certains rôles vers un rôle effectif pour partager les mêmes accès.
        $effectiveRole = $userRole;
        if (in_array($userRole, ['pasteur', 'responsable'], true)) {
            $effectiveRole = 'responsable_famille';
        } elseif ($userRole === 'tresorier') {
            $effectiveRole = 'membre_famille';
        }

        if ($userRole === 'admin') {
            return $next($request);
        }

        Log::info('role check', compact('userRole', 'effectiveRole', 'roles', 'isFamilyResponsible'));

        if (
            in_array($effectiveRole, $roles, true) ||
            in_array($userRole, $roles, true) ||
            ($isFamilyResponsible && in_array('responsable_famille', $roles, true))
        ) {
            return $next($request);
        }

        // Le conducteur désigné président des conducteurs accède aussi au module Bureau des Conducteurs.
        if (in_array('bureau_conducteur', $roles, true) && $userRole === 'conducteur') {
            $fonctionNom = strtolower(trim((string) ($user->fonction?->nom ?? '')));
            if ($fonctionNom === 'président des conducteurs' || $fonctionNom === 'president des conducteurs') {
                return $next($request);
            }
        }

        abort(403, 'Accès non autorisé pour ce rôle.');
    }
}
