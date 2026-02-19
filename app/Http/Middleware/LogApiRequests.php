<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    /**
     * Log incoming API requests for debugging.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $isApiRequest = $request->is('api/*');

        if ($isApiRequest) {
            Log::channel('api')->debug('API Request', [
                'method' => $request->getMethod(),
                'path' => $request->path(),
                'ip' => $request->ip(),
                'authenticated' => auth('web')->check(),
                'user_id' => auth('web')->id(),
                'user_role' => auth('web')->user()?->role ?? 'N/A',
                'headers' => [
                    'Accept' => $request->header('Accept'),
                    'X-Requested-With' => $request->header('X-Requested-With'),
                ]
            ]);
        }

        return $next($request);
    }
}
