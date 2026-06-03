<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
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
     * Accepte: code membre
     */
    public function login(Request $request)
    {
        Log::info('Login attempt received', [
            'all_data' => $request->all(),
            'headers' => $request->headers->keys(),
        ]);

        // Validation
        $request->validate([
            'code_membre' => ['required', 'string'],
            'password' => ['required', 'string'],
            'redirect_to' => ['nullable', 'string', 'max:2048'],
        ], [
            'code_membre.required' => 'Veuillez entrer votre code membre.',
            'password.required' => 'Le mot de passe est requis.',
        ]);

        $login = trim((string) $request->input('code_membre'));
        $normalizedLogin = mb_strtoupper($login);
        $password = $request->input('password');

        // Chercher par code membre (incluant soft-deleted), en ignorant les espaces de bord et la casse
        $user = User::withTrashed()
            ->whereRaw('UPPER(TRIM(code_membre)) = ?', [$normalizedLogin])
            ->first();

        // Message generique pour eviter l'enumeration d'utilisateurs
        $genericErrorMessage = 'Code membre ou mot de passe incorrect.';

        // Utilisateur non trouvé
        if (!$user) {
            Log::warning('Login attempt with non-existent member code', ['code_membre' => $login]);

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['message' => $genericErrorMessage], 422);
            }

            throw ValidationException::withMessages([
                'code_membre' => $genericErrorMessage,
            ]);
        }

        // Vérifier si le compte est soft-deleted
        if ($user->trashed()) {
            Log::warning('Login attempt on deleted account', ['user_id' => $user->id]);
            $deletedMessage = 'Ce compte a ete supprime. Veuillez contacter l administrateur.';

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['message' => $deletedMessage], 422);
            }

            throw ValidationException::withMessages([
                'code_membre' => $deletedMessage,
            ]);
        }

        // Vérifier le mot de passe
        if (! $this->passwordMatches($password, (string) $user->password)) {
            Log::warning('Failed login attempt', ['user_id' => $user->id, 'login' => $login]);

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['message' => $genericErrorMessage], 422);
            }

            throw ValidationException::withMessages([
                'password' => $genericErrorMessage,
            ]);
        }

        // Vérifier si le compte est actif
        $isInactiveByStatus = in_array(
            strtolower((string) ($user->status ?? $user->statut ?? 'active')),
            ['inactive', 'inactif'],
            true
        );

        if ((isset($user->is_active) && $user->is_active === false) || $isInactiveByStatus) {
            Log::warning('Login attempt on inactive account', ['user_id' => $user->id]);
            $inactiveMessage = 'Ce compte est inactif. Veuillez contacter l administrateur.';

            if ($request->wantsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json(['message' => $inactiveMessage], 422);
            }

            throw ValidationException::withMessages([
                'code_membre' => $inactiveMessage,
            ]);
        }

        // Authentifier l'utilisateur
        Auth::login($user);

        // Regénérer la session pour la sécurité
        $request->session()->regenerate();

        // Logger la connexion
        Log::info('User logged in successfully', [
            'user_id' => $user->id,
            'code_membre' => $user->code_membre,
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
                    'code_membre' => $user->code_membre,
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

    private function passwordMatches(string $password, string $hashedPassword): bool
    {
        return Hash::check($password, $hashedPassword);
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

