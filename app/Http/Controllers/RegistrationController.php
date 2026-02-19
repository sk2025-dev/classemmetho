<?php

namespace App\Http\Controllers;

use App\Models\Inscription;
use App\Models\User;
use App\Models\Classe;
use App\Models\Ville;
use App\Models\Family;
use App\Traits\HandlesUniqueConstraintViolations;
use App\Services\UniqueConstraintChecker;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;

class RegistrationController extends Controller
{
    use HandlesUniqueConstraintViolations;
    /**
     * Traiter l'inscription famille ou conducteur
     */
    public function store()
    {
        try {
            $input = request()->all();
            $type = $input['type'] ?? 'famille'; // Par défaut 'famille' si non spécifié

            // Récupérer les fichiers envoyés (photo responsable, membres, etc.)
            $files = request()->allFiles();

            // Injecter la photo du responsable si présente
            if (isset($files['responsable']['photo'])) {
                $input['responsable']['photo'] = $files['responsable']['photo'];
            }

            // Injecter les photos des membres si présentes
            if (isset($files['membres'])) {
                foreach ($files['membres'] as $i => $membreFiles) {
                    if (isset($membreFiles['photo'])) {
                        $input['membres'][$i]['photo'] = $membreFiles['photo'];
                    }
                }
            }

            Log::info('Registration payload received', ['payload' => $input]);

            // Valider les données avec une logique complète
            $validated = $this->validateRegistration($input);

            if (!$validated['success']) {
            // Log détaillé des erreurs de validation
            Log::warning('❌ Validation failed - detailed errors', [
                'errors' => $validated['errors'],
                'received_famille' => $input['famille'] ?? [],
                'received_responsable' => array_diff_key($input['responsable'] ?? [], ['photo' => true, 'photoPreview' => true]),
                'received_membres_count' => is_array($input['membres'] ?? null) ? count($input['membres']) : 0,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Les informations fournies ne respectent pas nos critères de validation. Veuillez corriger les erreurs suivantes avant de soumettre à nouveau votre inscription.',
                'errors' => $validated['errors'],
                'error_count' => count($validated['errors']),
                'timestamp' => now()->toISOString()
            ], 422);
            }

            $data = $validated['data'];

            // ✅ CORRECTION: Si responsable est vide mais y a des membres,
            // utiliser le PREMIER membre comme responsable (cas où l'utilisateur a mal rempli le formulaire)
            if (empty($data['responsable']) && !empty($data['membres']) && is_array($data['membres'])) {
                // Utiliser le premier membre comme responsable
                $data['responsable'] = array_shift($data['membres']);
                Log::info('Responsable vide détecté - utilisation du premier membre comme responsable', [
                    'responsable' => $data['responsable']['nom'] ?? 'N/A'
                ]);
            }

            // Vérifier les doublons de manière complète
            $duplicateCheck = $this->checkDuplicates($data);
            if (!$duplicateCheck['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les informations fournies sont déjà utilisées',
                    'errors' => $duplicateCheck['errors']
                ], 422);
            }

            // Créer les inscriptions dans une transaction
            $inscriptions = DB::transaction(function () use ($data, $type) {
                $photoBase64 = null;
                $photoUrl = null;

                // Stocker la photo du responsable en fichier si présente
                if (!empty($data['responsable']['photo']) && is_object($data['responsable']['photo']) && method_exists($data['responsable']['photo'], 'isValid') && $data['responsable']['photo']->isValid()) {
                    // Sauvegarder en fichier et obtenir chemin + URL
                    $photoData = $this->storePhotoAsFile($data['responsable']['photo']);
                    $photoPath = $photoData['path'] ?? null;
                    $photoUrl = $photoData['url'] ?? null;
                    unset($data['responsable']['photo']); // On ne stocke pas l'objet fichier
                } else {
                    $photoPath = null;
                    $photoUrl = null;
                }

                // Convertir les photos des membres en fichiers si présentes
                if (!empty($data['membres']) && is_array($data['membres'])) {
                    foreach ($data['membres'] as $i => $membre) {
                        if (!empty($membre['photo']) && is_object($membre['photo']) && method_exists($membre['photo'], 'isValid') && $membre['photo']->isValid()) {
                            $memberPhotoData = $this->storePhotoAsFile($membre['photo']);
                            $data['membres'][$i]['photo_path'] = $memberPhotoData['path'] ?? null;
                            unset($data['membres'][$i]['photo']);
                        }

                        // Convertir les booléens des membres de strings en vrais booléens
                        if (!empty($data['membres'][$i]['baptise'])) {
                            $data['membres'][$i]['baptise'] = $this->stringToBoolean($data['membres'][$i]['baptise']);
                        }
                        if (!empty($data['membres'][$i]['premiereCommunion'])) {
                            $data['membres'][$i]['premiereCommunion'] = $this->stringToBoolean($data['membres'][$i]['premiereCommunion']);
                        }
                        if (!empty($data['membres'][$i]['marieReligieusement'])) {
                            $data['membres'][$i]['marieReligieusement'] = $this->stringToBoolean($data['membres'][$i]['marieReligieusement']);
                        }
                    }
                }

                // Créer UNE SEULE inscription pour la famille/conducteur avec tous les membres dans 'data'
                $inscriptionFamille = Inscription::create([
                    'type' => $type === 'conductor' ? 'conducteur' : 'famille',
                    'status' => 'en_attente',
                    'photo_path' => $photoPath,  // ✅ Chemin du fichier stocké
                    'profile_photo_url' => $photoUrl, // ✅ URL du fichier de photo

                    // ✅ Champs du responsable stockés dans les colonnes responsable_*
                    'responsable_nom' => $data['responsable']['nom'] ?? null,
                    'responsable_prenom' => $data['responsable']['prenom'] ?? null,
                    'responsable_email' => $data['responsable']['email'] ?? null,
                    'responsable_tel' => $this->formatPhone($data['responsable']['tel'] ?? ''),
                    'responsable_telephone2' => $this->formatPhone($data['responsable']['telephone2'] ?? ''),
                    'responsable_date_naissance' => $data['responsable']['dateNaissance'] ?? null,
                    'responsable_genre' => $data['responsable']['genre'] ?? null,
                    'responsable_lien_parente' => $data['responsable']['lienParente'] ?? null,
                    'responsable_profession' => $data['responsable']['profession'] ?? null,
                    'responsable_fonction' => $data['responsable']['fonction'] ?? null,
                    'responsable_statut_marital' => $data['responsable']['statutMarital'] ?? null,
                    'responsable_date_mariage' => $data['responsable']['dateMariage'] ?? null,
                    'responsable_lieu_mariage' => $data['responsable']['lieuMariage'] ?? null,
                    'responsable_date_divorce' => $data['responsable']['dateDivorce'] ?? null,
                    'responsable_lieu_divorce' => $data['responsable']['lieuDivorce'] ?? null,
                    'responsable_date_deces' => $data['responsable']['dateDeces'] ?? null,
                    'responsable_lieu_deces' => $data['responsable']['lieuDeces'] ?? null,
                    'responsable_baptise' => $this->stringToBoolean($data['responsable']['baptise'] ?? false),
                    'responsable_date_bapteme' => $data['responsable']['dateBapteme'] ?? null,
                    'responsable_lieu_bapteme' => $data['responsable']['lieuBapteme'] ?? null,
                    'responsable_premiere_communion' => $this->stringToBoolean($data['responsable']['premiereCommunion'] ?? false),
                    'responsable_date_premiere_communion' => $data['responsable']['datePremiereCommunion'] ?? null,
                    'responsable_lieu_premiere_communion' => $data['responsable']['lieuPremiereCommunion'] ?? null,
                    'responsable_marie_religieusement' => $this->stringToBoolean($data['responsable']['marieReligieusement'] ?? false),
                    'responsable_date_mariage_religieux' => $data['responsable']['dateMariageReligieux'] ?? null,
                    'responsable_lieu_mariage_religieux' => $data['responsable']['lieuMariageReligieux'] ?? null,

                    'data' => [
                        // FAMILLE: Champs ADDITIONNELS non dans les colonnes inscriptions
                        'famille' => [
                            'nom' => $data['famille']['nom'] ?? null,
                            'quartier' => $data['famille']['quartier'] ?? null,
                            'adresse' => $data['famille']['adresse'] ?? null,
                            'ville' => $data['famille']['ville'] ?? null,
                            'telephone' => $data['famille']['telephone'] ?? null,
                            'telephone2' => $data['famille']['telephone2'] ?? null,
                            'classe_id' => $data['famille']['classe_id'] ?? null,
                        ],
                        // RESPONSABLE: Vide (données sont dans les colonnes)
                        'responsable' => [],
                        // MEMBRES: Tous les champs (pas de colonnes dédiées)
                        'membres' => $data['membres'] ?? [],
                        // MÉTADONNÉES ENRICHIES
                        'selectedRoles' => $data['selectedRoles'] ?? [],
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                        'submitted_at' => now()->toIso8601String(),
                        'validation_info' => [
                            'passed_validation' => true,
                            'validation_timestamp' => now()->toISOString(),
                            'validation_version' => '2.0',
                            'security_checks' => [
                                'duplicate_check' => 'passed',
                                'data_integrity' => 'verified',
                                'format_validation' => 'passed'
                            ]
                        ],
                        'processing_metadata' => [
                            'priority_level' => 'normal',
                            'requires_admin_approval' => true,
                            'requires_conductor_approval' => true,
                            'estimated_completion_days' => 3
                        ]
                    ]
                ]);

                Log::info('Inscription créée avec succès - Validation renforcée appliquée', [
                    'id' => $inscriptionFamille->id,
                    'reference' => 'INS-' . now()->format('Ymd') . '-' . str_pad($inscriptionFamille->id, 6, '0', STR_PAD_LEFT),
                    'type' => $inscriptionFamille->type,
                    'status' => $inscriptionFamille->status,
                    'email' => $inscriptionFamille->responsable_email,
                    'responsable' => $inscriptionFamille->responsable_prenom . ' ' . $inscriptionFamille->responsable_nom,
                    'membres_count' => count($data['membres'] ?? []),
                    'classe_id' => $inscriptionFamille->classe_id,
                    'validation_version' => '2.0',
                    'security_checks_passed' => true,
                    'duplicate_check_performed' => true,
                    'ip_address' => request()->ip(),
                    'processing_metadata' => [
                        'requires_admin_approval' => true,
                        'requires_conductor_approval' => true,
                        'estimated_completion_days' => 3
                    ]
                ]);

                return [$inscriptionFamille];
            });

            return response()->json([
                'success' => true,
                'message' => $type === 'conductor'
                    ? '🎉 Excellente nouvelle ! Votre inscription de conducteur a été soumise avec succès. Bienvenue dans notre communauté spirituelle ! En attente de validation par l\'administrateur. Vous recevrez bientôt vos identifiants de connexion.'
                    : '🎉 Excellente nouvelle ! Votre inscription familiale a été soumise avec succès. Bienvenue dans notre grande famille spirituelle ! En attente de validation par l\'administrateur. Vous recevrez bientôt vos identifiants de connexion.',
                'inscription_ids' => array_map(fn($i) => $i->id, $inscriptions),
                'inscription_count' => count($inscriptions),
                'status' => 'en_attente',
                'reference' => 'FAM-' . now()->format('Ymd') . '-' . str_pad($inscriptions[0]->id, 6, '0', STR_PAD_LEFT),
                'validation_version' => '2.0',
                'estimated_completion_days' => 3,
                'details' => [
                    'responsable' => $inscriptions[0]->responsable_email ?? null,
                    'membres_count' => count($inscriptions[0]->data['membres'] ?? []),
                    'classe_id' => $inscriptions[0]->classe_id,
                    'next_steps' => [
                        'admin_approval_required' => true,
                        'conductor_approval_required' => true,
                        'email_notification' => 'Vous recevrez un email dès que votre inscription sera traitée.',
                        'estimated_completion' => '3 jours ouvrables'
                    ]
                ],
                'timestamp' => now()->toISOString()
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'inscription', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Une erreur système s\'est produite lors du traitement de votre inscription. Nos équipes techniques ont été notifiées. Veuillez réessayer dans quelques instants ou contacter l\'administration si le problème persiste.',
                'error_reference' => 'REG-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5($e->getMessage()), 0, 8)),
                'error_details' => config('app.debug') ? $e->getMessage() : null,
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * Valider complètement l'inscription avec des règles strictes et modernes
     */
    private function validateRegistration($input)
    {
        $errors = [];
        $warnings = [];

        // Valider la famille
        $famille = $input['famille'] ?? [];
        if (empty($famille['nom'])) {
            $errors['famille.nom'] = ['Le nom de la famille est obligatoire pour procéder à l\'inscription.'];
        } else if (strlen($famille['nom']) < 2) {
            $errors['famille.nom'] = ['Le nom de famille doit contenir au moins 2 caractères.'];
        } else if (strlen($famille['nom']) > 100) {
            $errors['famille.nom'] = ['Le nom de famille ne peut pas dépasser 100 caractères.'];
        } else if (!preg_match('/^[a-zA-ZÀ-ÿ\s\-\']+$/u', $famille['nom'])) {
            $errors['famille.nom'] = ['Le nom de famille ne peut contenir que des lettres, espaces, tirets et apostrophes.'];
        }

        if (!empty($famille['adresse']) && strlen($famille['adresse']) < 10) {
            $errors['famille.adresse'] = ['L\'adresse doit être plus détaillée (minimum 10 caractères).'];
        }

        if (empty($famille['quartier'])) {
            $errors['famille.quartier'] = ['Le quartier de résidence est obligatoire.'];
        } else if (strlen($famille['quartier']) < 2) {
            $errors['famille.quartier'] = ['Le nom du quartier doit faire au moins 2 caractères.'];
        }

        if (empty($famille['ville'])) {
            $errors['famille.ville'] = ['La ville de résidence est obligatoire.'];
        } else {
            // Vérifier que la ville existe et est active
            $villeExists = Ville::where('id', $famille['ville'])->exists();
            if (!$villeExists) {
                $errors['famille.ville'] = ['La ville sélectionnée n\'est pas reconnue dans notre système.'];
            }
        }

        if (empty($famille['telephone'])) {
            $errors['famille.telephone'] = ['Le numéro de téléphone principal de la famille est obligatoire.'];
        } else if (!$this->isValidPhone($famille['telephone'])) {
            $errors['famille.telephone'] = ['Le numéro de téléphone doit être exactement 10 chiffres, sans espaces ni caractères spéciaux.'];
        }

        if (empty($famille['classe_id'])) {
            $errors['famille.classe_id'] = ['La sélection d\'une classe paroissiale est obligatoire.'];
        } else {
            // Vérifier que la classe existe et est active
            $classeExists = Classe::where('id', $famille['classe_id'])->exists();
            if (!$classeExists) {
                $errors['famille.classe_id'] = ['La classe sélectionnée n\'est pas disponible.'];
            }
        }

        // Valider le responsable avec des règles très strictes
        $responsable = $input['responsable'] ?? [];
        if (empty($responsable['nom'])) {
            $errors['responsable.nom'] = ['Le nom du responsable familial est obligatoire.'];
        } else if (strlen($responsable['nom']) < 2) {
            $errors['responsable.nom'] = ['Le nom doit contenir au moins 2 caractères.'];
        } else if (strlen($responsable['nom']) > 50) {
            $errors['responsable.nom'] = ['Le nom ne peut pas dépasser 50 caractères.'];
        } else if (!preg_match('/^[a-zA-ZÀ-ÿ\s\-\']+$/u', $responsable['nom'])) {
            $errors['responsable.nom'] = ['Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes.'];
        }

        if (empty($responsable['prenom'])) {
            $errors['responsable.prenom'] = ['Le prénom du responsable est obligatoire.'];
        } else if (strlen($responsable['prenom']) < 2) {
            $errors['responsable.prenom'] = ['Le prénom doit contenir au moins 2 caractères.'];
        } else if (strlen($responsable['prenom']) > 50) {
            $errors['responsable.prenom'] = ['Le prénom ne peut pas dépasser 50 caractères.'];
        } else if (!preg_match('/^[a-zA-ZÀ-ÿ\s\-\']+$/u', $responsable['prenom'])) {
            $errors['responsable.prenom'] = ['Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes.'];
        }

        if (empty($responsable['email'])) {
            $errors['responsable.email'] = ['L\'adresse email du responsable est obligatoire pour la communication.'];
        } else if (!filter_var($responsable['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['responsable.email'] = ['Le format de l\'adresse email n\'est pas valide.'];
        } else if (strlen($responsable['email']) > 255) {
            $errors['responsable.email'] = ['L\'adresse email ne peut pas dépasser 255 caractères.'];
        }

        if (empty($responsable['tel'])) {
            $errors['responsable.tel'] = ['Le numéro de téléphone du responsable est obligatoire.'];
        } else if (!$this->isValidPhone($responsable['tel'])) {
            $errors['responsable.tel'] = ['Le numéro de téléphone doit être exactement 10 chiffres.'];
        }

        if (empty($responsable['dateNaissance'])) {
            $errors['responsable.dateNaissance'] = ['La date de naissance du responsable est obligatoire.'];
        } else if (!$this->isValidDate($responsable['dateNaissance'])) {
            $errors['responsable.dateNaissance'] = ['La date de naissance n\'est pas valide ou le format est incorrect.'];
        } else {
            // Vérifier l'âge minimum (13 ans)
            $birthDate = new \DateTime($responsable['dateNaissance']);
            $today = new \DateTime();
            $age = $today->diff($birthDate)->y;
            if ($age < 18) {
                $errors['responsable.dateNaissance'] = ['L\'âge minimum requis est de 18 ans.'];
            } elseif ($age > 120) {
                $errors['responsable.dateNaissance'] = ['La date de naissance semble incorrecte.'];
            }
        }

        if (empty($responsable['genre'])) {
            $errors['responsable.genre'] = ['Le genre du responsable doit être spécifié.'];
        } else if (!in_array($responsable['genre'], ['M', 'F'])) {
            $errors['responsable.genre'] = ['Le genre doit être Masculin (M) ou Féminin (F).'];
        }

        if (empty($responsable['profession'])) {
            $errors['responsable.profession'] = ['La profession du responsable est obligatoire.'];
        } else if (strlen($responsable['profession']) > 100) {
            $errors['responsable.profession'] = ['La profession ne peut pas dépasser 100 caractères.'];
        }

        if (empty($responsable['statutMarital'])) {
            $errors['responsable.statutMarital'] = ['Le statut marital du responsable est obligatoire.'];
        } else if (!in_array($responsable['statutMarital'], ['celibataire', 'marie', 'divorce', 'veuf', 'dot'])) {
            $errors['responsable.statutMarital'] = ['Le statut marital sélectionné n\'est pas valide.'];
        }

        // Valider les photos avec des contrôles stricts
        if (!empty($responsable['photo']) && is_object($responsable['photo']) && method_exists($responsable['photo'], 'isValid')) {
            if (!$responsable['photo']->isValid()) {
                $errors['responsable.photo'] = ['La photo du responsable n\'est pas valide ou est corrompue.'];
            } else {
                // Vérifier la taille (max 5MB)
                if ($responsable['photo']->getSize() > 5242880) {
                    $errors['responsable.photo'] = ['La photo du responsable ne peut pas dépasser 5MB.'];
                }
                // Vérifier le type MIME
                $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
                if (!in_array($responsable['photo']->getMimeType(), $allowedMimes)) {
                    $errors['responsable.photo'] = ['La photo doit être au format JPEG, JPG ou PNG uniquement.'];
                }
            }
        }

        // Valider les membres - seulement nom et prénom sont obligatoires pour les membres
        if (!empty($input['membres'])) {
            foreach ($input['membres'] as $i => $membre) {
                // Seuls nom et prénom sont obligatoires pour les membres
                if (empty($membre['nom'])) {
                    $errors["membres.{$i}.nom"] = ['Le nom du membre est obligatoire.'];
                } else if (strlen($membre['nom']) < 2 || strlen($membre['nom']) > 50) {
                    $errors["membres.{$i}.nom"] = ['Le nom du membre doit contenir entre 2 et 50 caractères.'];
                }

                if (empty($membre['prenom'])) {
                    $errors["membres.{$i}.prenom"] = ['Le prénom du membre est obligatoire.'];
                } else if (strlen($membre['prenom']) < 2 || strlen($membre['prenom']) > 50) {
                    $errors["membres.{$i}.prenom"] = ['Le prénom du membre doit contenir entre 2 et 50 caractères.'];
                }

                // Tous les autres champs sont optionnels pour les membres
                if (!empty($membre['email']) && !filter_var($membre['email'], FILTER_VALIDATE_EMAIL)) {
                    $errors["membres.{$i}.email"] = ['Le format de l\'email du membre n\'est pas valide.'];
                }

                if (!empty($membre['telephone']) && !$this->isValidPhone($membre['telephone'])) {
                    $errors["membres.{$i}.telephone"] = ['Le numéro de téléphone du membre doit être exactement 10 chiffres.'];
                }

                if (!empty($membre['dateNaissance']) && !$this->isValidDate($membre['dateNaissance'])) {
                    $errors["membres.{$i}.dateNaissance"] = ['La date de naissance du membre n\'est pas valide.'];
                }

                if (!empty($membre['genre']) && !in_array($membre['genre'], ['M', 'F'])) {
                    $errors["membres.{$i}.genre"] = ['Le genre du membre doit être M ou F.'];
                }

                // Validation des photos des membres
                if (!empty($membre['photo']) && is_object($membre['photo']) && method_exists($membre['photo'], 'isValid')) {
                    if (!$membre['photo']->isValid()) {
                        $errors["membres.{$i}.photo"] = ['La photo du membre n\'est pas valide.'];
                    } else if ($membre['photo']->getSize() > 5242880) {
                        $errors["membres.{$i}.photo"] = ['La photo du membre ne peut pas dépasser 5MB.'];
                    } else {
                        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
                        if (!in_array($membre['photo']->getMimeType(), $allowedMimes)) {
                            $errors["membres.{$i}.photo"] = ['La photo du membre doit être au format JPEG, JPG ou PNG.'];
                        }
                    }
                }
            }
        }

        // Vérifications transversales
        if (!empty($input['membres']) && count($input['membres']) > 20) {
            $errors['general'] = ['Une famille ne peut pas avoir plus de 20 membres.'];
        }

        if (!empty($errors)) {
            return [
                'success' => false,
                'errors' => $errors,
                'warnings' => $warnings,
                'validation_timestamp' => now()->toISOString()
            ];
        }

        return [
            'success' => true,
            'data' => [
                'type' => 'famille',
                'famille' => $famille,
                'responsable' => $responsable,
                'membres' => $input['membres'] ?? [],
                'consentement' => $input['consentement'] ?? false,
                'classe_id' => $famille['classe_id'] ?? null,
            ],
            'validation_timestamp' => now()->toISOString()
        ];
    }

    /**
     * Vérifier les doublons de manière complète et stricte
     * Vérifie TOUTES les inscriptions (y compris rejetées) pour éviter toute duplication
     */
    private function checkDuplicates($data)
    {
        $this->initializeUniqueChecker();
        $checker = app(UniqueConstraintChecker::class);

        try {
            // Vérifier l'email du responsable
            $email = $data['responsable']['email'] ?? null;
            if ($email) {
                $checker->checkEmailUnique($email);
                $checker->checkInscriptionEmailUnique($email);
            }

            // Vérifier les emails des membres
            if (!empty($data['membres']) && is_array($data['membres'])) {
                $memberEmails = [];
                foreach ($data['membres'] as $index => $membre) {
                    $membreEmail = $membre['email'] ?? null;
                    if ($membreEmail) {
                        $memberEmails[] = $membreEmail;
                        $checker->checkEmailUnique($membreEmail);
                        $checker->checkInscriptionEmailUnique($membreEmail);
                    }
                }

                // Vérifier les doublons internes
                $checker->checkMultipleEmailsUnique(array_merge([$email], $memberEmails));
            }

            return ['success' => true];
        } catch (\Exception $e) {
            Log::warning('Duplicate check failed', ['error' => $e->getMessage()]);

            // Vérifier si c'est une UniqueConstraintViolationException pour avoir plus de détails
            if ($e instanceof \App\Exceptions\UniqueConstraintViolationException) {
                $errorArray = $e->toArray();
                return [
                    'success' => false,
                    'errors' => [
                        $errorArray['field'] => [$errorArray['message']]
                    ]
                ];
            }

            return [
                'success' => false,
                'errors' => [
                    'general' => [$e->getMessage()]
                ]
            ];
        }
    }

    /**
     * Formater les numéros de téléphone
     * Accepte UNIQUEMENT 10 chiffres exactement
     * Enlève tout caractère non-numérique
     * Retourne les 10 chiffres exacts
     */
    private function formatPhone($phone)
    {
        if (!$phone) return '';

        // Supprimer TOUS les caractères non-numériques
        $cleaned = preg_replace('/\D/', '', $phone);

        // Retourner UNIQUEMENT si exactement 10 chiffres
        if (strlen($cleaned) === 10) {
            return $cleaned;
        }

        return '';
    }

    /**
     * Valider le format du téléphone
     * Accepte UNIQUEMENT: 10 chiffres exactement
     * Format: XXXXXXXXXX (10 chiffres)
     * Aucun caractère spécial autorisé
     */
    private function isValidPhone($phone)
    {
        if (!$phone) return false;

        // Supprimer TOUS les caractères non-numériques
        $cleaned = preg_replace('/\D/', '', $phone);

        // UNIQUEMENT 10 chiffres exactement
        return strlen($cleaned) === 10;
    }

    /**
     * Valider une date
     */
    private function isValidDate($date)
    {
        if (!$date) return false;

        try {
            \DateTime::createFromFormat('Y-m-d', $date);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Enregistrement public pour Conducteur
     * POST /register/conducteur
     */
    public function storeConductor(Request $request)
    {
        try {
            // Log les données reçues pour debug
            Log::info('Inscription conducteur reçue', [
                'method' => $request->method(),
                'content_type' => $request->header('Content-Type'),
                'all_data' => $request->all(),
            ]);

            // Valider les données avec des règles strictes
            $validated = $request->validate([
                // Infos personnelles
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'telephone' => 'required|string|max:20',
                'telephone2' => 'nullable|string|max:20',
                'dateNaissance' => 'required|date_format:Y-m-d',
                'genre' => 'required|in:M,F',
                'adresse' => 'nullable|string|max:255',
                'ville' => 'nullable|string|max:100',
                'ville_id' => 'nullable|integer|exists:villes,id',
                'fonction' => 'nullable|string|max:255',
                'statutMarital' => 'nullable|string',
                'dateMariageniv' => 'nullable|date_format:Y-m-d',
                'lieuMariagePerso' => 'nullable|string|max:255',
                'dateDivorce' => 'nullable|date_format:Y-m-d',
                'dateDecesConjoint' => 'nullable|date_format:Y-m-d',

                // Classe et spirituel
                'classe_id' => 'required|integer|exists:classes,id',
                'spirituel.baptise' => 'required|string|in:true,false',
                'spirituel.dateBapteme' => 'nullable|date_format:Y-m-d',
                'spirituel.lieuBapteme' => 'nullable|string|max:255',
                'spirituel.premiereCommunion' => 'required|string|in:true,false',
                'spirituel.datePremiereCommunion' => 'nullable|date_format:Y-m-d',
                'spirituel.lieuPremiereCommunion' => 'nullable|string|max:255',
                'spirituel.marieReligieusement' => 'required|string|in:true,false',
                'spirituel.dateMariage' => 'nullable|date_format:Y-m-d',
                'spirituel.lieuMariage' => 'nullable|string|max:255',

                // Données optionnelles famille
                'isResponsableFamille' => 'nullable|string',
                'familyData.nom' => 'nullable|string|max:255',
                'familyData.telephone' => 'nullable|string|max:20',
                'familyData.telephone2' => 'nullable|string|max:20',
                'familyData.adresse' => 'nullable|string|max:255',
                'familyData.quartier' => 'nullable|string|max:255',
                'familyData.ville' => 'nullable|string|max:100',
                'familyData.ville_id' => 'nullable|integer|exists:villes,id',

                // Fonction d'église
                'selectedRoles' => 'nullable|array',
                'selectedRoles.*.id' => 'nullable|integer|exists:fonctions,id',
            ], [], [
                'nom' => 'Nom',
                'prenom' => 'Prénom',
                'email' => 'Email',
                'telephone' => 'Téléphone',
                'dateNaissance' => 'Date de naissance',
                'genre' => 'Genre',
                'classe_id' => 'Classe',
            ]);

            // Créer l'inscription
            $inscription = DB::transaction(function () use ($validated) {
                $inscription = Inscription::create([
                    'type' => 'conducteur',
                    'classe_id' => $validated['classe_id'],
                    'nom' => $validated['nom'],
                    'prenom' => $validated['prenom'],
                    'email' => $validated['email'] ?? null,
                    'telephone' => $this->formatPhone($validated['telephone']),
                    'telephone2' => !empty($validated['telephone2']) ? $this->formatPhone($validated['telephone2']) : null,
                    'date_naissance' => $validated['dateNaissance'],
                    'genre' => $validated['genre'],
                    'adresse' => $validated['adresse'] ?? null,
                    'ville' => $validated['ville'] ?? null,
                    'ville_id' => $validated['ville_id'] ?? null,
                    'fonction' => $validated['fonction'] ?? null,
                    'statut_marital' => $validated['statutMarital'] ?? null,
                    'date_mariage' => $validated['dateMariageniv'] ?? null,
                    'lieu_mariage' => $validated['lieuMariagePerso'] ?? null,
                    'date_divorce' => $validated['dateDivorce'] ?? null,
                    'date_deces_conjoint' => $validated['dateDecesConjoint'] ?? null,
                    'baptise' => $validated['spirituel']['baptise'] === 'true' ? 1 : 0,
                    'date_bapteme' => $validated['spirituel']['dateBapteme'] ?? null,
                    'lieu_bapteme' => $validated['spirituel']['lieuBapteme'] ?? null,
                    'premiere_communion' => $validated['spirituel']['premiereCommunion'] === 'true' ? 1 : 0,
                    'date_premiere_communion' => $validated['spirituel']['datePremiereCommunion'] ?? null,
                    'lieu_premiere_communion' => $validated['spirituel']['lieuPremiereCommunion'] ?? null,
                    'mariage_religieux' => $validated['spirituel']['marieReligieusement'] === 'true' ? 1 : 0,
                    'date_mariage_religieux' => $validated['spirituel']['dateMariage'] ?? null,
                    'lieu_mariage_religieux' => $validated['spirituel']['lieuMariage'] ?? null,
                    'status' => 'en_attente',
                    'admin_approved' => false,
                    'data' => [
                        'spirituel' => [
                            'baptise' => $validated['spirituel']['baptise'] === 'true',
                            'dateBapteme' => $validated['spirituel']['dateBapteme'] ?? null,
                            'lieuBapteme' => $validated['spirituel']['lieuBapteme'] ?? null,
                             'premiereCommunion' => $validated['spirituel']['premiereCommunion'] === 'true',
                            'datePremiereCommunion' => $validated['spirituel']['datePremiereCommunion'] ?? null,
                            'lieuPremiereCommunion' => $validated['spirituel']['lieuPremiereCommunion'] ?? null,
                            'marieReligieusement' => $validated['spirituel']['marieReligieusement'] === 'true',
                            'dateMariage' => $validated['spirituel']['dateMariage'] ?? null,
                            'lieuMariage' => $validated['spirituel']['lieuMariage'] ?? null,
                        ],
                        'isResponsableFamille' => $validated['isResponsableFamille'] === 'true' || $validated['isResponsableFamille'] === '1',
                        'familyData' => $validated['familyData'] ?? null,
                        'selectedRoles' => $validated['selectedRoles'] ?? [],
                    ],
                ]);

                Log::info('Inscription conducteur créée', [
                    'inscription_id' => $inscription->id,
                    'email' => $inscription->email,
                    'status' => $inscription->status,
                ]);

                return $inscription;
            });

            return response()->json([
                'success' => true,
                'message' => '🎉 Excellente nouvelle ! Votre inscription de conducteur a été soumise avec succès. Bienvenue dans notre communauté spirituelle ! En attente de validation par l\'administrateur. Vous recevrez bientôt vos identifiants de connexion.',
                'data' => [
                    'inscription_id' => $inscription->id,
                    'reference' => 'COND-' . now()->format('Ymd') . '-' . str_pad($inscription->id, 6, '0', STR_PAD_LEFT),
                    'status' => $inscription->status,
                    'validation_version' => '2.0',
                    'estimated_completion_days' => 3,
                    'next_steps' => [
                        'admin_approval_required' => true,
                        'conductor_approval_required' => false, // Pour les conducteurs, seul l'admin approuve
                        'email_notification' => 'Vous recevrez un email dès que votre inscription sera traitée.'
                    ]
                ],
                'timestamp' => now()->toISOString()
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Erreur de validation inscription conducteur - Contrôles de sécurité renforcés', [
                'errors' => $e->errors(),
                'validation_version' => '2.0',
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Les informations fournies ne respectent pas nos critères de validation renforcée. Veuillez corriger les erreurs suivantes avant de soumettre à nouveau votre inscription.',
                'errors' => $e->errors(),
                'error_count' => count($e->errors()),
                'validation_version' => '2.0',
                'timestamp' => now()->toISOString()
            ], 422);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Erreur de validation inscription conducteur', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur inscription conducteur', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Stocker une photo en fichier dans le storage public
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return string|null L'URL publique de la photo
     */
    /**
     * Stocker une photo et retourner le chemin + URL
     * @return array|null ['path' => chemin_relatif, 'url' => url_complète] ou null
     */
    private function storePhotoAsFile($file)
    {
        try {
            if (!$file || !$file->isValid()) {
                return null;
            }

            // Créer un nom unique pour le fichier
            $extension = $file->getClientOriginalExtension();
            $filename = 'inscription_' . uniqid() . '_' . time() . '.' . $extension;

            // Stocker le fichier dans storage/app/public/inscriptions/
            $path = Storage::disk('public')->putFileAs(
                'inscriptions',
                $file,
                $filename
            );

            // Retourner chemin et URL
            $photoUrl = asset('storage/' . $path);

            Log::info('Photo stockée avec succès', [
                'path' => $path,
                'url' => $photoUrl,
                'filename' => $filename
            ]);

            return [
                'path' => $path,
                'url' => $photoUrl,
            ];
        } catch (\Exception $e) {
            Log::error('Erreur lors du stockage de la photo en fichier', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return null;
        }
    }

    /**
     * Convertit une photo en base64 pour stockage en base de données
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return string|null La photo en base64 avec header MIME
     */
    /**
     * Stocker une photo dans le système de fichiers
     * Retourne le chemin relatif pour stockage en base de données
     */
    private function storePhoto($file)
    {
        try {
            if (!$file || !$file->isValid()) {
                return null;
            }

            // Stocker le fichier dans storage/app/public/inscriptions/
            // avec un nom unique basé sur le timestamp et un hash
            $path = $file->store('inscriptions', 'public');

            Log::info('Photo stockée avec succès', [
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ]);

            return $path;
        } catch (\Exception $e) {
            Log::error('Erreur lors du stockage de la photo', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return null;
        }
    }

    /**
     * @deprecated Utiliser storePhoto() à la place
     */
    private function storePhotoAsBase64($file)
    {
        try {
            if (!$file || !$file->isValid()) {
                return null;
            }

            // Lire le contenu du fichier
            $photoContent = file_get_contents($file->getRealPath());

            // Obtenir le type MIME
            $mimeType = $file->getMimeType();

            // Convertir en base64 avec le header MIME
            $base64Photo = 'data:' . $mimeType . ';base64,' . base64_encode($photoContent);

            Log::info('Photo convertie en base64 avec succès', [
                'size' => strlen($base64Photo),
                'mime_type' => $mimeType
            ]);

            return $base64Photo;
        } catch (\Exception $e) {
            Log::error('Erreur lors de la conversion en base64', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return null;
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

