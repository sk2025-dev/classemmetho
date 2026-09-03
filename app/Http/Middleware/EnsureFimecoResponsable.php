<?php

namespace App\Http\Middleware;

use App\Support\FimecoAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFimecoResponsable
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless(FimecoAccess::canManage($user), 403, 'Accès réservé au Responsable FIMECO.');

        return $next($request);
    }
}
