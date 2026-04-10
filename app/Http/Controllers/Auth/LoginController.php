<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuthenticationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LoginController extends Controller
{
    /**
     * Afficher le formulaire de connexion
     */
    public function show()
    {
        return Inertia::render('login');
    }

    /**
     * Authentifier l'utilisateur et le connecter
     * Accepte: email OU identifier
     */
    public function login(Request $request)
    {
        Log::info('Login attempt received', [
            'all_data' => $request->all(),
            'headers' => $request->headers->keys(),
        ]);

        // Validation
        $request->validate([
            'identifiant' => ['required', 'string'],
            'password' => ['required', 'string'],
            'redirect_to' => ['nullable', 'string', 'max:2048'],
        ], [
            'identifiant.required' => 'Veuillez entrer votre identifiant ou email.',
            'password.required' => 'Le mot de passe est requis.',
        ]);

        $login = $request->input('identifiant');
        $password = $request->input('password');

        // Chercher par identifier OU email (incluant les soft-deleted)
        $user = User::withTrashed()
            ->where('identifier', $login)
            ->orWhere('email', $login)
            ->first();

        // Message générique pour éviter l'énumération d'utilisateurs
        $genericErrorMessage = 'Identifiant ou mot de passe incorrect.';

        // Utilisateur non trouvé
        if (!$user) {
            Log::warning('Login attempt with non-existent identifier/email', ['login' => $login]);

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['message' => $genericErrorMessage], 422);
            }

            throw ValidationException::withMessages([
                'identifiant' => $genericErrorMessage,
            ]);
        }

        // Vérifier si le compte est soft-deleted
        if ($user->trashed()) {
            Log::warning('Login attempt on deleted account', ['user_id' => $user->id]);

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['message' => $genericErrorMessage], 422);
            }

            throw ValidationException::withMessages([
                'identifiant' => $genericErrorMessage,
            ]);
        }

        // Vérifier le mot de passe
        if (!Hash::check($password, $user->password)) {
            Log::warning('Failed login attempt', ['user_id' => $user->id, 'login' => $login]);

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['message' => $genericErrorMessage], 422);
            }

            throw ValidationException::withMessages([
                'password' => $genericErrorMessage,
            ]);
        }

        // Vérifier si le compte est actif
        if (isset($user->is_active) && $user->is_active === false) {
            Log::warning('Login attempt on inactive account', ['user_id' => $user->id]);

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['message' => $genericErrorMessage], 422);
            }

            throw ValidationException::withMessages([
                'identifiant' => $genericErrorMessage,
            ]);
        }

        // Authentifier l'utilisateur
        Auth::login($user);

        // Regénérer la session pour la sécurité
        $request->session()->regenerate();

        // Logger la connexion
        Log::info('User logged in successfully', [
            'user_id' => $user->id,
            'identifier' => $user->identifier,
            'email' => $user->email,
        ]);

        // Mettre à jour last_login_at
        $user->update(['last_login_at' => now()]);

        // Déterminer la route de redirection selon le rôle
        $redirectRoute = match ($user->role) {
            'admin' => 'admin.dashboard',
            'conducteur' => 'conducteur.dashboard',
            'responsable_famille' => 'responsable_famille.dashboard',
            'pasteur' => 'pasteur.dashboard',
            'membre_famille' => 'membre_famille.dashboard',
            'tresorier' => 'membre_famille.dashboard',
            default => 'dashboard',
        };

        $redirectUrl = route($redirectRoute);
        $requestedRedirect = trim((string) $request->input('redirect_to', ''));

        if (
            $requestedRedirect !== ''
            && $this->isSafeLocalRedirect($requestedRedirect)
            && $this->canUseCustomRedirect($user, $requestedRedirect)
        ) {
            $redirectUrl = $requestedRedirect;
        }

        // Si c'est une requête JSON/AJAX (fetch depuis le login)
        if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success' => true,
                'message' => 'Authentification réussie',
                'user' => [
                    'id' => $user->id,
                    'prenom' => $user->prenom,
                    'nom' => $user->nom,
                    'email' => $user->email,
                    'identifier' => $user->identifier,
                    'role' => $user->role,
                ],
                'redirect_url' => $redirectUrl
            ], 200);
        }

        // Redirection classique avec les données en session flash
        return redirect()->to($redirectUrl)
            ->with('success', 'Bienvenue ' . $user->nom . '!')
            ->with('just_logged_in', true)
            ->with('user_welcome_name', $user->nom);
    }

    private function isSafeLocalRedirect(string $redirect): bool
    {
        if (str_starts_with($redirect, 'http://') || str_starts_with($redirect, 'https://') || str_starts_with($redirect, '//')) {
            return false;
        }

        return str_starts_with($redirect, '/');
    }

    private function canUseCustomRedirect(User $user, string $redirect): bool
    {
        $normalized = mb_strtolower($redirect);

        if (str_contains($normalized, '/membre-famille/tresorerie')) {
            return in_array($user->role, ['membre_famille', 'tresorier'], true);
        }

        return true;
    }

    /**
     * Déconnecter l'utilisateur
     */
    public function logout(Request $request)
    {
        Log::info('User logged out', ['user_id' => Auth::id()]);

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Vous avez été déconnecté.');
    }
}
