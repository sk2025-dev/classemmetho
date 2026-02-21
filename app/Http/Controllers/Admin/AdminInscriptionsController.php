<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inscription;
use App\Models\User;
use App\Models\Family;
use App\Models\UserSacrement;
use App\Models\Classe;
use App\Models\Ville;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use App\Mail\AccountCreated;

class AdminInscriptionsController extends Controller
{
    /**
     * Traduire les messages d'erreur de validation en français
     */
    private function translateValidationMessages(array $errors): array
    {
        $translations = [
            'required' => 'requis(e)',
            'email' => 'doit être un email valide',
            'unique' => 'existe déjà',
            'regex' => 'format invalide',
            'max' => 'trop long (max :max)',
            'min' => 'trop court (min :min)',
            'date' => 'doit être une date valide',
            'before' => 'doit être une date passée',
            'in' => 'valeur invalide',
            'accepted' => 'doit être accepté',
            'image' => 'doit être une image',
            'mimes' => 'format de fichier invalide',
            'exists' => 'n\'existe pas',
        ];

        $translated = [];

        foreach ($errors as $field => $messages) {
            $translated[$field] = array_map(function ($message) use ($translations) {
                // Chercher la clé de traduction dans le message
                foreach ($translations as $key => $translation) {
                    if (strpos($message, $key) !== false) {
                        // Remplacer le message anglais par le français
                        return str_ireplace($key, $translation, $message);
                    }
                }

                // Messages spécifiques français
                if (strpos($message, 'already been taken') !== false) {
                    return 'existe déjà';
                }

                // Message français personnalisé
                if (strpos($message, 'The') === 0) {
                    // Extraire le nom du champ et retourner un message français
                    preg_match('/^The\s+(.+?)\s+(.+)/', $message, $matches);
                    if (isset($matches[2])) {
                        return $matches[2];
                    }
                }

                return $message;
            }, $messages);
        }

        return $translated;
    }

    /**
     * Afficher la page de sélection du type d'inscription
     */
    public function typeSelection()
    {
        return Inertia::render('Admin/Inscriptions/TypeSelection');
    }

    /**
     * Afficher le formulaire de création de famille
     */
    public function createFamilyForm()
    {
        return Inertia::render('Admin/Inscriptions/RegisterFamille');
    }

    /**
     * Afficher le formulaire de création de conducteur
     */
    public function createConductorForm()
    {
        return Inertia::render('Admin/Inscriptions/RegisterConducteur');
    }

    /**
     * Afficher le formulaire de création de pasteur
     */
    public function createPastorForm()
    {
        return Inertia::render('Admin/Inscriptions/RegisterPasteur');
    }

