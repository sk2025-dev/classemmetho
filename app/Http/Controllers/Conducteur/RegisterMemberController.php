<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Family;
use App\Models\UserSacrement;
use App\Models\Classe;
use App\Mail\SendCredentials;
use App\Traits\GeneratesIdentifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RegisterMemberController extends Controller
{
    use GeneratesIdentifier;

    /**
     * Afficher le formulaire de création de membre/responsable de famille
     * GET /conducteur/members/create
     */
    public function create()
    {
        $user = auth()->user();
        if ($user->role !== 'conducteur') {
            abort(403, 'Accès non autorisé');
        }

        return Inertia::render('Conducteur/create_member', [
            'className' => $user->getManagedClasses()->first()?->nom ?? 'Classe non définie',
            'classe_id' => $user->classe_id,
            'auth' => $user,
        ]);
    }

    /**
     * Créer un responsable de famille + membres directement dans la table users
     * POST /conducteur/members
     * Traite les données du formulaire create_member.jsx (formulaire famille complète)
     */
    public function store(Request $request)
    {
        try {
            // 1. VALIDER LES DONNÉES - Structure imbriquée famille/responsable/membres
            $validated = $request->validate([
                // Famille
                'famille.nom' => 'required|string|max:255',
                'famille.adresse' => 'nullable|string|max:1000',
                'famille.quartier' => 'nullable|string|max:255',
                'famille.ville' => 'nullable|string|max:255',
                'famille.classe_id' => 'nullable|exists:classes,id',
                'famille.telephone' => 'nullable|string|max:20',

                // Responsable
                'responsable.nom' => 'required|string|max:255',
                'responsable.prenom' => 'required|string|max:255',
                'responsable.email' => 'required|email|unique:users,email',
                'responsable.tel' => 'nullable|string|max:20',
                'responsable.telephone2' => 'nullable|string|max:20',
                'responsable.dateNaissance' => 'nullable|date',
                'responsable.genre' => 'nullable|in:M,F,Masculin,Féminin',
                'responsable.profession' => 'nullable|string|max:255',
                'responsable.fonction' => 'nullable|exists:fonctions,id',
                'responsable.fonction_professionnelle' => 'nullable|string|max:255',
                'responsable.adresse' => 'nullable|string|max:1000',
                'responsable.ville_id' => 'nullable|exists:villes,id',
                'responsable.statutMarital' => 'nullable|string|max:255',
                'responsable.dateMariage' => 'nullable|date',
                'responsable.lieuMariage' => 'nullable|string|max:255',
                'responsable.dateDivorce' => 'nullable|date',
                'responsable.lieuDivorce' => 'nullable|string|max:255',
                'responsable.dateDeces' => 'nullable|date',
                'responsable.lieuDeces' => 'nullable|string|max:255',
                'responsable.baptise' => 'nullable|in:true,false,1,0',
                'responsable.dateBapteme' => 'nullable|date',
                'responsable.lieuBapteme' => 'nullable|string|max:255',
                'responsable.premiereCommunion' => 'nullable|in:true,false,1,0',
                'responsable.datePremiereCommunion' => 'nullable|date',
                'responsable.lieuPremiereCommunion' => 'nullable|string|max:255',
                'responsable.marieReligieusement' => 'nullable|in:true,false,1,0',
                'responsable.dateMariageReligieux' => 'nullable|date',
                'responsable.lieuMariageReligieux' => 'nullable|string|max:255',
                'responsable.photo' => 'nullable',

                // Membres (tableau)
                'membres' => 'nullable|array',
                'membres.*.nom' => 'required|string|max:255',
                'membres.*.prenom' => 'required|string|max:255',
                'membres.*.email' => 'nullable|email|unique:users,email',
                'membres.*.telephone' => 'nullable|string|max:20',
                'membres.*.relation' => 'nullable|string|max:255',
                'membres.*.genre' => 'nullable|in:M,F,Masculin,Féminin',
                'membres.*.dateNaissance' => 'nullable|date',
                'membres.*.fonction' => 'nullable|exists:fonctions,id',
                'membres.*.statutMarital' => 'nullable|string|max:255',
                'membres.*.dateMariage' => 'nullable|date',
                'membres.*.lieuMariage' => 'nullable|string|max:255',
                'membres.*.dateDivorce' => 'nullable|date',
                'membres.*.lieuDivorce' => 'nullable|string|max:255',
                'membres.*.dateDeces' => 'nullable|date',
                'membres.*.lieuDeces' => 'nullable|string|max:255',
                'membres.*.baptise' => 'nullable|in:true,false,1,0',
                'membres.*.dateBapteme' => 'nullable|date',
                'membres.*.lieuBapteme' => 'nullable|string|max:255',
                'membres.*.premiereCommunion' => 'nullable|in:true,false,1,0',
                'membres.*.datePremiereCommunion' => 'nullable|date',
                'membres.*.lieuPremiereCommunion' => 'nullable|string|max:255',
                'membres.*.marieReligieusement' => 'nullable|in:true,false,1,0',
                'membres.*.dateMariageReligieux' => 'nullable|date',
                'membres.*.lieuMariageReligieux' => 'nullable|string|max:255',
                'membres.*.fonction' => 'nullable|string|max:255',
                'membres.*.profession' => 'nullable|string|max:255',
                'membres.*.photo' => 'nullable',

                'type' => 'nullable|string',
                'consentement' => 'nullable',
            ]);

            // 2. VÉRIFIER QUE LE CONDUCTEUR EXISTE
            $conducteur = auth()->user();
            if (!$conducteur || $conducteur->role !== 'conducteur') {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé. Seuls les conducteurs peuvent enregistrer des membres.'
                ], 403);
            }

            // Convertir les strings vides en null pour les champs optionnels (fonction)
            foreach ($validated['responsable'] as &$val) {
                if (isset($val) && $val === '') {
                    $val = null;
                }
            }
            if (isset($validated['membres']) && is_array($validated['membres'])) {
                foreach ($validated['membres'] as &$membre) {
                    if (isset($membre['fonction']) && $membre['fonction'] === '') {
                        $membre['fonction'] = null;
                    }
                }
            }

            // 3. RÉCUPÉRER LA CLASSE ID DU CONDUCTEUR (toujours utiliser la classe du conducteur)
            $classeId = $conducteur->getManagedClasses()->first()?->id;
            if (!$classeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune classe assignée à votre compte conducteur. Contactez un administrateur.'
                ], 404);
            }

            DB::beginTransaction();

            // 4. CRÉER LE RESPONSABLE (User)
            $responsableData = $validated['responsable'];
            $identifiant = self::generateIdentifier(
                $responsableData['nom'],
                $responsableData['prenom'],
                $responsableData['dateNaissance'] ?? null
            );
            $motDePasse = '11111';

            // Traiter la photo du responsable
            $responsablePhotoPath = null;
            if ($request->hasFile('responsable.photo')) {
                $photoFile = $request->file('responsable.photo');
                if ($photoFile && $photoFile->isValid()) {
                    $mime = $photoFile->getMimeType();
                    if (strpos($mime, 'image/') === 0) {
                        $responsablePhotoPath = $photoFile->store('family_members/responsables', 'public');
                    }
                }
            }

            $responsableUser = User::create([
                'name' => trim($responsableData['prenom'] . ' ' . $responsableData['nom']),
                'nom' => $responsableData['nom'],
                'prenom' => $responsableData['prenom'],
                'email' => $responsableData['email'],
                'password' => bcrypt($motDePasse),
                'identifier' => $identifiant,
                'role' => 'responsable_famille',
                'telephone' => $responsableData['tel'] ?? null,
                'telephone2' => $responsableData['telephone2'] ?? null,
                'photo_path' => $responsablePhotoPath,
                'classe_id' => $classeId,
                'genre' => $responsableData['genre'] ?? null,
                'date_naissance' => $responsableData['dateNaissance'] ?? null,
                'profession' => $responsableData['profession'] ?? $responsableData['fonction_professionnelle'] ?? null,
                'fonction_id' => $responsableData['fonction'] ?? null,
                'statut' => 'actif',
                'ville_id' => $responsableData['ville_id'] ?? null,
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]);

            // Créer les sacrements pour le responsable
            UserSacrement::create([
                'user_id' => $responsableUser->id,
                'est_marie' => $this->stringToBoolean($responsableData['statutMarital'] === 'marie'),
                'mariage_civil_date' => $responsableData['dateMariage'] ?? null,
                'mariage_civil_lieu' => $responsableData['lieuMariage'] ?? null,
                'est_divorce' => $this->stringToBoolean($responsableData['statutMarital'] === 'divorce'),
                'divorce_date' => $responsableData['dateDivorce'] ?? null,
                'divorce_lieu' => $responsableData['lieuDivorce'] ?? null,
                'est_veuf' => $this->stringToBoolean($responsableData['statutMarital'] === 'veuf'),
                'deces_conjoint_date' => $responsableData['dateDeces'] ?? null,
                'deces_conjoint_lieu' => $responsableData['lieuDeces'] ?? null,
                'dot_effectue' => false,
                'dot_date' => null,
                'dot_lieu' => null,
                'baptise' => $this->stringToBoolean($responsableData['baptise']),
                'bapteme_date' => $responsableData['dateBapteme'] ?? null,
                'bapteme_lieu' => $responsableData['lieuBapteme'] ?? null,
                'premiere_communion' => $this->stringToBoolean($responsableData['premiereCommunion']),
                'premiere_communion_date' => $responsableData['datePremiereCommunion'] ?? null,
                'premiere_communion_lieu' => $responsableData['lieuPremiereCommunion'] ?? null,
                'marie_religieusement' => $this->stringToBoolean($responsableData['marieReligieusement']),
                'mariage_religieux_date' => $responsableData['dateMariageReligieux'] ?? null,
                'mariage_religieux_lieu' => $responsableData['lieuMariageReligieux'] ?? null,
            ]);

            // 5. CRÉER LA FAMILLE
            $familleData = $validated['famille'];
            $family = Family::create([
                'nom' => $familleData['nom'],
                'classe_id' => $classeId,
                'responsable_id' => $responsableUser->id,
                'adresse' => $familleData['adresse'] ?? null,
                'quartier' => $familleData['quartier'] ?? null,
                'email' => $responsableData['email'] ?? null,
                'telephone' => $familleData['telephone'] ?? null,
                'telephone2' => $responsableData['telephone2'] ?? null,
                'ville_id' => $familleData['ville'] ?? null,
            ]);

            // Mettre à jour le responsable avec family_id
            $responsableUser->update(['family_id' => $family->id]);

            // 6. CRÉER LES MEMBRES DE LA FAMILLE
            if (isset($validated['membres']) && is_array($validated['membres'])) {
                foreach ($validated['membres'] as $i => $membreData) {
                    // Créer un User pour chaque membre (toujours, même sans email)
                    $membreIdentifiant = self::generateIdentifier(
                        $membreData['nom'],
                        $membreData['prenom'],
                        $membreData['dateNaissance'] ?? null
                    );
                    $membrePassword = '11111';

                    $membrePhotoPath = null;
                    if ($request->hasFile("membres.$i.photo")) {
                        $photoFile = $request->file("membres.$i.photo");
                        if ($photoFile && $photoFile->isValid()) {
                            $mime = $photoFile->getMimeType();
                            if ($mime && str_starts_with($mime, 'image/')) {
                                $membrePhotoPath = $photoFile->store('family_members/membres', 'public');
                            }
                        }
                    }

                    $membreUser = User::create([
                        'name' => trim($membreData['prenom'] . ' ' . $membreData['nom']),
                        'nom' => $membreData['nom'],
                        'prenom' => $membreData['prenom'],
                        'email' => $membreData['email'] ?? null,
                        'password' => bcrypt($membrePassword),
                        'identifier' => $membreIdentifiant,
                        'role' => 'membre_famille',
                        'telephone' => $membreData['telephone'] ?? null,
                        'photo_path' => $membrePhotoPath,
                        'classe_id' => $classeId,
                        'genre' => $membreData['genre'] ?? null,
                        'date_naissance' => $membreData['dateNaissance'] ?? null,
                        'profession' => $membreData['profession'] ?? null,
                        'relation' => $membreData['relation'] ?? null,
                        'fonction_id' => $membreData['fonction'] ?? null,
                        'family_id' => $family->id,
                        'statut' => 'actif',
                        'must_change_password' => !empty($membreData['email']),
                        'email_verified_at' => !empty($membreData['email']) ? now() : null,
                    ]);

                    // Créer les sacrements pour le membre
                    UserSacrement::create([
                        'user_id' => $membreUser->id,
                        'est_marie' => $this->stringToBoolean($membreData['statutMarital'] === 'marie'),
                        'mariage_civil_date' => $membreData['dateMariage'] ?? null,
                        'mariage_civil_lieu' => $membreData['lieuMariage'] ?? null,
                        'est_divorce' => $this->stringToBoolean($membreData['statutMarital'] === 'divorce'),
                        'divorce_date' => $membreData['dateDivorce'] ?? null,
                        'divorce_lieu' => $membreData['lieuDivorce'] ?? null,
                        'est_veuf' => $this->stringToBoolean($membreData['statutMarital'] === 'veuf'),
                        'deces_conjoint_date' => $membreData['dateDeces'] ?? null,
                        'deces_conjoint_lieu' => $membreData['lieuDeces'] ?? null,
                        'dot_effectue' => false,
                        'dot_date' => null,
                        'dot_lieu' => null,
                        'baptise' => $this->stringToBoolean($membreData['baptise']),
                        'bapteme_date' => $membreData['dateBapteme'] ?? null,
                        'bapteme_lieu' => $membreData['lieuBapteme'] ?? null,
                        'premiere_communion' => $this->stringToBoolean($membreData['premiereCommunion']),
                        'premiere_communion_date' => $membreData['datePremiereCommunion'] ?? null,
                        'premiere_communion_lieu' => $membreData['lieuPremiereCommunion'] ?? null,
                        'marie_religieusement' => $this->stringToBoolean($membreData['marieReligieusement']),
                        'mariage_religieux_date' => $membreData['dateMariageReligieux'] ?? null,
                        'mariage_religieux_lieu' => $membreData['lieuMariageReligieux'] ?? null,
                    ]);
                }
            }

            // 7. ENVOYER EMAIL AU RESPONSABLE
            try {
                Mail::to($responsableUser->email)->send(new SendCredentials($responsableUser, $identifiant, $motDePasse));
            } catch (\Exception $emailError) {
                Log::error('Erreur envoi email responsable: ' . $emailError->getMessage());
            }

            // Envoyer email aux membres qui ont un email
            if (isset($validated['membres']) && is_array($validated['membres'])) {
                foreach ($validated['membres'] as $i => $membreData) {
                    if (!empty($membreData['email'])) {
                        try {
                            $membreUser = User::where('email', $membreData['email'])->first();
                            if ($membreUser) {
                                $membreIdentifiant = $membreUser->identifier;
                                $membrePassword = '11111';
                                $membreUser->update(['password' => bcrypt($membrePassword)]);
                                Mail::to($membreUser->email)->send(new SendCredentials($membreUser, $membreIdentifiant, $membrePassword));
                            }
                        } catch (\Exception $emailError) {
                            Log::error('Erreur envoi email membre: ' . $emailError->getMessage());
                        }
                    }
                }
            }

            DB::commit();

            Log::info('Famille créée directement par conducteur', [
                'family_id' => $family->id,
                'responsable_id' => $responsableUser->id,
                'membres_count' => count($validated['membres'] ?? []),
                'conducteur_id' => $conducteur->id,
            ]);

            // Si c'est une requête AJAX/axios, retourner JSON
            if ($request->expectsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
                return response()->json([
                    'success' => true,
                    'message' => 'Famille et membres enregistrés avec succès',
                    'data' => [
                        'family_id' => $family->id,
                        'responsable_id' => $responsableUser->id,
                        'membres_count' => count($validated['membres'] ?? []),
                    ]
                ], 201);
            }

            return redirect()
                ->route('conducteur.inscriptions')
                ->with('success', 'Famille et membres enregistrés avec succès');
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur inscription directe: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'enregistrement.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Convertir une string 'true'/'false' ou booléen en entier 1/0
     * Utilisé pour les colonnes boolean qui reçoivent des strings de FormData
     */
    private function stringToBoolean($value)
    {
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }

        if (is_string($value)) {
            return in_array(strtolower($value), ['true', '1', 'yes', 'on']) ? 1 : 0;
        }

        return (bool) $value ? 1 : 0;
    }
}

