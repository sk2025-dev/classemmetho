<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUtf8Encoding
{
    /**
     * Ensure all responses use UTF-8 encoding
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Force UTF-8 charset on all responses
        $contentType = $response->headers->get('content-type', '');

        if (empty($contentType)) {
            $response->headers->set('content-type', 'text/html; charset=utf-8');
        } elseif (strpos($contentType, 'charset') === false) {
            // Add charset if not already present
            if (strpos($contentType, 'application/json') !== false) {
                $response->headers->set('content-type', 'application/json; charset=utf-8');
            } elseif (strpos($contentType, 'text/html') !== false) {
                $response->headers->set('content-type', 'text/html; charset=utf-8');
            } elseif (strpos($contentType, 'text/') !== false) {
                $response->headers->set('content-type', $contentType . '; charset=utf-8');
            }
        }

        return $response;
    }
}
