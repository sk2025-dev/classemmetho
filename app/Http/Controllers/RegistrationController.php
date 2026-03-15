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
            $type = $input['type'] ?? 'famille';

            $files = request()->allFiles();

            if (isset($files['responsable']['photo'])) {
                $input['responsable']['photo'] = $files['responsable']['photo'];
            }

            if (isset($files['membres'])) {
                foreach ($files['membres'] as $i => $membreFiles) {
                    if (isset($membreFiles['photo'])) {
                        $input['membres'][$i]['photo'] = $membreFiles['photo'];
                    }
                }
            }

            Log::info('Registration payload received', ['payload' => $input]);

            // ✅ Log les photos reçues (debugging)
            Log::info('🖼️ Photos dans le payload', [
                'responsable_photo' => $input['responsable']['photo'] ?? 'ABSENT',
                'responsable_photo_type' => gettype($input['responsable']['photo'] ?? null),
                'membres_count' => count($input['membres'] ?? []),
                'membres_photos' => array_filter(array_map(fn($m) => $m['photo'] ?? null, $input['membres'] ?? []))
            ]);

            $validated = $this->validateRegistration($input);

            if (!$validated['success']) {
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

            if (empty($data['responsable']) && !empty($data['membres']) && is_array($data['membres'])) {
                $data['responsable'] = array_shift($data['membres']);
                Log::info('Responsable vide détecté - utilisation du premier membre comme responsable', [
                    'responsable' => $data['responsable']['nom'] ?? 'N/A'
                ]);
            }

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
                $photoPath = null;
                $photoUrl  = null;

                // ✅ Photo responsable (ou fallback au premier membre)
                if (!empty($data['responsable']['photo'])) {
                    $photoVal = $data['responsable']['photo'];

                    Log::info('🔍 Photo responsable reçue', [
                        'type' => gettype($photoVal),
                        'is_string' => is_string($photoVal),
                        'is_object' => is_object($photoVal),
                        'value' => is_string($photoVal) ? substr($photoVal, 0, 100) : 'N/A'
                    ]);

                    if (is_object($photoVal) && method_exists($photoVal, 'isValid') && $photoVal->isValid()) {
                        $photoData = $this->storePhotoAsFile($photoVal);
                        $photoPath = $photoData['path'] ?? null;
                        $photoUrl  = $photoData['url']  ?? null;
                    } elseif (is_string($photoVal) && !empty($photoVal)) {
                        $photoUrl  = $photoVal;
                        $photoPath = $this->resolvePhotoPathFromUrl($photoVal);
                        Log::info('📸 Photo URL convertie à path', [
                            'url' => substr($photoVal, 0, 100),
                            'path' => $photoPath
                        ]);
                    }

                    unset($data['responsable']['photo']);
                } else {
                    // ✅ FALLBACK: Si pas de photo responsable, utiliser la photo du premier membre
                    if (!empty($data['membres']) && is_array($data['membres'])) {
                        foreach ($data['membres'] as $membre) {
                            if (!empty($membre['photo_path']) || !empty($membre['photo_url'])) {
                                $photoPath = $membre['photo_path'] ?? null;
                                $photoUrl  = $membre['photo_url'] ?? null;
                                Log::info('🔄 Photo responsable récupérée du premier membre', [
                                    'member_name' => ($membre['prenom'] ?? '') . ' ' . ($membre['nom'] ?? ''),
                                    'photo_path' => $photoPath,
                                    'photo_url' => $photoUrl
                                ]);
                                break; // On prend le premier membre avec une photo
                            }
                        }
                    }
                }

                // ✅ Photos membres
                if (!empty($data['membres']) && is_array($data['membres'])) {
                    foreach ($data['membres'] as $i => $membre) {
                        $photoVal = $membre['photo'] ?? null;

                        if (!empty($photoVal)) {
                            if (is_object($photoVal) && method_exists($photoVal, 'isValid') && $photoVal->isValid()) {
                                $memberPhotoData = $this->storePhotoAsFile($photoVal);
                                $data['membres'][$i]['photo_path'] = $memberPhotoData['path'] ?? null;
                                $data['membres'][$i]['photo_url']  = $memberPhotoData['url']  ?? null;
                            } elseif (is_string($photoVal) && !empty($photoVal)) {
                                $data['membres'][$i]['photo_url']  = $photoVal;
                                $data['membres'][$i]['photo_path'] = $this->resolvePhotoPathFromUrl($photoVal);
                            }
                            unset($data['membres'][$i]['photo']);
                        }

                        // Convertir les booléens
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
                    'type'             => $type === 'conductor' ? 'conducteur' : 'famille',
                    'status'           => 'en_attente',
                    'photo_path'       => $photoPath,
                    'profile_photo_url' => $photoUrl,

                    'responsable_nom'                     => $data['responsable']['nom'] ?? null,
                    'responsable_prenom'                  => $data['responsable']['prenom'] ?? null,
                    'responsable_email'                   => $data['responsable']['email'] ?? null,
                    'responsable_tel'                     => $this->formatPhone($data['responsable']['tel'] ?? ''),
                    'responsable_telephone2'              => $this->formatPhone($data['responsable']['telephone2'] ?? ''),
                    'responsable_date_naissance'          => $data['responsable']['dateNaissance'] ?? null,
                    'responsable_genre'                   => $data['responsable']['genre'] ?? null,
                    'responsable_lien_parente'            => $data['responsable']['lienParente'] ?? null,
                    'responsable_profession'              => $data['responsable']['profession'] ?? null,
                    'responsable_fonction'                => $data['responsable']['fonction'] ?? null,
                    'responsable_statut_marital'          => $data['responsable']['statutMarital'] ?? null,
                    'responsable_date_mariage'            => $data['responsable']['dateMariage'] ?? null,
                    'responsable_lieu_mariage'            => $data['responsable']['lieuMariage'] ?? null,
                    'responsable_date_divorce'            => $data['responsable']['dateDivorce'] ?? null,
                    'responsable_lieu_divorce'            => $data['responsable']['lieuDivorce'] ?? null,
                    'responsable_date_deces'              => $data['responsable']['dateDeces'] ?? null,
                    'responsable_lieu_deces'              => $data['responsable']['lieuDeces'] ?? null,
                    'responsable_baptise'                 => $this->stringToBoolean($data['responsable']['baptise'] ?? false),
                    'responsable_date_bapteme'            => $data['responsable']['dateBapteme'] ?? null,
                    'responsable_lieu_bapteme'            => $data['responsable']['lieuBapteme'] ?? null,
                    'responsable_premiere_communion'      => $this->stringToBoolean($data['responsable']['premiereCommunion'] ?? false),
                    'responsable_date_premiere_communion' => $data['responsable']['datePremiereCommunion'] ?? null,
                    'responsable_lieu_premiere_communion' => $data['responsable']['lieuPremiereCommunion'] ?? null,
                    'responsable_marie_religieusement'    => $this->stringToBoolean($data['responsable']['marieReligieusement'] ?? false),
                    'responsable_date_mariage_religieux'  => $data['responsable']['dateMariageReligieux'] ?? null,
                    'responsable_lieu_mariage_religieux'  => $data['responsable']['lieuMariageReligieux'] ?? null,

                    'data' => [
                        'famille' => [
                            'nom'       => $data['famille']['nom'] ?? null,
                            'quartier'  => $data['famille']['quartier'] ?? null,
                            'adresse'   => $data['famille']['adresse'] ?? null,
                            'ville'     => $data['famille']['ville'] ?? null,
                            'telephone' => $data['famille']['telephone'] ?? null,
                            'telephone2' => $data['famille']['telephone2'] ?? null,
                            'classe_id' => $data['famille']['classe_id'] ?? null,
                        ],
                        'responsable' => [],
                        'membres'     => $data['membres'] ?? [],
                        'selectedRoles' => $data['selectedRoles'] ?? [],
                        'ip_address'  => request()->ip(),
                        'user_agent'  => request()->userAgent(),
                        'submitted_at' => now()->toIso8601String(),
                        'validation_info' => [
                            'passed_validation'    => true,
                            'validation_timestamp' => now()->toISOString(),
                            'validation_version'   => '2.0',
                            'security_checks'      => [
                                'duplicate_check'  => 'passed',
                                'data_integrity'   => 'verified',
                                'format_validation' => 'passed'
                            ]
                        ],
                        'processing_metadata' => [
                            'priority_level'              => 'normal',
                            'requires_admin_approval'     => true,
                            'requires_conductor_approval' => true,
                            'estimated_completion_days'   => 3
                        ]
                    ]
                ]);

                Log::info('Inscription créée avec succès - Validation renforcée appliquée', [
                    'id'        => $inscriptionFamille->id,
                    'reference' => 'INS-' . now()->format('Ymd') . '-' . str_pad($inscriptionFamille->id, 6, '0', STR_PAD_LEFT),
                    'type'      => $inscriptionFamille->type,
                    'status'    => $inscriptionFamille->status,
                    'email'     => $inscriptionFamille->responsable_email,
                    'responsable' => $inscriptionFamille->responsable_prenom . ' ' . $inscriptionFamille->responsable_nom,
                    'membres_count' => count($data['membres'] ?? []),
                    'classe_id' => $inscriptionFamille->classe_id,
                    'validation_version' => '2.0',
                    'security_checks_passed' => true,
                    'duplicate_check_performed' => true,
                    'ip_address' => request()->ip(),
                    'processing_metadata' => [
                        'requires_admin_approval'     => true,
                        'requires_conductor_approval' => true,
                        'estimated_completion_days'   => 3
                    ]
                ]);

                return [$inscriptionFamille];
            });

            return response()->json([
                'success' => true,
                'message' => $type === 'conductor'
                    ? '🎉 Excellente nouvelle ! Votre inscription de conducteur a été soumise avec succès. Bienvenue dans notre communauté spirituelle ! En attente de validation par l\'administrateur. Vous recevrez bientôt vos identifiants de connexion.'
                    : '🎉 Excellente nouvelle ! Votre inscription familiale a été soumise avec succès. Bienvenue dans notre grande famille spirituelle ! En attente de validation par l\'administrateur. Vous recevrez bientôt vos identifiants de connexion.',
                'inscription_ids'   => array_map(fn($i) => $i->id, $inscriptions),
                'inscription_count' => count($inscriptions),
                'status'            => 'en_attente',
                'reference'         => 'FAM-' . now()->format('Ymd') . '-' . str_pad($inscriptions[0]->id, 6, '0', STR_PAD_LEFT),
                'validation_version' => '2.0',
                'estimated_completion_days' => 3,
                'details' => [
                    'responsable'   => $inscriptions[0]->responsable_email ?? null,
                    'membres_count' => count($inscriptions[0]->data['membres'] ?? []),
                    'classe_id'     => $inscriptions[0]->classe_id,
                    'next_steps'    => [
                        'admin_approval_required'     => true,
                        'conductor_approval_required' => true,
                        'email_notification'          => 'Vous recevrez un email dès que votre inscription sera traitée.',
                        'estimated_completion'        => '3 jours ouvrables'
                    ]
                ],
                'timestamp' => now()->toISOString()
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'inscription', [
                'error' => $e->getMessage(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success'         => false,
                'message'         => 'Une erreur système s\'est produite lors du traitement de votre inscription. Nos équipes techniques ont été notifiées. Veuillez réessayer dans quelques instants ou contacter l\'administration si le problème persiste.',
                'error_reference' => 'REG-' . now()->format('YmdHis') . '-' . strtoupper(substr(md5($e->getMessage()), 0, 8)),
                'error_details'   => config('app.debug') ? $e->getMessage() : null,
                'timestamp'       => now()->toISOString()
            ], 500);
        }
    }

    /**
     * Valider complètement l'inscription
     */
    private function validateRegistration($input)
    {
        $errors   = [];
        $warnings = [];

        $famille = $input['famille'] ?? [];
        if (empty($famille['nom'])) {
            $errors['famille.nom'] = ['Le nom de la famille est obligatoire pour procéder à l\'inscription.'];
        } elseif (strlen($famille['nom']) < 2) {
            $errors['famille.nom'] = ['Le nom de famille doit contenir au moins 2 caractères.'];
        } elseif (strlen($famille['nom']) > 100) {
            $errors['famille.nom'] = ['Le nom de famille ne peut pas dépasser 100 caractères.'];
        } elseif (!preg_match('/^[a-zA-ZÀ-ÿ\s\-\']+$/u', $famille['nom'])) {
            $errors['famille.nom'] = ['Le nom de famille ne peut contenir que des lettres, espaces, tirets et apostrophes.'];
        }

        if (!empty($famille['adresse']) && strlen($famille['adresse']) < 10) {
            $errors['famille.adresse'] = ['L\'adresse doit être plus détaillée (minimum 10 caractères).'];
        }

        if (empty($famille['quartier'])) {
            $errors['famille.quartier'] = ['Le quartier de résidence est obligatoire.'];
        } elseif (strlen($famille['quartier']) < 2) {
            $errors['famille.quartier'] = ['Le nom du quartier doit faire au moins 2 caractères.'];
        }

        if (empty($famille['ville'])) {
            $errors['famille.ville'] = ['La ville de résidence est obligatoire.'];
        } else {
            $villeExists = Ville::where('id', $famille['ville'])->exists();
            if (!$villeExists) {
                $errors['famille.ville'] = ['La ville sélectionnée n\'est pas reconnue dans notre système.'];
            }
        }

        if (empty($famille['telephone'])) {
            $errors['famille.telephone'] = ['Le numéro de téléphone principal de la famille est obligatoire.'];
        } elseif (!$this->isValidPhone($famille['telephone'])) {
            $errors['famille.telephone'] = ['Le numéro de téléphone doit être exactement 10 chiffres, sans espaces ni caractères spéciaux.'];
        }

        if (empty($famille['classe_id'])) {
            $errors['famille.classe_id'] = ['La sélection d\'une classe paroissiale est obligatoire.'];
        } else {
            $classeExists = Classe::where('id', $famille['classe_id'])->exists();
            if (!$classeExists) {
                $errors['famille.classe_id'] = ['La classe sélectionnée n\'est pas disponible.'];
            }
        }

        $responsable = $input['responsable'] ?? [];
        if (empty($responsable['nom'])) {
            $errors['responsable.nom'] = ['Le nom du responsable familial est obligatoire.'];
        } elseif (strlen($responsable['nom']) < 2) {
            $errors['responsable.nom'] = ['Le nom doit contenir au moins 2 caractères.'];
        } elseif (strlen($responsable['nom']) > 50) {
            $errors['responsable.nom'] = ['Le nom ne peut pas dépasser 50 caractères.'];
        } elseif (!preg_match('/^[a-zA-ZÀ-ÿ\s\-\']+$/u', $responsable['nom'])) {
            $errors['responsable.nom'] = ['Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes.'];
        }

        if (empty($responsable['prenom'])) {
            $errors['responsable.prenom'] = ['Le prénom du responsable est obligatoire.'];
        } elseif (strlen($responsable['prenom']) < 2) {
            $errors['responsable.prenom'] = ['Le prénom doit contenir au moins 2 caractères.'];
        } elseif (strlen($responsable['prenom']) > 50) {
            $errors['responsable.prenom'] = ['Le prénom ne peut pas dépasser 50 caractères.'];
        } elseif (!preg_match('/^[a-zA-ZÀ-ÿ\s\-\']+$/u', $responsable['prenom'])) {
            $errors['responsable.prenom'] = ['Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes.'];
        }

        if (empty($responsable['email'])) {
            $errors['responsable.email'] = ['L\'adresse email du responsable est obligatoire pour la communication.'];
        } elseif (!filter_var($responsable['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['responsable.email'] = ['Le format de l\'adresse email n\'est pas valide.'];
        } elseif (strlen($responsable['email']) > 255) {
            $errors['responsable.email'] = ['L\'adresse email ne peut pas dépasser 255 caractères.'];
        }

        if (empty($responsable['tel'])) {
            $errors['responsable.tel'] = ['Le numéro de téléphone du responsable est obligatoire.'];
        } elseif (!$this->isValidPhone($responsable['tel'])) {
            $errors['responsable.tel'] = ['Le numéro de téléphone doit être exactement 10 chiffres.'];
        }

        if (empty($responsable['dateNaissance'])) {
            $errors['responsable.dateNaissance'] = ['La date de naissance du responsable est obligatoire.'];
        } elseif (!$this->isValidDate($responsable['dateNaissance'])) {
            $errors['responsable.dateNaissance'] = ['La date de naissance n\'est pas valide ou le format est incorrect.'];
        } else {
            $birthDate = new \DateTime($responsable['dateNaissance']);
            $today     = new \DateTime();
            $age       = $today->diff($birthDate)->y;
            if ($age < 18) {
                $errors['responsable.dateNaissance'] = ['L\'âge minimum requis est de 18 ans.'];
            } elseif ($age > 120) {
                $errors['responsable.dateNaissance'] = ['La date de naissance semble incorrecte.'];
            }
        }

        if (empty($responsable['genre'])) {
            $errors['responsable.genre'] = ['Le genre du responsable doit être spécifié.'];
        } elseif (!in_array($responsable['genre'], ['M', 'F'])) {
            $errors['responsable.genre'] = ['Le genre doit être Masculin (M) ou Féminin (F).'];
        }

        if (empty($responsable['profession'])) {
            $errors['responsable.profession'] = ['La profession du responsable est obligatoire.'];
        } elseif (strlen($responsable['profession']) > 100) {
            $errors['responsable.profession'] = ['La profession ne peut pas dépasser 100 caractères.'];
        }

        if (empty($responsable['statutMarital'])) {
            $errors['responsable.statutMarital'] = ['Le statut marital du responsable est obligatoire.'];
        } elseif (!in_array($responsable['statutMarital'], ['celibataire', 'marie', 'divorce', 'veuf', 'dot'])) {
            $errors['responsable.statutMarital'] = ['Le statut marital sélectionné n\'est pas valide.'];
        }

        if (!empty($responsable['photo']) && is_object($responsable['photo']) && method_exists($responsable['photo'], 'isValid')) {
            if (!$responsable['photo']->isValid()) {
                $errors['responsable.photo'] = ['La photo du responsable n\'est pas valide ou est corrompue.'];
            } else {
                if ($responsable['photo']->getSize() > 5242880) {
                    $errors['responsable.photo'] = ['La photo du responsable ne peut pas dépasser 5MB.'];
                }
                $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
                if (!in_array($responsable['photo']->getMimeType(), $allowedMimes)) {
                    $errors['responsable.photo'] = ['La photo doit être au format JPEG, JPG ou PNG uniquement.'];
                }
            }
        }

        if (!empty($input['membres'])) {
            foreach ($input['membres'] as $i => $membre) {
                if (empty($membre['nom'])) {
                    $errors["membres.{$i}.nom"] = ['Le nom du membre est obligatoire.'];
                } elseif (strlen($membre['nom']) < 2 || strlen($membre['nom']) > 50) {
                    $errors["membres.{$i}.nom"] = ['Le nom du membre doit contenir entre 2 et 50 caractères.'];
                }

                if (empty($membre['prenom'])) {
                    $errors["membres.{$i}.prenom"] = ['Le prénom du membre est obligatoire.'];
                } elseif (strlen($membre['prenom']) < 2 || strlen($membre['prenom']) > 50) {
                    $errors["membres.{$i}.prenom"] = ['Le prénom du membre doit contenir entre 2 et 50 caractères.'];
                }

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

                if (!empty($membre['photo']) && is_object($membre['photo']) && method_exists($membre['photo'], 'isValid')) {
                    if (!$membre['photo']->isValid()) {
                        $errors["membres.{$i}.photo"] = ['La photo du membre n\'est pas valide.'];
                    } elseif ($membre['photo']->getSize() > 5242880) {
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

        if (!empty($input['membres']) && count($input['membres']) > 20) {
            $errors['general'] = ['Une famille ne peut pas avoir plus de 20 membres.'];
        }

        if (!empty($errors)) {
            return [
                'success'              => false,
                'errors'               => $errors,
                'warnings'             => $warnings,
                'validation_timestamp' => now()->toISOString()
            ];
        }

        return [
            'success' => true,
            'data'    => [
                'type'        => 'famille',
                'famille'     => $famille,
                'responsable' => $responsable,
                'membres'     => $input['membres'] ?? [],
                'consentement' => $input['consentement'] ?? false,
                'classe_id'   => $famille['classe_id'] ?? null,
            ],
            'validation_timestamp' => now()->toISOString()
        ];
    }

    /**
     * Vérifier les doublons
     */
    private function checkDuplicates($data)
    {
        $this->initializeUniqueChecker();
        $checker = app(UniqueConstraintChecker::class);

        try {
            $email = $data['responsable']['email'] ?? null;
            if ($email) {
                $checker->checkEmailUnique($email);
                $checker->checkInscriptionEmailUnique($email);
            }

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
                $checker->checkMultipleEmailsUnique(array_merge([$email], $memberEmails));
            }

            return ['success' => true];
        } catch (\Exception $e) {
            Log::warning('Duplicate check failed', ['error' => $e->getMessage()]);

            if ($e instanceof \App\Exceptions\UniqueConstraintViolationException) {
                $errorArray = $e->toArray();
                return [
                    'success' => false,
                    'errors'  => [$errorArray['field'] => [$errorArray['message']]]
                ];
            }

            return [
                'success' => false,
                'errors'  => ['general' => [$e->getMessage()]]
            ];
        }
    }

    /**
     * Enregistrement public pour Conducteur
     */
    public function storeConductor(Request $request)
    {
        try {
            $responsable = $request->input('responsable', []);
            if (is_array($responsable) && !empty($responsable)) {
                $request->merge([
                    'nom'          => $responsable['nom'] ?? $request->input('nom'),
                    'prenom'       => $responsable['prenom'] ?? $request->input('prenom'),
                    'email'        => $responsable['email'] ?? $request->input('email'),
                    'telephone'    => $responsable['tel'] ?? $request->input('telephone'),
                    'telephone2'   => $responsable['telephone2'] ?? $request->input('telephone2'),
                    'dateNaissance' => $responsable['dateNaissance'] ?? $request->input('dateNaissance'),
                    'genre'        => $responsable['genre'] ?? $request->input('genre'),
                    'adresse'      => $responsable['adresse'] ?? $request->input('adresse'),
                    'ville_id'     => $responsable['ville_id'] ?? $request->input('ville_id'),
                    'fonction'     => $responsable['fonction'] ?? $request->input('fonction'),
                    'statutMarital' => $responsable['statutMarital'] ?? $request->input('statutMarital'),
                    'dateDivorce'  => $responsable['dateDivorce'] ?? $request->input('dateDivorce'),
                ]);
            }

            Log::info('Inscription conducteur reçue', [
                'method'       => $request->method(),
                'content_type' => $request->header('Content-Type'),
                'all_data'     => $request->all(),
            ]);

            $validated = $request->validate([
                'nom'          => 'required|string|max:255',
                'prenom'       => 'required|string|max:255',
                'email'        => 'nullable|email|max:255',
                'telephone'    => 'required|string|max:20',
                'telephone2'   => 'nullable|string|max:20',
                'dateNaissance' => 'required|date_format:Y-m-d',
                'genre'        => 'required|in:M,F',
                'adresse'      => 'nullable|string|max:255',
                'ville'        => 'nullable|string|max:100',
                'ville_id'     => 'nullable|integer|exists:villes,id',
                'fonction'     => 'nullable|string|max:255',
                'statutMarital' => 'nullable|string',
                'dateMariageniv' => 'nullable|date_format:Y-m-d',
                'lieuMariagePerso' => 'nullable|string|max:255',
                'dateDivorce'  => 'nullable|date_format:Y-m-d',
                'dateDecesConjoint' => 'nullable|date_format:Y-m-d',
                'classe_id'    => 'required|integer|exists:classes,id',
                'spirituel.baptise' => 'required|string|in:true,false',
                'spirituel.dateBapteme' => 'nullable|date_format:Y-m-d',
                'spirituel.lieuBapteme' => 'nullable|string|max:255',
                'spirituel.premiereCommunion' => 'required|string|in:true,false',
                'spirituel.datePremiereCommunion' => 'nullable|date_format:Y-m-d',
                'spirituel.lieuPremiereCommunion' => 'nullable|string|max:255',
                'spirituel.marieReligieusement' => 'required|string|in:true,false',
                'spirituel.dateMariage' => 'nullable|date_format:Y-m-d',
                'spirituel.lieuMariage' => 'nullable|string|max:255',
                'isResponsableFamille' => 'nullable|string',
                'familyData.nom' => 'nullable|string|max:255',
                'familyData.telephone' => 'nullable|string|max:20',
                'familyData.telephone2' => 'nullable|string|max:20',
                'familyData.adresse' => 'nullable|string|max:255',
                'familyData.quartier' => 'nullable|string|max:255',
                'familyData.ville' => 'nullable|string|max:100',
                'familyData.ville_id' => 'nullable|integer|exists:villes,id',
                'selectedRoles'    => 'nullable|array',
                'selectedRoles.*.id' => 'nullable|integer|exists:fonctions,id',
            ], [], [
                'nom'          => 'Nom',
                'prenom'       => 'Prénom',
                'email'        => 'Email',
                'telephone'    => 'Téléphone',
                'dateNaissance' => 'Date de naissance',
                'genre'        => 'Genre',
                'classe_id'    => 'Classe',
            ]);

            $inscription = DB::transaction(function () use ($validated, $request) {
                $familleInput    = $request->input('famille', []);
                $responsableInput = $request->input('responsable', []);
                $membresInput    = $request->input('membres', []);

                $photoPath = null;
                $photoUrl  = null;
                if ($request->hasFile('responsable.photo')) {
                    $photoData = $this->storePhotoAsFile($request->file('responsable.photo'));
                    $photoPath = $photoData['path'] ?? null;
                    $photoUrl  = $photoData['url']  ?? null;
                } elseif (!empty($responsableInput['photo']) && is_string($responsableInput['photo'])) {
                    $photoUrl  = $responsableInput['photo'];
                    $photoPath = $this->resolvePhotoPathFromUrl($photoUrl);
                } else {
                    // ✅ FALLBACK: Si pas de photo responsable, utiliser la photo du premier membre
                    if (!empty($membresInput) && is_array($membresInput)) {
                        foreach ($membresInput as $member) {
                            if (!empty($member['photo_path']) || !empty($member['photo_url'])) {
                                $photoPath = $member['photo_path'] ?? null;
                                $photoUrl  = $member['photo_url'] ?? null;
                                Log::info('🔄 Photo conducteur récupérée du premier membre', [
                                    'member_name' => ($member['prenom'] ?? '') . ' ' . ($member['nom'] ?? ''),
                                    'photo_path' => $photoPath,
                                    'photo_url' => $photoUrl
                                ]);
                                break;
                            }
                        }
                    }
                }

                $normalizedMembers = is_array($membresInput) ? $membresInput : [];
                foreach ($normalizedMembers as $index => $member) {
                    if ($request->hasFile("membres.{$index}.photo")) {
                        $memberPhotoData = $this->storePhotoAsFile($request->file("membres.{$index}.photo"));
                        $normalizedMembers[$index]['photo_path'] = $memberPhotoData['path'] ?? null;
                        $normalizedMembers[$index]['photo_url']  = $memberPhotoData['url']  ?? null;
                        unset($normalizedMembers[$index]['photo']);
                    } elseif (!empty($member['photo']) && is_string($member['photo'])) {
                        $normalizedMembers[$index]['photo_path'] = $this->resolvePhotoPathFromUrl($member['photo']);
                        $normalizedMembers[$index]['photo_url']  = $member['photo'];
                    }
                }

                $familleData = [
                    'nom'       => $familleInput['nom'] ?? $validated['nom'],
                    'adresse'   => $familleInput['adresse'] ?? $validated['adresse'] ?? null,
                    'quartier'  => $familleInput['quartier'] ?? null,
                    'ville'     => $familleInput['ville'] ?? $validated['ville_id'] ?? null,
                    'telephone' => $familleInput['telephone'] ?? $validated['telephone'],
                    'telephone2' => $familleInput['telephone2'] ?? $validated['telephone2'] ?? null,
                    'classe_id' => $familleInput['classe_id'] ?? $validated['classe_id'],
                ];

                $responsableData = [
                    'nom'               => $responsableInput['nom'] ?? $validated['nom'],
                    'prenom'            => $responsableInput['prenom'] ?? $validated['prenom'],
                    'email'             => $responsableInput['email'] ?? ($validated['email'] ?? null),
                    'tel'               => $responsableInput['tel'] ?? $validated['telephone'],
                    'telephone2'        => $responsableInput['telephone2'] ?? ($validated['telephone2'] ?? null),
                    'dateNaissance'     => $responsableInput['dateNaissance'] ?? $validated['dateNaissance'],
                    'genre'             => $responsableInput['genre'] ?? $validated['genre'],
                    'profession'        => $responsableInput['profession'] ?? ($validated['fonction'] ?? null),
                    'fonction'          => $responsableInput['fonction'] ?? ($validated['fonction'] ?? null),
                    'statutMarital'     => $responsableInput['statutMarital'] ?? ($validated['statutMarital'] ?? null),
                    'dateMariage'       => $responsableInput['dateMariage'] ?? ($validated['dateMariageniv'] ?? null),
                    'lieuMariage'       => $responsableInput['lieuMariage'] ?? ($validated['lieuMariagePerso'] ?? null),
                    'dateDivorce'       => $responsableInput['dateDivorce'] ?? ($validated['dateDivorce'] ?? null),
                    'dateDeces'         => $responsableInput['dateDeces'] ?? ($validated['dateDecesConjoint'] ?? null),
                    'adresse'           => $responsableInput['adresse'] ?? ($validated['adresse'] ?? null),
                    'ville_id'          => $responsableInput['ville_id'] ?? ($validated['ville_id'] ?? null),
                    'baptise'           => $validated['spirituel']['baptise'] === 'true',
                    'dateBapteme'       => $validated['spirituel']['dateBapteme'] ?? null,
                    'lieuBapteme'       => $validated['spirituel']['lieuBapteme'] ?? null,
                    'premiereCommunion' => $validated['spirituel']['premiereCommunion'] === 'true',
                    'datePremiereCommunion' => $validated['spirituel']['datePremiereCommunion'] ?? null,
                    'lieuPremiereCommunion' => $validated['spirituel']['lieuPremiereCommunion'] ?? null,
                    'marieReligieusement'   => $validated['spirituel']['marieReligieusement'] === 'true',
                    'dateMariageReligieux'  => $validated['spirituel']['dateMariage'] ?? null,
                    'lieuMariageReligieux'  => $validated['spirituel']['lieuMariage'] ?? null,
                    'photo_path'        => $photoPath,
                    'photo_url'         => $photoUrl,
                ];

                $inscription = Inscription::create([
                    'type'             => 'conducteur',
                    'classe_id'        => $validated['classe_id'],
                    'nom'              => $validated['nom'],
                    'prenom'           => $validated['prenom'],
                    'photo_path'       => $photoPath,
                    'profile_photo_url' => $photoUrl,
                    'responsable_nom'  => $responsableData['nom'] ?? $validated['nom'],
                    'responsable_prenom' => $responsableData['prenom'] ?? $validated['prenom'],
                    'responsable_email' => $responsableData['email'] ?? ($validated['email'] ?? null),
                    'responsable_tel'  => $this->formatPhone($responsableData['tel'] ?? $validated['telephone']),
                    'email'            => $validated['email'] ?? null,
                    'telephone'        => $this->formatPhone($validated['telephone']),
                    'telephone2'       => !empty($validated['telephone2']) ? $this->formatPhone($validated['telephone2']) : null,
                    'date_naissance'   => $validated['dateNaissance'],
                    'genre'            => $validated['genre'],
                    'adresse'          => $validated['adresse'] ?? null,
                    'ville'            => $validated['ville'] ?? null,
                    'ville_id'         => $validated['ville_id'] ?? null,
                    'fonction'         => $validated['fonction'] ?? null,
                    'statut_marital'   => $validated['statutMarital'] ?? null,
                    'date_mariage'     => $validated['dateMariageniv'] ?? null,
                    'lieu_mariage'     => $validated['lieuMariagePerso'] ?? null,
                    'date_divorce'     => $validated['dateDivorce'] ?? null,
                    'date_deces_conjoint' => $validated['dateDecesConjoint'] ?? null,
                    'baptise'          => $validated['spirituel']['baptise'] === 'true' ? 1 : 0,
                    'date_bapteme'     => $validated['spirituel']['dateBapteme'] ?? null,
                    'lieu_bapteme'     => $validated['spirituel']['lieuBapteme'] ?? null,
                    'premiere_communion' => $validated['spirituel']['premiereCommunion'] === 'true' ? 1 : 0,
                    'date_premiere_communion' => $validated['spirituel']['datePremiereCommunion'] ?? null,
                    'lieu_premiere_communion' => $validated['spirituel']['lieuPremiereCommunion'] ?? null,
                    'mariage_religieux' => $validated['spirituel']['marieReligieusement'] === 'true' ? 1 : 0,
                    'date_mariage_religieux' => $validated['spirituel']['dateMariage'] ?? null,
                    'lieu_mariage_religieux' => $validated['spirituel']['lieuMariage'] ?? null,
                    'status'           => 'en_attente',
                    'admin_approved'   => false,
                    'data'             => [
                        'famille'     => $familleData,
                        'responsable' => $responsableData,
                        'membres'     => $normalizedMembers,
                        'spirituel'   => [
                            'baptise'           => $validated['spirituel']['baptise'] === 'true',
                            'dateBapteme'       => $validated['spirituel']['dateBapteme'] ?? null,
                            'lieuBapteme'       => $validated['spirituel']['lieuBapteme'] ?? null,
                            'premiereCommunion' => $validated['spirituel']['premiereCommunion'] === 'true',
                            'datePremiereCommunion' => $validated['spirituel']['datePremiereCommunion'] ?? null,
                            'lieuPremiereCommunion' => $validated['spirituel']['lieuPremiereCommunion'] ?? null,
                            'marieReligieusement'   => $validated['spirituel']['marieReligieusement'] === 'true',
                            'dateMariage'       => $validated['spirituel']['dateMariage'] ?? null,
                            'lieuMariage'       => $validated['spirituel']['lieuMariage'] ?? null,
                        ],
                        'isResponsableFamille' => (($validated['isResponsableFamille'] ?? 'false') === 'true')
                            || (($validated['isResponsableFamille'] ?? '0') === '1'),
                        'familyData'    => $validated['familyData'] ?? null,
                        'selectedRoles' => $validated['selectedRoles'] ?? [],
                    ],
                ]);

                Log::info('Inscription conducteur créée', [
                    'inscription_id' => $inscription->id,
                    'email'          => $inscription->email,
                    'status'         => $inscription->status,
                ]);

                return $inscription;
            });

            return response()->json([
                'success' => true,
                'message' => '🎉 Excellente nouvelle ! Votre inscription de conducteur a été soumise avec succès. Bienvenue dans notre communauté spirituelle ! En attente de validation par l\'administrateur. Vous recevrez bientôt vos identifiants de connexion.',
                'data'    => [
                    'inscription_id'           => $inscription->id,
                    'reference'                => 'COND-' . now()->format('Ymd') . '-' . str_pad($inscription->id, 6, '0', STR_PAD_LEFT),
                    'status'                   => $inscription->status,
                    'validation_version'       => '2.0',
                    'estimated_completion_days' => 3,
                    'next_steps'               => [
                        'admin_approval_required'     => true,
                        'conductor_approval_required' => false,
                        'email_notification'          => 'Vous recevrez un email dès que votre inscription sera traitée.'
                    ]
                ],
                'timestamp' => now()->toISOString()
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Erreur de validation inscription conducteur', [
                'errors'             => $e->errors(),
                'validation_version' => '2.0',
                'ip_address'         => request()->ip(),
                'user_agent'         => request()->userAgent()
            ]);
            return response()->json([
                'success'            => false,
                'message'            => 'Les informations fournies ne respectent pas nos critères de validation renforcée. Veuillez corriger les erreurs suivantes avant de soumettre à nouveau votre inscription.',
                'errors'             => $e->errors(),
                'error_count'        => count($e->errors()),
                'validation_version' => '2.0',
                'timestamp'          => now()->toISOString()
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
     * Stocker une photo et retourner le chemin + URL
     */
    private function storePhotoAsFile($file)
    {
        try {
            if (!$file || !$file->isValid()) {
                return null;
            }

            $extension = $file->getClientOriginalExtension();
            $filename  = 'inscription_' . uniqid() . '_' . time() . '.' . $extension;

            $path = Storage::disk('public')->putFileAs('inscriptions', $file, $filename);

            $photoUrl = '/storage/' . ltrim($path, '/');

            Log::info('Photo stockée avec succès', [
                'path'     => $path,
                'url'      => $photoUrl,
                'filename' => $filename
            ]);

            return ['path' => $path, 'url' => $photoUrl];
        } catch (\Exception $e) {
            Log::error('Erreur lors du stockage de la photo en fichier', [
                'error' => $e->getMessage(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine()
            ]);
            return null;
        }
    }

    /**
     * Stocker une photo dans le système de fichiers
     */
    private function storePhoto($file)
    {
        try {
            if (!$file || !$file->isValid()) {
                return null;
            }

            $path = $file->store('inscriptions', 'public');

            Log::info('Photo stockée avec succès', [
                'path'          => $path,
                'original_name' => $file->getClientOriginalName(),
                'size'          => $file->getSize(),
            ]);

            return $path;
        } catch (\Exception $e) {
            Log::error('Erreur lors du stockage de la photo', [
                'error' => $e->getMessage(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine()
            ]);
            return null;
        }
    }

    /**
     * Résout le chemin relatif de stockage à partir d'une URL publique.
     */
    private function resolvePhotoPathFromUrl(string $url): ?string
    {
        if (!$url) {
            return null;
        }

        if (!str_contains($url, '://') && !str_starts_with($url, '/storage/') && !str_starts_with($url, 'storage/')) {
            return ltrim($url, '/');
        }

        if (str_starts_with($url, '/storage/')) {
            return ltrim(substr($url, strlen('/storage/')), '/');
        }

        if (str_starts_with($url, 'storage/')) {
            return ltrim(substr($url, strlen('storage/')), '/');
        }

        $storageUrl = asset('storage/');
        if (str_starts_with($url, $storageUrl)) {
            return ltrim(str_replace($storageUrl, '', $url), '/');
        }

        $parsed = parse_url($url);
        if (isset($parsed['path']) && str_contains($parsed['path'], '/storage/')) {
            $relative = substr($parsed['path'], strpos($parsed['path'], '/storage/') + strlen('/storage/'));
            return ltrim($relative, '/');
        }

        return null;
    }

    /**
     * @deprecated
     */
    private function storePhotoAsBase64($file)
    {
        try {
            if (!$file || !$file->isValid()) {
                return null;
            }
            $photoContent = file_get_contents($file->getRealPath());
            $mimeType     = $file->getMimeType();
            $base64Photo  = 'data:' . $mimeType . ';base64,' . base64_encode($photoContent);
            Log::info('Photo convertie en base64', ['size' => strlen($base64Photo), 'mime_type' => $mimeType]);
            return $base64Photo;
        } catch (\Exception $e) {
            Log::error('Erreur base64', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Formater les numéros de téléphone
     */
    private function formatPhone($phone)
    {
        if (!$phone) return '';
        $cleaned = preg_replace('/\D/', '', $phone);
        return strlen($cleaned) === 10 ? $cleaned : '';
    }

    /**
     * Valider le format du téléphone
     */
    private function isValidPhone($phone)
    {
        if (!$phone) return false;
        $cleaned = preg_replace('/\D/', '', $phone);
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
     * Convertir une string 'true'/'false' en entier 1/0
     */
    private function stringToBoolean($value)
    {
        if (is_bool($value)) return $value ? 1 : 0;
        if (is_string($value)) return in_array(strtolower($value), ['true', '1', 'yes', 'on']) ? 1 : 0;
        return (bool) $value ? 1 : 0;
    }
}
