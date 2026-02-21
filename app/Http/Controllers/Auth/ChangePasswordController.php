<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ChangePasswordController extends Controller
{
    /**
     * Afficher la page de changement de mot de passe
     */
    public function show()
    {
        $user = Auth::user();

        return Inertia::render('Auth/ChangePassword', [
            'mustChangePassword' => $user->must_change_password ?? false,
        ]);
    }

    /**
     * Traiter le changement de mot de passe
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Validation
        $validated = $request->validate([
            'current_password' => 'required|string|min:6',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]+$/',
                'different:current_password',
            ],
        ], [
            'password.regex' => 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'password.different' => 'Le nouveau mot de passe doit être différent de l\'ancien.',
            'current_password.required' => 'Veuillez entrer votre mot de passe actuel.',
        ]);

        // Vérifier le mot de passe actuel
        if (!Hash::check($validated['current_password'], $user->password)) {
            return back()->withErrors(['current_password' => 'Le mot de passe actuel est incorrect.']);
        }

        // Mettre à jour le mot de passe
        $user->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ]);

        // Message de succès
        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Votre mot de passe a été changé avec succès.',
                'redirect' => $this->getRedirectRoute($user),
            ], 200);
        }

        return redirect()
            ->route($this->getRedirectRoute($user))
            ->with('success', 'Votre mot de passe a été changé avec succès.');
    }

    /**
     * Obtenir la route de redirection basée sur le rôle
     */
    private function getRedirectRoute($user): string
    {
        return match ($user->role) {
            'admin' => 'admin.inscriptions',
            'conducteur' => 'conducteur.dashboard',
            'responsable_famille' => 'responsable.dashboard',
            'pasteur' => 'pasteur.dashboard',
            'membre_famille' => 'member.dashboard',
            default => 'welcome',
        };
    }
}
