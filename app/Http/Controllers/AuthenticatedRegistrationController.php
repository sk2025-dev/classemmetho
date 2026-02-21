<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Family;
use App\Mail\SendCredentials;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Exception;

/**
 * Contrôleur pour l'enregistrement des utilisateurs par des utilisateurs authentifiés
 *
 * Crée directement dans la table users sans passage par la table inscriptions
 * Pas de besoin d'approbation
 */
class AuthenticatedRegistrationController extends Controller
{
    /**
     * Créer une nouvelle famille avec responsable
     * POST /api/authenticated/register/family
     */
    public function registerFamily(Request $request)
    {
        $this->authorize('create', Family::class);

        $validated = $request->validate([
            'nom_responsable' => 'required|string|max:255',
            'prenom_responsable' => 'required|string|max:255',
            'email_responsable' => 'required|email|unique:users,email',
            'telephone_responsable' => 'required|string|max:20',
            'date_naissance_responsable' => 'required|date',
            'genre_responsable' => 'required|in:M,F',
            'classe_id' => 'required|exists:classes,id',
            'nom_famille' => 'required|string|max:255',
            'adresse_famille' => 'nullable|string|max:255',
            'ville_id_famille' => 'nullable|exists:villes,id',
            'telephone_famille' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            $user = DB::transaction(function () use ($validated) {
                // Créer l'utilisateur responsable
                $identifier = User::generateIdentifier(
                    $validated['nom_responsable'],
                    $validated['prenom_responsable'],
                    $validated['date_naissance_responsable']
                );

                // D'abord créer la famille
                $family = Family::create([
                    'nom' => $validated['nom_famille'],
                    'classe_id' => $validated['classe_id'],
                    'adresse' => $validated['adresse_famille'],
                    'ville_id' => $validated['ville_id_famille'],
                    'telephone' => $validated['telephone_famille'],
                ]);

                $user = User::create([
                    'nom' => $validated['nom_responsable'],
                    'prenom' => $validated['prenom_responsable'],
                    'email' => $validated['email_responsable'],
                    'password' => bcrypt($validated['password']),
                    'telephone' => $validated['telephone_responsable'],
                    'date_naissance' => $validated['date_naissance_responsable'],
                    'genre' => $validated['genre_responsable'],
                    'classe_id' => $validated['classe_id'],
                    'family_id' => $family->id,
                    'is_family_responsible' => true,
                    'last_login_at' => null,
                    'identifier' => $identifier,
                    'role' => 'responsable_famille',
                ]);

                // Mettre à jour la famille avec le responsable
                $family->update(['responsable_id' => $user->id]);

                // Relation responsable-famille créée via user.family_id
                // Plus besoin de FamilyMember::create() - table supprimée

                return $user;
            });

            // 📧 Envoyer les identifiants et mot de passe par email
            try {
                Mail::to($user->email)->send(new SendCredentials($user, $user->identifier, $validated['password']));
                $user->credentials_sent_at = now();
                $user->save();
            } catch (\Exception $e) {
                Log::error('Erreur lors de l\'envoi des identifiants', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Famille créée avec succès',
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->nom . ' ' . $user->prenom,
                ]
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la famille: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Ajouter un nouveau conducteur (par utilisateur authentifié)
     * POST /api/authenticated/register/conductor
     */
    public function registerConductor(Request $request)
    {
        // Autoriser seulement les admins ou les conducteurs existants
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|max:20',
            'telephone2' => 'nullable|string|max:20',
            'date_naissance' => 'required|date',
            'genre' => 'required|in:M,F',
            'fonction_professionnelle' => 'nullable|string|max:255',
            'classe_id' => 'required|exists:classes,id',
            'selected_roles' => 'nullable|array',
            'selected_roles.*' => 'exists:church_roles,id',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            $user = DB::transaction(function () use ($validated) {
                // Créer l'utilisateur conducteur
                $identifier = User::generateIdentifier(
                    $validated['nom'],
                    $validated['prenom'],
                    $validated['date_naissance']
                );

                $user = User::create([
                    'nom' => $validated['nom'],
                    'prenom' => $validated['prenom'],
                    'email' => $validated['email'],
                    'password' => bcrypt($validated['password']),
                    'telephone' => $validated['telephone'],
                    'telephone2' => $validated['telephone2'],
                    'date_naissance' => $validated['date_naissance'],
                    'genre' => $validated['genre'],
                    'classe_id' => $validated['classe_id'],
                    'last_login_at' => null,
                    'identifier' => $identifier,
                    'role' => 'conducteur',
                ]);

                // Attacher les rôles d'église si fournis
                if (!empty($validated['selected_roles'])) {
                    $user->churchRoles()->sync($validated['selected_roles']);
                }
                return $user;
            });

            // 📧 Envoyer les identifiants et mot de passe par email
            try {
                Mail::to($user->email)->send(new SendCredentials($user, $user->identifier, $validated['password']));
                $user->credentials_sent_at = now();
                $user->save();
            } catch (\Exception $e) {
                Log::error('Erreur lors de l\'envoi des identifiants', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Conducteur créé avec succès',
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->nom . ' ' . $user->prenom,
                ]
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du conducteur: ' . $e->getMessage(),
            ], 400);
        }
    }
}
