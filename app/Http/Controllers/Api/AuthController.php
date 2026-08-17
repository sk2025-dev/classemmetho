<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authentifie via code_membre + password et retourne un token Sanctum.
     * Destiné aux clients sans session navigateur partagée (appli mobile, scripts).
     */
    public function login(Request $request)
    {
        $request->validate([
            'code_membre' => ['required', 'string'],
            'password'    => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $normalizedLogin = mb_strtoupper(trim((string) $request->input('code_membre')));

        $user = User::withTrashed()
            ->whereRaw('UPPER(TRIM(code_membre)) = ?', [$normalizedLogin])
            ->first();

        $genericErrorMessage = 'Code membre ou mot de passe incorrect.';

        if (!$user || $user->trashed() || !Hash::check((string) $request->input('password'), (string) $user->password)) {
            Log::warning('API login failed', ['code_membre' => $request->input('code_membre')]);

            throw ValidationException::withMessages([
                'code_membre' => $genericErrorMessage,
            ]);
        }

        $isInactiveByStatus = in_array(
            strtolower((string) ($user->status ?? 'active')),
            ['inactive', 'inactif'],
            true
        );

        if ((isset($user->is_active) && $user->is_active === false) || $isInactiveByStatus) {
            throw ValidationException::withMessages([
                'code_membre' => 'Ce compte est inactif. Veuillez contacter l administrateur.',
            ]);
        }

        $deviceName = $request->input('device_name', 'mobile');
        $token = $user->createToken($deviceName)->plainTextToken;

        $user->update(['last_login_at' => now()]);

        Log::info('API login success', ['user_id' => $user->id, 'device_name' => $deviceName]);

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'          => $user->id,
                'prenom'      => $user->prenom,
                'nom'         => $user->nom,
                'email'       => $user->email,
                'code_membre' => $user->code_membre,
                'identifier'  => $user->identifier,
                'role'        => $user->role,
            ],
        ]);
    }

    /**
     * Révoque le token utilisé pour la requête courante.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    /**
     * Retourne l'utilisateur authentifié via le token courant.
     */
    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }
}
