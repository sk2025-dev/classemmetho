<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Afficher le profil de l'utilisateur
     */
    public function show()
    {
        $user = Auth::user();

        return Inertia::render('Profile/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'identifier' => $user->identifier,
                'role' => $user->role,
                'created_at' => $user->created_at,
                'last_login_at' => $user->last_login_at,
            ]
        ]);
    }

    /**
     * Mettre à jour le profil de l'utilisateur
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
        ], [
            'email.unique' => 'Cet email est déjà utilisé.',
            'email.email' => 'Veuillez entrer une adresse email valide.',
        ]);

        $user->update(array_filter($validated));

        return back()->with('success', 'Profil mis à jour avec succès.');
    }

    /**
     * Changer l'identifiant de l'utilisateur
     */
    public function updateIdentifier(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_identifier' => 'required|string|min:3|max:50|unique:users,identifier,' . $user->id,
        ], [
            'new_identifier.unique' => 'Cet identifiant est déjà utilisé.',
            'new_identifier.min' => 'L\'identifiant doit contenir au moins 3 caractères.',
        ]);

        // Vérifier le mot de passe actuel
        if (!Hash::check($validated['current_password'], $user->password)) {
            return back()->withErrors(['current_password' => 'Le mot de passe actuel est incorrect.']);
        }

        // Mettre à jour l'identifiant
        $oldIdentifier = $user->identifier;
        $user->update(['identifier' => strtoupper($validated['new_identifier'])]);

        return back()->with('success', "Identifiant changé de '{$oldIdentifier}' à '{$user->identifier}'.");
    }

    /**
     * Changer le mot de passe de l'utilisateur
     */
    public function changePassword(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]+$/',
            ],
        ], [
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.regex' => 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
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

        return back()->with('success', 'Votre mot de passe a été changé avec succès.');
    }
}
