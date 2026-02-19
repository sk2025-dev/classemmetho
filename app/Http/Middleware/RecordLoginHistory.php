<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\LoginHistory;

class RecordLoginHistory
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if (Auth::check()) {
            LoginHistory::create([
                'user_id' => Auth::id(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'success' => true,
                'metadata' => [
                    'timestamp' => now(),
                ],
            ]);

            // If user must change password, redirect to change password form
            $user = Auth::user();
            if ($user->must_change_password && !in_array($request->path(), ['profile/change-password', 'logout'])) {
                return redirect()->route('profile.change-password')
                    ->with('warning', 'Vous devez modifier votre mot de passe lors de la première connexion.');
            }
        }

        return $response;
    }
}
