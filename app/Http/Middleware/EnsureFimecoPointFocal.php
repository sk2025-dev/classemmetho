<?php

namespace App\Http\Middleware;

use App\Support\FimecoAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFimecoPointFocal
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(
            FimecoAccess::isPointFocal($request->user()),
            403,
            'Accès réservé au Point Focal FIMECO de la classe.'
        );

        return $next($request);
    }
}
