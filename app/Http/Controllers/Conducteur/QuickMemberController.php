<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserSacrement;
use App\Mail\SendCredentials;
use App\Traits\GeneratesIdentifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class QuickMemberController extends Controller
{
    use GeneratesIdentifier;

    /**
     * Ajouter rapidement un simple membre à la classe du conducteur
     * POST /conducteur/quick-member
     *
     * C'est un endpoint simplifié pour que le conducteur ajoute un membre sans créer une famille entière
     * Les données du membre vont directement dans la table users
     */
    public function store(Request $request)
    {
        try {
            // Valider les données du formulaire simplifié
            $validated = $request->validate([
                // Données du membre
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'email' => 'nullable|email|unique:users,email',
                'telephone' => 'nullable|string|max:20',
                'telephone2' => 'nullable|string|max:20',
                'genre' => 'required|in:M,F',
                'date_naissance' => 'nullable|date',
                'statut_marital' => 'nullable|string|max:100',
                'date_mariage' => 'nullable|date',
                'lieu_mariage' => 'nullable|string|max:255',
                'profession' => 'nullable|string|max:255',
                'fonction_id' => 'nullable|exists:fonctions,id',
                'relation' => 'nullable|string|max:100', // Pour les données de la famille
                'photo' => 'nullable|image|max:2048', // Max 2MB

                // Sacrements
                'baptise' => 'nullable|in:true,false,1,0',
                'date_bapteme' => 'nullable|date',
                'lieu_bapteme' => 'nullable|string|max:255',
                'premiere_communion' => 'nullable|in:true,false,1,0',
                'date_premiere_communion' => 'nullable|date',
                'lieu_premiere_communion' => 'nullable|string|max:255',
                'marie_religieusement' => 'nullable|in:true,false,1,0',
                'date_mariage_religieux' => 'nullable|date',
                'lieu_mariage_religieux' => 'nullable|string|max:255',
            ]);

            // Vérifier que le conducteur est connecté
            $conducteur = auth()->user();
            if (!$conducteur || $conducteur->role !== 'conducteur') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé. Seuls les conducteurs peuvent ajouter des membres.'
                ], 403);
            }

            // Récupérer la classe ID du conducteur
            $classeId = $conducteur->getManagedClasses()->first()?->id;
            if (!$classeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune classe assignée à votre compte conducteur.'
                ], 404);
            }

            // Récupérer la famille du conducteur (si elle existe)
            $familyId = $conducteur->family_id;

            DB::beginTransaction();

            // Traiter la photo si présente
            $photoPath = null;
            if ($request->hasFile('photo')) {
                $photoFile = $request->file('photo');
                if ($photoFile && $photoFile->isValid()) {
                    $mime = $photoFile->getMimeType();
                    if ($mime && str_starts_with($mime, 'image/')) {
                        $photoPath = $photoFile->store('family_members', 'public');
                    }
                }
            }

            // Générer un identifiant unique via le trait
            $identifiant = self::generateIdentifier(
                $validated['nom'],
                $validated['prenom'],
                $validated['date_naissance'] ?? null
            );
            $password = '11111'; // Mot de passe fixe

            // Créer le nouvel utilisateur (membre)
            $newMember = User::create([
                'name' => trim($validated['prenom'] . ' ' . $validated['nom']),
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'] ?? null,
                'password' => bcrypt($password),
                'identifier' => $identifiant,
                'role' => 'membre_famille',
                'telephone' => $validated['telephone'] ?? null,
                'telephone2' => $validated['telephone2'] ?? null,
                'photo_path' => $photoPath,
                'genre' => $validated['genre'],
                'date_naissance' => $validated['date_naissance'] ?? null,
                'profession' => $validated['profession'] ?? null,
                'classe_id' => $classeId,
                'family_id' => $familyId,
                'fonction_id' => $validated['fonction_id'] ?? null,
                'statut' => 'actif',
                'must_change_password' => !empty($validated['email']),
                'email_verified_at' => !empty($validated['email']) ? now() : null,
            ]);

            // Créer les données de sacrement si fournies
            UserSacrement::create([
                'user_id' => $newMember->id,
                'est_marie' => $this->stringToBoolean($validated['statut_marital'] === 'marie'),
                'mariage_civil_date' => $validated['date_mariage'] ?? null,
                'mariage_civil_lieu' => $validated['lieu_mariage'] ?? null,
                'baptise' => $this->stringToBoolean($validated['baptise'] ?? false),
                'bapteme_date' => $validated['date_bapteme'] ?? null,
                'bapteme_lieu' => $validated['lieu_bapteme'] ?? null,
                'premiere_communion' => $this->stringToBoolean($validated['premiere_communion'] ?? false),
                'premiere_communion_date' => $validated['date_premiere_communion'] ?? null,
                'premiere_communion_lieu' => $validated['lieu_premiere_communion'] ?? null,
                'marie_religieusement' => $this->stringToBoolean($validated['marie_religieusement'] ?? false),
                'mariage_religieux_date' => $validated['date_mariage_religieux'] ?? null,
                'mariage_religieux_lieu' => $validated['lieu_mariage_religieux'] ?? null,
            ]);

            // Envoyer email si l'utilisateur a fourni un email
            if (!empty($validated['email'])) {
                try {
                    Mail::to($newMember->email)->send(new SendCredentials($newMember, $identifiant, $password));
                } catch (\Exception $emailError) {
                    Log::error('Erreur envoi email membre: ' . $emailError->getMessage());
                }
            }

            DB::commit();

            Log::info('Membre ajouté rapidement par conducteur', [
                'member_id' => $newMember->id,
                'conducteur_id' => $conducteur->id,
                'classe_id' => $classeId,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Membre ajouté avec succès à votre classe',
                'member' => [
                    'id' => $newMember->id,
                    'nom' => $newMember->nom,
                    'prenom' => $newMember->prenom,
                    'email' => $newMember->email,
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur ajout rapide membre: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'ajout du membre.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Convertir une string 'true'/'false' ou booléen en entier 1/0
     */
    private function stringToBoolean($value)
    {
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }

        if (is_string($value)) {
            return in_array(strtolower($value), ['true', '1', 'yes', 'on']) ? 1 : 0;
        }

        return (bool)$value ? 1 : 0;
    }
}
