<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiUtf8Encoding
{
    /**
     * Ensure all API JSON responses use UTF-8 encoding
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only add UTF-8 charset to JSON responses
        $contentType = $response->headers->get('content-type', '');

        if (strpos($contentType, 'application/json') !== false) {
            if (strpos($contentType, 'charset') === false) {
                $response->headers->set('content-type', 'application/json; charset=utf-8');
            }
        }

        return $response;
    }
}
