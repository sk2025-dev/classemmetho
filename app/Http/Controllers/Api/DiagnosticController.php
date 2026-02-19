<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DiagnosticController extends Controller
{
    /**
     * Check authentication status for debugging
     */
    public function checkAuth(Request $request)
    {
        $auth = auth('web');

        return response()->json([
            'authenticated' => $auth->check(),
            'user_id' => $auth->id(),
            'user_role' => $auth->user()?->role,
            'user_identifier' => $auth->user()?->identifier,
            'session_id' => session()->getId(),
            'has_session' => session()->has('XSRF-TOKEN'),
            'request_headers' => [
                'accept' => $request->header('Accept'),
                'content-type' => $request->header('Content-Type'),
                'x-requested-with' => $request->header('X-Requested-With'),
                'cookie' => $request->header('Cookie') ? 'present' : 'missing',
            ],
            'cookies' => array_keys($request->cookies->all()),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