    /**
     * Créer directement une famille avec tous les utilisateurs
     * Admin crée = pas d'approbation requise
     */
    public function storeFamily(Request $request)
    {
        DB::beginTransaction();
        try {
            // Valider les données avec règles complètes
            $validated = $request->validate([
                'famille.nom' => 'required|string|max:255',
                'famille.adresse' => 'nullable|string|max:255',
                'famille.quartier' => 'nullable|string|max:255',
                'famille.ville' => 'required|exists:villes,id',
                'famille.telephone' => 'required|regex:/^[0-9]{10}$/',
                'famille.classe_id' => 'required|exists:classes,id',

                // RESPONSABLE - Informations personnelles
                'responsable.nom' => 'required|string|max:255',
                'responsable.prenom' => 'required|string|max:255',
                'responsable.email' => 'required|email|unique:users,email',
                'responsable.tel' => 'required|regex:/^[0-9]{10}$/',
                'responsable.dateNaissance' => 'required|date|before:today',
                'responsable.genre' => 'required|in:M,F',
                'responsable.profession' => 'required|string|max:255',
                'responsable.relation' => 'nullable|string|max:100',
                'responsable.lienParente' => 'nullable|string|max:255',
                'responsable.fonction_id' => 'nullable|integer|exists:fonctions,id',
                'responsable.fonction' => 'nullable|string|max:255',
                'responsable.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',

                // RESPONSABLE - Statut marital civil
                'responsable.statutMarital' => 'required|in:celibataire,marie,divorce,veuf,dot',
                'responsable.dateMariage' => 'nullable|date',
                'responsable.lieuMariage' => 'nullable|string|max:255',
                'responsable.dateDivorce' => 'nullable|date',
                'responsable.lieuDivorce' => 'nullable|string|max:255',
                'responsable.dateDeces' => 'nullable|date',
                'responsable.lieuDeces' => 'nullable|string|max:255',
                'responsable.dote' => 'nullable|date',
                'responsable.lieuDote' => 'nullable|string|max:255',

                // RESPONSABLE - Sacrements religieux
                'responsable.baptise' => 'nullable|in:0,1',
                'responsable.dateBapteme' => 'nullable|date',
                'responsable.lieuBapteme' => 'nullable|string|max:255',
                'responsable.premiereCommunion' => 'nullable|in:0,1',
                'responsable.datePremiereCommunion' => 'nullable|date',
                'responsable.lieuPremiereCommunion' => 'nullable|string|max:255',
                'responsable.marieReligieusement' => 'nullable|in:0,1',
                'responsable.dateMariageReligieux' => 'nullable|date',
                'responsable.lieuMariageReligieux' => 'nullable|string|max:255',

                // MEMBRES
                'membres' => 'nullable|array|max:20',
                'membres.*.nom' => 'required|string|max:255',
                'membres.*.prenom' => 'required|string|max:255',
                'membres.*.email' => 'required|email|unique:users,email',
                'membres.*.telephone' => 'nullable|regex:/^[0-9]{10}$/',
                'membres.*.dateNaissance' => 'required|date|before:today',
                'membres.*.genre' => 'required|in:M,F',
                'membres.*.profession' => 'required|string|max:255',
                'membres.*.relation' => 'required|string|max:100',
                'membres.*.fonction_id' => 'nullable|integer|exists:fonctions,id',
                'membres.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',

                // MEMBRES - Statut marital civil
                'membres.*.statutMarital' => 'required|in:celibataire,marie,divorce,veuf,dot',
                'membres.*.dateMariage' => 'nullable|date',
                'membres.*.lieuMariage' => 'nullable|string|max:255',
                'membres.*.dateDivorce' => 'nullable|date',
                'membres.*.lieuDivorce' => 'nullable|string|max:255',
                'membres.*.dateDeces' => 'nullable|date',
                'membres.*.lieuDeces' => 'nullable|string|max:255',
                'membres.*.dote' => 'nullable|date',
                'membres.*.lieuDote' => 'nullable|string|max:255',

                // MEMBRES - Sacrements religieux
                'membres.*.baptise' => 'nullable|in:0,1',
                'membres.*.dateBapteme' => 'nullable|date',
                'membres.*.lieuBapteme' => 'nullable|string|max:255',
                'membres.*.premiereCommunion' => 'nullable|in:0,1',
                'membres.*.datePremiereCommunion' => 'nullable|date',
                'membres.*.lieuPremiereCommunion' => 'nullable|string|max:255',
                'membres.*.marieReligieusement' => 'nullable|in:0,1',
                'membres.*.dateMariageReligieux' => 'nullable|date',
                'membres.*.lieuMariageReligieux' => 'nullable|string|max:255',

                // Consentement
                'consentement' => 'required|accepted',
            ]);

            // 1. Créer la famille
            $family = Family::create([
                'nom' => $validated['famille']['nom'],
                'adresse' => $validated['famille']['adresse'] ?? null,
                'quartier' => $validated['famille']['quartier'] ?? null,
                'ville_id' => $validated['famille']['ville'],
                'classe_id' => $validated['famille']['classe_id'],
                'telephone' => $validated['famille']['telephone'],
            ]);

            // Générer un mot de passe temporaire pour le responsable
            $tempPassword = $this->generateTempPassword();

            // Gérer la photo du responsable
            $photoPath = null;
            if ($request->hasFile('responsable.photo')) {
                $photoPath = $request->file('responsable.photo')->store('photos/users', 'public');
            }

            // 2. Créer l'utilisateur responsable
            $responsable = User::create([
                'nom' => strtoupper($validated['responsable']['nom']),
                'prenom' => ucfirst($validated['responsable']['prenom']),
                'email' => $validated['responsable']['email'],
                'password' => Hash::make($tempPassword),
                'identifier' => User::generateIdentifier(strtoupper($validated['responsable']['nom']), ucfirst($validated['responsable']['prenom']), $validated['responsable']['dateNaissance']),
                'telephone' => $validated['responsable']['tel'],
                'date_naissance' => $validated['responsable']['dateNaissance'],
                'genre' => $validated['responsable']['genre'],
                'profession' => $validated['responsable']['profession'],
                'relation' => $validated['responsable']['relation'] ?? null,
                'fonction_id' => $validated['responsable']['fonction_id'] ?? $validated['responsable']['fonction'] ?? null,
                'family_id' => $family->id,
                'role' => 'responsable_famille',
                'is_family_responsible' => true,
                'photo_path' => $photoPath,
                'classe_id' => $validated['famille']['classe_id'],
                'ville_id' => $validated['famille']['ville'],
            ]);

            $family->update(['responsable_id' => $responsable->id]);

            // 3. Créer les sacrements du responsable
            $this->createUserSacrements($responsable, $validated['responsable']);

            // 4. Créer les membres de la famille
            $membres = [];
            if (!empty($validated['membres']) && is_array($validated['membres'])) {
                foreach ($validated['membres'] as $index => $membreData) {
                    $membreTempPassword = $this->generateTempPassword();
                    $membreIdentifier = User::generateIdentifier(strtoupper($membreData['nom']), ucfirst($membreData['prenom']), $membreData['dateNaissance']);

                    // Gérer la photo du membre
                    $membrePhotoPath = null;
                    if ($request->hasFile("membres.{$index}.photo")) {
                        $membrePhotoPath = $request->file("membres.{$index}.photo")->store('photos/users', 'public');
                    }

                    $membre = User::create([
                        'nom' => strtoupper($membreData['nom']),
                        'prenom' => ucfirst($membreData['prenom']),
                        'email' => $membreData['email'],
                        'password' => Hash::make($membreTempPassword),
                        'identifier' => $membreIdentifier,
                        'telephone' => $membreData['telephone'] ?? null,
                        'date_naissance' => $membreData['dateNaissance'],
                        'genre' => $membreData['genre'],
                        'profession' => $membreData['profession'],
                        'relation' => $membreData['relation'] ?? null,
                        'fonction_id' => $membreData['fonction_id'] ?? $membreData['fonction'] ?? null,
                        'family_id' => $family->id,
                        'role' => 'membre_famille',
                        'photo_path' => $membrePhotoPath,
                        'classe_id' => $validated['famille']['classe_id'],
                        'ville_id' => $validated['famille']['ville'],
                    ]);

                    // Créer les sacrements du membre
                    $this->createUserSacrements($membre, $membreData);

                    // Stocker le membre et son mot de passe temporaire
                    $membres[] = ['user' => $membre, 'password' => $membreTempPassword];
                }
            }

            DB::commit();

            // Envoyer les emails avec les identifiants
            try {
                // Email au responsable
                Mail::to($responsable->email)->send(new AccountCreated($responsable, $tempPassword));

                // Emails aux membres
                foreach ($membres as $membreData) {
                    Mail::to($membreData['user']->email)->send(new AccountCreated($membreData['user'], $membreData['password']));
                }

                Log::info('Emails d\'identifiants envoyés pour la famille', [
                    'family_id' => $family->id,
                    'responsable_email' => $responsable->email,
                    'membres_count' => count($membres),
                ]);
            } catch (\Exception $e) {
                Log::warning('Erreur envoi emails pour famille ' . $family->id, [
                    'error' => $e->getMessage()
                ]);
            }

            Log::info('Famille créée directement par Admin', [
                'family_id' => $family->id,
                'responsable_id' => $responsable->id,
                'membres_count' => count($membres),
            ]);

            return response()->json([
                'success' => true,
                'message' => '🎉 Excellente nouvelle ! La famille a été créée avec succès. Tous les membres peuvent maintenant se connecter avec leur email et le mot de passe temporaire. Bienvenue dans notre communauté spirituelle !',
                'family_id' => $family->id,
                'temp_password' => $tempPassword, // Pour debug, à retirer en prod
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            // Retourner les erreurs de validation avec détails clairs
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création famille admin', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Message d'erreur clair basé sur le message
            $userMessage = 'Une erreur est survenue lors de la création de la famille.';

            if (strpos($e->getMessage(), 'already been taken') !== false) {
                $userMessage = '❌ Erreur: Cet email existe déjà dans la base de données. Veuillez utiliser un email différent.';
            } elseif (strpos($e->getMessage(), 'unique constraint') !== false) {
                $userMessage = '❌ Erreur: Ces données existent déjà. Veuillez vérifier et ré-essayer avec d\'autres informations.';
            }

            return response()->json([
                'success' => false,
                'message' => $userMessage,
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 422);
        }
    }

    /**
     * Créer directement un conducteur avec sa famille
     */
    public function storeConductor(Request $request)
    {
        DB::beginTransaction();
        try {
            // Valider les données avec règles complètes
            $validated = $request->validate([
                'famille.nom' => 'required|string|max:255',
                'famille.adresse' => 'nullable|string|max:255',
                'famille.quartier' => 'nullable|string|max:255',
                'famille.ville' => 'required|exists:villes,id',
                'famille.telephone' => 'required|regex:/^[0-9]{10}$/',
                'famille.classe_id' => 'required|exists:classes,id',

                // RESPONSABLE (CONDUCTEUR) - Informations personnelles
                'responsable.nom' => 'required|string|max:255',
                'responsable.prenom' => 'required|string|max:255',
                'responsable.email' => 'required|email|unique:users,email',
                'responsable.tel' => 'required|regex:/^[0-9]{10}$/',
                'responsable.dateNaissance' => 'required|date|before:today',
                'responsable.genre' => 'required|in:M,F',
                'responsable.profession' => 'required|string|max:255',
                'responsable.relation' => 'nullable|string|max:100',
                'responsable.lienParente' => 'nullable|string|max:255',
                'responsable.fonction_id' => 'nullable|integer|exists:fonctions,id',
                'responsable.fonction' => 'nullable|string|max:255',
                'responsable.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',

                // RESPONSABLE - Statut marital civil
                'responsable.statutMarital' => 'required|in:celibataire,marie,divorce,veuf,dot',
                'responsable.dateMariage' => 'nullable|date',
                'responsable.lieuMariage' => 'nullable|string|max:255',
                'responsable.dateDivorce' => 'nullable|date',
                'responsable.lieuDivorce' => 'nullable|string|max:255',
                'responsable.dateDeces' => 'nullable|date',
                'responsable.lieuDeces' => 'nullable|string|max:255',
                'responsable.dote' => 'nullable|date',
                'responsable.lieuDote' => 'nullable|string|max:255',

                // RESPONSABLE - Sacrements religieux
                'responsable.baptise' => 'nullable|in:0,1',
                'responsable.dateBapteme' => 'nullable|date',
                'responsable.lieuBapteme' => 'nullable|string|max:255',
                'responsable.premiereCommunion' => 'nullable|in:0,1',
                'responsable.datePremiereCommunion' => 'nullable|date',
                'responsable.lieuPremiereCommunion' => 'nullable|string|max:255',
                'responsable.marieReligieusement' => 'nullable|in:0,1',
                'responsable.dateMariageReligieux' => 'nullable|date',
                'responsable.lieuMariageReligieux' => 'nullable|string|max:255',

                // MEMBRES
                'membres' => 'nullable|array|max:20',
                'membres.*.nom' => 'required|string|max:255',
                'membres.*.prenom' => 'required|string|max:255',
                'membres.*.email' => 'required|email|unique:users,email',
                'membres.*.telephone' => 'nullable|regex:/^[0-9]{10}$/',
                'membres.*.dateNaissance' => 'required|date|before:today',
                'membres.*.genre' => 'required|in:M,F',
                'membres.*.profession' => 'required|string|max:255',
                'membres.*.relation' => 'required|string|max:100',
                'membres.*.lienParente' => 'nullable|string|max:255',
                'membres.*.fonction_id' => 'nullable|integer|exists:fonctions,id',
                'membres.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',

                // MEMBRES - Statut marital civil
                'membres.*.statutMarital' => 'required|in:celibataire,marie,divorce,veuf,dot',
                'membres.*.dateMariage' => 'nullable|date',
                'membres.*.lieuMariage' => 'nullable|string|max:255',
                'membres.*.dateDivorce' => 'nullable|date',
                'membres.*.lieuDivorce' => 'nullable|string|max:255',
                'membres.*.dateDeces' => 'nullable|date',
                'membres.*.lieuDeces' => 'nullable|string|max:255',
                'membres.*.dote' => 'nullable|date',
                'membres.*.lieuDote' => 'nullable|string|max:255',

                // MEMBRES - Sacrements religieux
                'membres.*.baptise' => 'nullable|boolean',
                'membres.*.dateBapteme' => 'nullable|date',
                'membres.*.lieuBapteme' => 'nullable|string|max:255',
                'membres.*.premiereCommunion' => 'nullable|boolean',
                'membres.*.datePremiereCommunion' => 'nullable|date',
                'membres.*.lieuPremiereCommunion' => 'nullable|string|max:255',
                'membres.*.marieReligieusement' => 'nullable|boolean',
                'membres.*.dateMariageReligieux' => 'nullable|date',
                'membres.*.lieuMariageReligieux' => 'nullable|string|max:255',

                // Consentement
                'consentement' => 'required|accepted',
            ]);

            // 1. Créer la famille
            $family = Family::create([
                'nom' => $validated['famille']['nom'],
                'adresse' => $validated['famille']['adresse'] ?? null,
                'quartier' => $validated['famille']['quartier'] ?? null,
                'ville_id' => $validated['famille']['ville'],
                'classe_id' => $validated['famille']['classe_id'],
                'telephone' => $validated['famille']['telephone'],
            ]);

            // Générer un mot de passe temporaire
            $tempPassword = $this->generateTempPassword();

            // Gérer la photo du conducteur
            $photoPath = null;
            if ($request->hasFile('responsable.photo')) {
                $photoPath = $request->file('responsable.photo')->store('photos/users', 'public');
            }

            // 2. Créer l'utilisateur conducteur avec role=conducteur
            $conductor = User::create([
                'nom' => strtoupper($validated['responsable']['nom']),
                'prenom' => ucfirst($validated['responsable']['prenom']),
                'email' => $validated['responsable']['email'],
                'password' => Hash::make($tempPassword),
                'identifier' => User::generateIdentifier(strtoupper($validated['responsable']['nom']), ucfirst($validated['responsable']['prenom']), $validated['responsable']['dateNaissance']),
                'telephone' => $validated['responsable']['tel'],
                'date_naissance' => $validated['responsable']['dateNaissance'],
                'genre' => $validated['responsable']['genre'],
                'profession' => $validated['responsable']['profession'],
                'relation' => $validated['responsable']['relation'] ?? null,
                'fonction_id' => $validated['responsable']['fonction_id'] ?? $validated['responsable']['fonction'] ?? null,
                'family_id' => $family->id,
                'role' => 'conducteur', // IMPORTANT: role conducteur
                'is_family_responsible' => false, // Conducteur n'est pas responsable de famille
                'photo_path' => $photoPath,
                'classe_id' => $validated['famille']['classe_id'],
                'ville_id' => $validated['famille']['ville'],
            ]);

            $family->update(['responsable_id' => $conductor->id]);

            // 3. Créer les sacrements du conducteur
            $this->createUserSacrements($conductor, $validated['responsable']);

            // 4. Créer les membres de la famille (optionnel)
            $membres = [];
            if (!empty($validated['membres']) && is_array($validated['membres'])) {
                foreach ($validated['membres'] as $index => $membreData) {
                    $membreTempPassword = $this->generateTempPassword();
                    $membreIdentifier = User::generateIdentifier(strtoupper($membreData['nom']), ucfirst($membreData['prenom']), $membreData['dateNaissance']);

                    // Gérer la photo du membre
                    $membrePhotoPath = null;
                    if ($request->hasFile("membres.{$index}.photo")) {
                        $membrePhotoPath = $request->file("membres.{$index}.photo")->store('photos/users', 'public');
                    }

                    $membre = User::create([
                        'nom' => strtoupper($membreData['nom']),
                        'prenom' => ucfirst($membreData['prenom']),
                        'email' => $membreData['email'],
                        'password' => Hash::make($membreTempPassword),
                        'identifier' => $membreIdentifier,
                        'telephone' => $membreData['telephone'] ?? null,
                        'date_naissance' => $membreData['dateNaissance'],
                        'genre' => $membreData['genre'],
                        'profession' => $membreData['profession'],
                        'relation' => $membreData['relation'] ?? null,
                        'fonction_id' => $membreData['fonction_id'] ?? $membreData['fonction'] ?? null,
                        'family_id' => $family->id,
                        'role' => 'membre_famille',
                        'photo_path' => $membrePhotoPath,
                        'classe_id' => $validated['famille']['classe_id'],
                        'ville_id' => $validated['famille']['ville'],
                    ]);

                    // Créer les sacrements du membre
                    $this->createUserSacrements($membre, $membreData);

                    // Stocker le membre et son mot de passe temporaire
                    $membres[] = ['user' => $membre, 'password' => $membreTempPassword];
                }
            }

            DB::commit();

            // Envoyer les emails avec les identifiants
            try {
                // Email au conducteur
                Mail::to($conductor->email)->send(new AccountCreated($conductor, $tempPassword));

                // Emails aux membres
                foreach ($membres as $membreData) {
                    Mail::to($membreData['user']->email)->send(new AccountCreated($membreData['user'], $membreData['password']));
                }

                Log::info('Emails d\'identifiants envoyés pour le conducteur', [
                    'family_id' => $family->id,
                    'conductor_email' => $conductor->email,
                    'membres_count' => count($validated['membres']),
                ]);
            } catch (\Exception $e) {
                Log::warning('Erreur envoi emails pour conducteur ' . $conductor->id, [
                    'error' => $e->getMessage()
                ]);
            }

            Log::info('Conducteur créé directement par Admin', [
                'family_id' => $family->id,
                'conductor_id' => $conductor->id,
                'membres_count' => count($validated['membres']),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Conducteur et sa famille créés avec succès ! Les utilisateurs peuvent se connecter avec leur email et le mot de passe temporaire.',
                'family_id' => $family->id,
                'temp_password' => $tempPassword, // Pour debug, à retirer en prod
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            // Retourner les erreurs de validation avec détails clairs
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création conducteur admin', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Message d'erreur clair basé sur le message
            $userMessage = 'Une erreur est survenue lors de la création du conducteur.';

            if (strpos($e->getMessage(), 'already been taken') !== false) {
                $userMessage = '❌ Erreur: Cet email existe déjà dans la base de données. Veuillez utiliser un email différent.';
            } elseif (strpos($e->getMessage(), 'unique constraint') !== false) {
                $userMessage = '❌ Erreur: Ces données existent déjà. Veuillez vérifier et ré-essayer avec d\'autres informations.';
            }

            return response()->json([
                'success' => false,
                'message' => $userMessage,
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 422);
        }
    }

    /**
     * Créer un pasteur avec sa famille et ses membres
     * Admin crée = pas d'approbation requise
     */
    public function storePastor(Request $request)
    {
        DB::beginTransaction();
        try {
            // Valider les données avec règles complètes
            $validated = $request->validate([
                'famille.nom' => 'required|string|max:255',
                'famille.adresse' => 'nullable|string|max:255',
                'famille.quartier' => 'nullable|string|max:255',
                'famille.ville' => 'required|exists:villes,id',
                'famille.telephone' => 'required|regex:/^[0-9]{10}$/',
                'famille.classe_id' => 'required|exists:classes,id',

                // RESPONSABLE (PASTEUR) - Informations personnelles
                'responsable.nom' => 'required|string|max:255',
                'responsable.prenom' => 'required|string|max:255',
                'responsable.email' => 'required|email|unique:users,email',
                'responsable.tel' => 'required|regex:/^[0-9]{10}$/',
                'responsable.dateNaissance' => 'required|date|before:today',
                'responsable.genre' => 'required|in:M,F',
                'responsable.profession' => 'required|string|max:255',
                'responsable.relation' => 'nullable|string|max:100',
                'responsable.lienParente' => 'nullable|string|max:255',
                'responsable.fonction_id' => 'nullable|integer|exists:fonctions,id',
                'responsable.fonction' => 'nullable|string|max:255',
                'responsable.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',

                // RESPONSABLE - Statut marital civil
                'responsable.statutMarital' => 'required|in:celibataire,marie,divorce,veuf,dot',
                'responsable.dateMariage' => 'nullable|date',
                'responsable.lieuMariage' => 'nullable|string|max:255',
                'responsable.dateDivorce' => 'nullable|date',
                'responsable.lieuDivorce' => 'nullable|string|max:255',
                'responsable.dateDeces' => 'nullable|date',
                'responsable.lieuDeces' => 'nullable|string|max:255',
                'responsable.dote' => 'nullable|date',
                'responsable.lieuDote' => 'nullable|string|max:255',

                // RESPONSABLE - Sacrements religieux
                'responsable.baptise' => 'nullable|in:0,1',
                'responsable.dateBapteme' => 'nullable|date',
                'responsable.lieuBapteme' => 'nullable|string|max:255',
                'responsable.premiereCommunion' => 'nullable|in:0,1',
                'responsable.datePremiereCommunion' => 'nullable|date',
                'responsable.lieuPremiereCommunion' => 'nullable|string|max:255',
                'responsable.marieReligieusement' => 'nullable|in:0,1',
                'responsable.dateMariageReligieux' => 'nullable|date',
                'responsable.lieuMariageReligieux' => 'nullable|string|max:255',

                // MEMBRES
                'membres' => 'nullable|array|max:20',
                'membres.*.nom' => 'required|string|max:255',
                'membres.*.prenom' => 'required|string|max:255',
                'membres.*.email' => 'required|email|unique:users,email',
                'membres.*.telephone' => 'nullable|regex:/^[0-9]{10}$/',
                'membres.*.dateNaissance' => 'required|date|before:today',
                'membres.*.genre' => 'required|in:M,F',
                'membres.*.profession' => 'required|string|max:255',
                'membres.*.relation' => 'required|string|max:100',
                'membres.*.lienParente' => 'nullable|string|max:255',
                'membres.*.fonction_id' => 'nullable|integer|exists:fonctions,id',
                'membres.*.fonction' => 'nullable|string|max:255',
                'membres.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',

                // MEMBRES - Statut marital civil
                'membres.*.statutMarital' => 'required|in:celibataire,marie,divorce,veuf,dot',
                'membres.*.dateMariage' => 'nullable|date',
                'membres.*.lieuMariage' => 'nullable|string|max:255',
                'membres.*.dateDivorce' => 'nullable|date',
                'membres.*.lieuDivorce' => 'nullable|string|max:255',
                'membres.*.dateDeces' => 'nullable|date',
                'membres.*.lieuDeces' => 'nullable|string|max:255',
                'membres.*.dote' => 'nullable|date',
                'membres.*.lieuDote' => 'nullable|string|max:255',

                // MEMBRES - Sacrements religieux
                'membres.*.baptise' => 'nullable|boolean',
                'membres.*.dateBapteme' => 'nullable|date',
                'membres.*.lieuBapteme' => 'nullable|string|max:255',
                'membres.*.premiereCommunion' => 'nullable|boolean',
                'membres.*.datePremiereCommunion' => 'nullable|date',
                'membres.*.lieuPremiereCommunion' => 'nullable|string|max:255',
                'membres.*.marieReligieusement' => 'nullable|boolean',
                'membres.*.dateMariageReligieux' => 'nullable|date',
                'membres.*.lieuMariageReligieux' => 'nullable|string|max:255',

                // Consentement
                'consentement' => 'required|accepted',
            ]);

            // 1. Créer la famille
            $family = Family::create([
                'nom' => $validated['famille']['nom'],
                'adresse' => $validated['famille']['adresse'] ?? null,
                'quartier' => $validated['famille']['quartier'] ?? null,
                'ville_id' => $validated['famille']['ville'],
                'classe_id' => $validated['famille']['classe_id'],
                'telephone' => $validated['famille']['telephone'],
            ]);

            // Générer un mot de passe temporaire pour le pasteur
            $tempPassword = $this->generateTempPassword();

            // Gérer la photo du pasteur
            $photoPath = null;
            if ($request->hasFile('responsable.photo')) {
                $photoPath = $request->file('responsable.photo')->store('photos/users', 'public');
            }

            // 2. Créer l'utilisateur pasteur
            $pastor = User::create([
                'nom' => strtoupper($validated['responsable']['nom']),
                'prenom' => ucfirst($validated['responsable']['prenom']),
                'email' => $validated['responsable']['email'],
                'password' => Hash::make($tempPassword),
                'identifier' => User::generateIdentifier(strtoupper($validated['responsable']['nom']), ucfirst($validated['responsable']['prenom']), $validated['responsable']['dateNaissance']),
                'telephone' => $validated['responsable']['tel'],
                'date_naissance' => $validated['responsable']['dateNaissance'],
                'genre' => $validated['responsable']['genre'],
                'profession' => $validated['responsable']['profession'],
                'relation' => $validated['responsable']['relation'] ?? null,
                'fonction_id' => $validated['responsable']['fonction_id'] ?? $validated['responsable']['fonction'] ?? null,
                'family_id' => $family->id,
                'role' => 'pasteur',  // ✅ RÔLE PASTEUR (au lieu de responsable_famille)
                'photo_path' => $photoPath,
                'classe_id' => $validated['famille']['classe_id'],
                'ville_id' => $validated['famille']['ville'],
                'must_change_password' => true,
            ]);

            $family->update(['responsable_id' => $pastor->id]);

            // 3. Créer les sacrements du pasteur
            $this->createUserSacrements($pastor, $validated['responsable']);

            // 4. Créer les membres de la famille du pasteur (si présents)
            $membres = [];
            foreach (($validated['membres'] ?? []) as $index => $membreData) {
                $membreTempPassword = $this->generateTempPassword();
                $membreIdentifier = User::generateIdentifier(strtoupper($membreData['nom']), ucfirst($membreData['prenom']), $membreData['dateNaissance']);

                // Gérer la photo du membre
                $membrePhotoPath = null;
                if ($request->hasFile("membres.{$index}.photo")) {
                    $membrePhotoPath = $request->file("membres.{$index}.photo")->store('photos/users', 'public');
                }

                $membre = User::create([
                    'nom' => strtoupper($membreData['nom']),
                    'prenom' => ucfirst($membreData['prenom']),
                    'email' => $membreData['email'],
                    'password' => Hash::make($membreTempPassword),
                    'identifier' => $membreIdentifier,
                    'telephone' => $membreData['telephone'] ?? null,
                    'date_naissance' => $membreData['dateNaissance'],
                    'genre' => $membreData['genre'],
                    'profession' => $membreData['profession'],
                    'relation' => $membreData['relation'] ?? null,
                    'fonction_id' => $membreData['fonction_id'] ?? $membreData['fonction'] ?? null,
                    'family_id' => $family->id,
                    'role' => 'membre_famille',
                    'photo_path' => $membrePhotoPath,
                    'classe_id' => $family->classe_id,
                    'ville_id' => $family->ville_id,
                    'must_change_password' => true,
                ]);

                // Créer les sacrements du membre
                $this->createUserSacrements($membre, $membreData);
                $membres[] = $membre;
            }

            DB::commit();

            // 5. Envoyer les emails avec les identifiants
            try {
                Mail::to($pastor->email)->send(new AccountCreated($pastor, $tempPassword));

                Log::info('Email d\'identifiants envoyé pour le pasteur', [
                    'pastor_id' => $pastor->id,
                    'pastor_email' => $pastor->email,
                ]);

                // Envoyer aussi aux membres
                foreach ($membres as $membre) {
                    Mail::to($membre->email)->send(new AccountCreated($membre, $tempPassword));
                }
            } catch (\Exception $e) {
                Log::warning('Erreur envoi email pour pasteur/membres', [
                    'error' => $e->getMessage()
                ]);
            }

            Log::info('Pasteur créé directement par Admin avec sa famille', [
                'pastor_id' => $pastor->id,
                'family_id' => $family->id,
                'membres_count' => count($membres),
            ]);

            return response()->json([
                'success' => true,
                'message' => '🎉 Pasteur et sa famille créés avec succès ! Tous les membres peuvent maintenant se connecter avec leur email et le mot de passe temporaire. Bienvenue dans notre communauté spirituelle !',
                'pastor_id' => $pastor->id,
                'family_id' => $family->id,
                'temp_password' => $tempPassword,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            // Retourner les erreurs de validation avec détails clairs
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création pasteur avec famille admin', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Message d'erreur clair basé sur le message
            $userMessage = 'Une erreur est survenue lors de la création du pasteur et de sa famille.';

            if (strpos($e->getMessage(), 'already been taken') !== false) {
                $userMessage = '❌ Erreur: Cet email existe déjà dans la base de données. Veuillez utiliser un email différent.';
            } elseif (strpos($e->getMessage(), 'unique constraint') !== false) {
                $userMessage = '❌ Erreur: Ces données existent déjà. Veuillez vérifier et ré-essayer avec d\'autres informations.';
            }

            return response()->json([
                'success' => false,
                'message' => $userMessage,
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 422);
        }
    }

    /**
     * Créer les sacrements d'un utilisateur
     */
    private function createUserSacrements(User $user, array $data)
    {
        try {
            // Initialiser tous les champs avec les valeurs par défaut
            $sacrementsData = [
                'user_id' => $user->id,
                // Sacrements religieux
                'baptise' => false,
                'bapteme_date' => null,
                'bapteme_lieu' => null,
                'premiere_communion' => false,
                'premiere_communion_date' => null,
                'premiere_communion_lieu' => null,
                'marie_religieusement' => false,
                'mariage_religieux_date' => null,
                'mariage_religieux_lieu' => null,
                // Statut matrimonial civil
                'est_marie' => false,
                'mariage_civil_date' => null,
                'mariage_civil_lieu' => null,
                'est_divorce' => false,
                'divorce_date' => null,
                'divorce_lieu' => null,
                'est_veuf' => false,
                'deces_conjoint_date' => null,
                'deces_conjoint_lieu' => null,
                'dot_effectue' => false,
                'dot_date' => null,
                'dot_lieu' => null,
            ];

            // SACREMENTS RELIGIEUX - Traiter uniquement si explicitement fourni
            if ($this->stringToBoolean($data['baptise'] ?? false)) {
                $sacrementsData['baptise'] = true;
                if (!empty($data['dateBapteme'])) {
                    $sacrementsData['bapteme_date'] = $data['dateBapteme'];
                }
                if (!empty($data['lieuBapteme'])) {
                    $sacrementsData['bapteme_lieu'] = $data['lieuBapteme'];
                }
            }

            if ($this->stringToBoolean($data['premiereCommunion'] ?? false)) {
                $sacrementsData['premiere_communion'] = true;
                if (!empty($data['datePremiereCommunion'])) {
                    $sacrementsData['premiere_communion_date'] = $data['datePremiereCommunion'];
                }
                if (!empty($data['lieuPremiereCommunion'])) {
                    $sacrementsData['premiere_communion_lieu'] = $data['lieuPremiereCommunion'];
                }
            }

            if ($this->stringToBoolean($data['marieReligieusement'] ?? false)) {
                $sacrementsData['marie_religieusement'] = true;
                if (!empty($data['dateMariageReligieux'])) {
                    $sacrementsData['mariage_religieux_date'] = $data['dateMariageReligieux'];
                }
                if (!empty($data['lieuMariageReligieux'])) {
                    $sacrementsData['mariage_religieux_lieu'] = $data['lieuMariageReligieux'];
                }
            }

            // STATUT MATRIMONIAL CIVIL - basé sur le statut marital
            $statutMarital = strtolower($data['statutMarital'] ?? 'celibataire');

            if ($statutMarital === 'marie') {
                $sacrementsData['est_marie'] = true;
                if (!empty($data['dateMariage'])) {
                    $sacrementsData['mariage_civil_date'] = $data['dateMariage'];
                }
                if (!empty($data['lieuMariage'])) {
                    $sacrementsData['mariage_civil_lieu'] = $data['lieuMariage'];
                }
            } elseif ($statutMarital === 'divorce') {
                $sacrementsData['est_divorce'] = true;
                if (!empty($data['dateDivorce'])) {
                    $sacrementsData['divorce_date'] = $data['dateDivorce'];
                }
                if (!empty($data['lieuDivorce'])) {
                    $sacrementsData['divorce_lieu'] = $data['lieuDivorce'];
                }
            } elseif ($statutMarital === 'veuf') {
                $sacrementsData['est_veuf'] = true;
                if (!empty($data['dateDeces'])) {
                    $sacrementsData['deces_conjoint_date'] = $data['dateDeces'];
                }
                if (!empty($data['lieuDeces'])) {
                    $sacrementsData['deces_conjoint_lieu'] = $data['lieuDeces'];
                }
            } elseif ($statutMarital === 'dot') {
                $sacrementsData['dot_effectue'] = true;
                if (!empty($data['dote'])) {
                    $sacrementsData['dot_date'] = $data['dote'];
                }
                if (!empty($data['lieuDote'])) {
                    $sacrementsData['dot_lieu'] = $data['lieuDote'];
                }
            }

            // Utiliser updateOrCreate pour créer ou mettre à jour les sacrements
            UserSacrement::updateOrCreate(
                ['user_id' => $user->id],
                $sacrementsData
            );

            Log::info('Sacrements créés/mis à jour pour user ' . $user->id, [
                'user_name' => $user->nom . ' ' . $user->prenom,
                'statut_marital' => $statutMarital,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur création/mise à jour sacrements pour user ' . $user->id, [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_data' => $data
            ]);
            // Ne pas throw l'exception pour ne pas bloquer la création de l'utilisateur
        }
    }

    /**
     * Convertir string en booléen
     */
    private function stringToBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_string($value)) return strtolower($value) === 'true' || $value === '1';
        return (bool) $value;
    }

    /**
     * Traduire les erreurs de validation en français
     */
    private function translateValidationErrors(array $errors): array
    {
        $translations = [
            'required' => 'Ce champ est obligatoire.',
            'string' => 'Ce champ doit être une chaîne de caractères.',
            'max' => 'Ce champ ne peut pas dépasser :max caractères.',
            'email' => 'L\'adresse email n\'est pas valide.',
            'unique' => 'Cette valeur est déjà utilisée.',
            'exists' => 'La valeur sélectionnée n\'existe pas.',
            'regex' => 'Le format de ce champ n\'est pas valide.',
            'date' => 'La date n\'est pas valide.',
            'before' => 'La date doit être antérieure à aujourd\'hui.',
            'in' => 'La valeur sélectionnée n\'est pas valide.',
            'accepted' => 'Ce champ doit être accepté.',
            'image' => 'Le fichier doit être une image.',
            'mimes' => 'Le fichier doit être de type :values.',
            'max' => 'Le fichier ne peut pas dépasser :max kilo-octets.',
            'array' => 'Ce champ doit être un tableau.',
            'min' => 'Ce champ doit contenir au moins :min éléments.',
            'numeric' => 'Ce champ doit être un nombre.',
            'integer' => 'Ce champ doit être un entier.',
            'boolean' => 'Ce champ doit être vrai ou faux.',
            'date_format' => 'Le format de la date n\'est pas valide.',
            'after' => 'La date doit être postérieure à :date.',
            'before_or_equal' => 'La date ne peut pas être postérieure à :date.',
            'after_or_equal' => 'La date ne peut pas être antérieure à :date.',
            'digits' => 'Ce champ doit contenir exactement :digits chiffres.',
            'digits_between' => 'Ce champ doit contenir entre :min et :max chiffres.',
            'different' => 'Ce champ doit être différent de :other.',
            'same' => 'Ce champ doit être identique à :other.',
            'size' => 'Ce champ doit avoir une taille de :size.',
            'between' => 'Ce champ doit être entre :min et :max.',
            'confirmed' => 'La confirmation de ce champ ne correspond pas.',
            'url' => 'Le format de l\'URL n\'est pas valide.',
            'timezone' => 'Le fuseau horaire n\'est pas valide.',
            'json' => 'Le format JSON n\'est pas valide.',
            'alpha' => 'Ce champ ne peut contenir que des lettres.',
            'alpha_dash' => 'Ce champ ne peut contenir que des lettres, des chiffres et des tirets.',
            'alpha_num' => 'Ce champ ne peut contenir que des lettres et des chiffres.',
            'ip' => 'L\'adresse IP n\'est pas valide.',
            'ipv4' => 'L\'adresse IPv4 n\'est pas valide.',
            'ipv6' => 'L\'adresse IPv6 n\'est pas valide.',
            'extensions' => 'Le fichier doit avoir une extension valide.',
            'file' => 'Le champ doit être un fichier.',
            'filled' => 'Ce champ est obligatoire.',
            'present' => 'Ce champ doit être présent.',
            'sometimes' => 'Ce champ peut être présent.',
            'nullable' => 'Ce champ peut être nul.',
            'prohibited' => 'Ce champ est interdit.',
            'prohibited_if' => 'Ce champ est interdit quand :other est :value.',
            'prohibited_unless' => 'Ce champ est interdit sauf si :other est dans :values.',
            'missing' => 'Ce champ doit être manquant.',
            'missing_if' => 'Ce champ doit être manquant quand :other est :value.',
            'missing_unless' => 'Ce champ doit être manquant sauf si :other est dans :values.',
            'missing_with' => 'Ce champ doit être manquant quand :values est présent.',
            'missing_with_all' => 'Ce champ doit être manquant quand :values sont présents.',
            'required_if' => 'Ce champ est obligatoire quand :other est :value.',
            'required_unless' => 'Ce champ est obligatoire sauf si :other est dans :values.',
            'required_with' => 'Ce champ est obligatoire quand :values est présent.',
            'required_with_all' => 'Ce champ est obligatoire quand :values sont présents.',
            'required_without' => 'Ce champ est obligatoire quand :values n\'est pas présent.',
            'required_without_all' => 'Ce champ est obligatoire quand aucun des :values n\'est présent.',
            'exclude' => 'Ce champ est exclu.',
            'exclude_if' => 'Ce champ est exclu quand :other est :value.',
            'exclude_unless' => 'Ce champ est exclu sauf si :other est dans :values.',
            'exclude_with' => 'Ce champ est exclu quand :values est présent.',
            'exclude_without' => 'Ce champ est exclu quand :values n\'est pas présent.',
            'lowercase' => 'Ce champ doit être en minuscules.',
            'uppercase' => 'Ce champ doit être en majuscules.',
            'multiple_of' => 'Ce champ doit être un multiple de :value.',
            'doesnt_start_with' => 'Ce champ ne doit pas commencer par :values.',
            'doesnt_end_with' => 'Ce champ ne doit pas finir par :values.',
            'starts_with' => 'Ce champ doit commencer par :values.',
            'ends_with' => 'Ce champ doit finir par :values.',
            'password' => 'Le mot de passe est incorrect.',
            'current_password' => 'Le mot de passe actuel est incorrect.',
            'declined' => 'Ce champ doit être refusé.',
            'declined_if' => 'Ce champ doit être refusé quand :other est :value.',
            'doesnt_accept' => 'Ce champ n\'accepte pas :value.',
            'accepted_if' => 'Ce champ doit être accepté quand :other est :value.',
            'throttle' => 'Trop de tentatives de connexion. Veuillez réessayer dans :seconds secondes.',
            'throttled' => 'Trop de tentatives. Veuillez réessayer dans :seconds secondes.',
            'bail' => 'Arrêt après la première erreur de validation.',
            'nullable' => 'Ce champ peut être nul.',
            'prohibits' => 'Ce champ interdit :other.',
            'required_array_keys' => 'Ce champ doit contenir des entrées pour :values.',
            'ascii' => 'Ce champ ne doit contenir que des caractères ASCII alphanumériques et des symboles.',
            'can' => 'Ce champ contient une valeur non autorisée.',
            'decimal' => 'Ce champ doit avoir :decimal décimales.',
            'doesnt_have' => 'Ce champ ne doit pas avoir :value.',
            'has' => 'Ce champ doit avoir :value.',
            'list' => 'Ce champ doit être une liste.',
            'mac_address' => 'L\'adresse MAC n\'est pas valide.',
            'not_regex' => 'Le format de ce champ n\'est pas valide.',
            'phone' => 'Le numéro de téléphone n\'est pas valide.',
            'ulid' => 'L\'ULID n\'est pas valide.',
            'uuid' => 'L\'UUID n\'est pas valide.',
        ];

        $translatedErrors = [];

        foreach ($errors as $field => $messages) {
            $translatedErrors[$field] = [];

            foreach ($messages as $message) {
                // Extraire le type d'erreur (ex: 'required', 'max', etc.)
                $rule = $this->extractRuleFromMessage($message);

                if ($rule && isset($translations[$rule])) {
                    $translatedMessage = $translations[$rule];

                    // Remplacer les placeholders (:max, :min, etc.)
                    $translatedMessage = $this->replacePlaceholders($translatedMessage, $message);

                    $translatedErrors[$field][] = $translatedMessage;
                } else {
                    // Si pas de traduction trouvée, garder le message original
                    $translatedErrors[$field][] = $message;
                }
            }
        }

        return $translatedErrors;
    }

    /**
     * Extraire la règle de validation du message d'erreur
     */
    private function extractRuleFromMessage(string $message): ?string
    {
        // Les messages Laravel commencent souvent par le nom du champ suivi de la règle
        // Ex: "The responsable.email field is required." -> "required"
        // Ex: "The responsable.email must be a valid email address." -> "email"

        $patterns = [
            '/field is required/i' => 'required',
            '/must be a valid email/i' => 'email',
            '/must be a string/i' => 'string',
            '/may not be greater than/i' => 'max',
            '/must be accepted/i' => 'accepted',
            '/must be an image/i' => 'image',
            '/must be a date/i' => 'date',
            '/must be before/i' => 'before',
            '/must be one of/i' => 'in',
            '/has already been taken/i' => 'unique',
            '/does not exist/i' => 'exists',
            '/must match the format/i' => 'regex',
            '/must be an array/i' => 'array',
            '/must have at least/i' => 'min',
            '/must be a number/i' => 'numeric',
            '/must be an integer/i' => 'integer',
            '/must be true or false/i' => 'boolean',
            '/does not match the format/i' => 'date_format',
            '/must be after/i' => 'after',
            '/must be before or equal/i' => 'before_or_equal',
            '/must be after or equal/i' => 'after_or_equal',
            '/must contain exactly/i' => 'digits',
            '/must contain between/i' => 'digits_between',
            '/must be different/i' => 'different',
            '/must be the same/i' => 'same',
            '/must have a size of/i' => 'size',
            '/must be between/i' => 'between',
            '/confirmation does not match/i' => 'confirmed',
            '/must be a valid URL/i' => 'url',
            '/must be a valid timezone/i' => 'timezone',
            '/must be valid JSON/i' => 'json',
            '/must only contain letters/i' => 'alpha',
            '/must only contain letters, numbers, and dashes/i' => 'alpha_dash',
            '/must only contain letters and numbers/i' => 'alpha_num',
            '/must be a valid IP address/i' => 'ip',
            '/must be a valid IPv4 address/i' => 'ipv4',
            '/must be a valid IPv6 address/i' => 'ipv6',
            '/must have a valid file extension/i' => 'extensions',
            '/must be a file/i' => 'file',
            '/must be filled/i' => 'filled',
            '/must be present/i' => 'present',
            '/may be present/i' => 'sometimes',
            '/may be null/i' => 'nullable',
            '/is prohibited/i' => 'prohibited',
            '/is missing/i' => 'missing',
            '/is required when/i' => 'required_if',
            '/is required unless/i' => 'required_unless',
            '/is required with/i' => 'required_with',
            '/is required with all/i' => 'required_with_all',
            '/is required without/i' => 'required_without',
            '/is required without all/i' => 'required_without_all',
            '/is excluded/i' => 'exclude',
            '/must be lowercase/i' => 'lowercase',
            '/must be uppercase/i' => 'uppercase',
            '/must be a multiple of/i' => 'multiple_of',
            '/must not start with/i' => 'doesnt_start_with',
            '/must not end with/i' => 'doesnt_end_with',
            '/must start with/i' => 'starts_with',
            '/must end with/i' => 'ends_with',
            '/is incorrect/i' => 'password',
            '/is incorrect/i' => 'current_password',
            '/must be declined/i' => 'declined',
            '/does not accept/i' => 'doesnt_accept',
            '/must be accepted when/i' => 'accepted_if',
            '/too many login attempts/i' => 'throttle',
            '/too many requests/i' => 'throttled',
            '/prohibits/i' => 'prohibits',
            '/must contain entries for/i' => 'required_array_keys',
            '/must only contain ASCII/i' => 'ascii',
            '/contains an unauthorized value/i' => 'can',
            '/must have/i' => 'decimal',
            '/must not have/i' => 'doesnt_have',
            '/must be a list/i' => 'list',
            '/must be a valid MAC address/i' => 'mac_address',
            '/must not match the format/i' => 'not_regex',
            '/must be a valid phone number/i' => 'phone',
            '/must be a valid ULID/i' => 'ulid',
            '/must be a valid UUID/i' => 'uuid',
        ];

        foreach ($patterns as $pattern => $rule) {
            if (preg_match($pattern, $message)) {
                return $rule;
            }
        }

        return null;
    }

    /**
     * Remplacer les placeholders dans le message traduit
     */
    private function replacePlaceholders(string $translatedMessage, string $originalMessage): string
    {
        // Extraire les valeurs des placeholders depuis le message original
        // Ex: "may not be greater than 255 characters" -> :max = 255
        $placeholders = [];

        // Pour :max
        if (preg_match('/may not be greater than (\d+)/i', $originalMessage, $matches)) {
            $placeholders['max'] = $matches[1];
        }

        // Pour :min
        if (preg_match('/must have at least (\d+)/i', $originalMessage, $matches)) {
            $placeholders['min'] = $matches[1];
        }

        // Pour :digits
        if (preg_match('/must contain exactly (\d+) digits/i', $originalMessage, $matches)) {
            $placeholders['digits'] = $matches[1];
        }

        // Pour :values (types MIME)
        if (preg_match('/must be one of: ([^.]+\.)/i', $originalMessage, $matches)) {
            $placeholders['values'] = str_replace(['.', ','], ['', ', '], $matches[1]);
        }

        // Remplacer dans le message traduit
        foreach ($placeholders as $key => $value) {
            $translatedMessage = str_replace(":{$key}", $value, $translatedMessage);
        }

        return $translatedMessage;
    }

    /**
     * Générer un mot de passe temporaire sécurisé
     */
    /**
     * Générer un mot de passe temporaire sécurisé
     */
    private function generateTempPassword(): string
    {
        return '11111'; // Mot de passe fixe comme demandé
    }
}



