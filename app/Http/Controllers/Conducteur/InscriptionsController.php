<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\Family;
use App\Models\Inscription;
use App\Models\User;
use App\Models\UserSacrement;
use App\Mail\SendCredentials;
use App\Mail\InscriptionRejected;
use App\Services\InscriptionApprovalService;
use App\Helpers\PhotoHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InscriptionsController extends Controller
{
    /**
     * Retourne la colonne de statut existante sur users.
     */
    private function getUserStatusColumn(): ?string
    {
        if (Schema::hasColumn('users', 'statut')) {
            return 'statut';
        }

        if (Schema::hasColumn('users', 'status')) {
            return 'status';
        }

        return null;
    }

    /**
     * Normalise un statut user pour le front conducteur.
     */
    private function normalizeUserStatus(?string $status): string
    {
        $value = strtolower((string) $status);

        if (in_array($value, ['inactif', 'inactive'], true)) {
            return 'inactif';
        }

        if (in_array($value, ['decede', 'deceased'], true)) {
            return 'decede';
        }

        return 'actif';
    }

    private function setUserStatus(User $member, bool $isActive): void
    {
        if (Schema::hasColumn('users', 'status')) {
            $member->setAttribute('status', $isActive ? 'active' : 'inactive');
        }

        if (Schema::hasColumn('users', 'statut')) {
            $member->setAttribute('statut', $isActive ? 'actif' : 'inactif');
        }

        $member->save();
    }

    /**
     * Afficher les inscriptions de sa classe
     */
    public function index()
    {
        $user = Auth::user();

        // Vérifier que c'est un conducteur
        if ($user->role !== 'conducteur') {
            abort(403, 'Accès non autorisé');
        }

        try {
            // Récupérer les classes gérées par le conducteur
            $conductorClasses = $user->getManagedClasses();

            if ($conductorClasses->isEmpty()) {
                return Inertia::render('Conducteur/Inscriptions', [
                    'inscriptions' => [],
                    'members' => [],
                    'className' => 'Aucune classe',
                    'pendingCount' => 0,
                    'approvedCount' => 0,
                    'rejectedCount' => 0,
                ]);
            }

            $classIds = $conductorClasses->pluck('id')->toArray();
            $classIdsStr = array_map('strval', $classIds);
            $className = $conductorClasses->first()->nom ?? 'Classes multiples';

            // Récupérer les inscriptions filtrées par statut et approbateur
            $allInscriptions = [];
            $pendingInscriptions = collect();
            $approvedInscriptions = collect();
            $rejectedInscriptions = collect();
            try {
                $placeholders = implode(',', array_fill(0, count($classIds), '?'));

                // ✅ DEBUG: Vérifier toutes les inscriptions en base
                $allInscriptionsInDb = Inscription::all()->count();
                $allInscriptionsData = Inscription::all()->map(function ($i) {
                    return [
                        'id' => $i->id,
                        'type' => $i->type,
                        'status' => $i->status,
                        'data_famille_classe_id' => $i->data['famille']['classe_id'] ?? null,
                    ];
                });

                Log::info('✅ DEBUG - Toutes les inscriptions en base', [
                    'total_count' => $allInscriptionsInDb,
                    'inscriptions' => $allInscriptionsData,
                ]);

                Log::info('Conducteur Inscriptions Debug', [
                    'conducteur_id' => $user->id,
                    'classIds' => $classIds,
                    'placeholders' => $placeholders,
                ]);

                // Inscriptions en attente (tous status en_attente de la classe)
                $pendingInscriptions = Inscription::where('status', 'en_attente')
                    ->get()
                    ->filter(function ($insc) use ($classIds) {
                        $classeId = $insc->data['famille']['classe_id']
                            ?? $insc->data['classe_id']
                            ?? $insc->data['responsable']['classe_id']
                            ?? $insc->classe_id
                            ?? null;
                        return in_array($classeId, $classIds);
                    })
                    ->values();

                // Inscriptions approuvées (toutes celles approuvées de la classe)
                $approvedInscriptions = Inscription::where('status', 'approuve')
                    ->get()
                    ->filter(function ($insc) use ($classIds) {
                        $classeId = $insc->data['famille']['classe_id']
                            ?? $insc->data['classe_id']
                            ?? $insc->data['responsable']['classe_id']
                            ?? $insc->classe_id
                            ?? null;
                        return in_array($classeId, $classIds);
                    })
                    ->values();

                Log::info('Approved Inscriptions Query Result', [
                    'count' => $approvedInscriptions->count(),
                    'inscriptions' => $approvedInscriptions->map(function ($i) {
                        return [
                            'id' => $i->id,
                            'type' => $i->type,
                            'status' => $i->status,
                            'data_classe_id' => $i->data['famille']['classe_id'] ?? $i->classe_id ?? null,
                        ];
                    }),
                ]);

                // Inscriptions rejetées (toutes celles rejetées de la classe)
                $rejectedInscriptions = Inscription::where('status', 'rejete')
                    ->get()
                    ->filter(function ($insc) use ($classIds) {
                        $classeId = $insc->data['famille']['classe_id']
                            ?? $insc->data['classe_id']
                            ?? $insc->data['responsable']['classe_id']
                            ?? $insc->classe_id
                            ?? null;
                        return in_array($classeId, $classIds);
                    })
                    ->values();


                Log::info('✅ DEBUG - Résultats des requêtes d\'inscriptions', [
                    'pending_count' => $pendingInscriptions->count(),
                    'approved_count' => $approvedInscriptions->count(),
                    'rejected_count' => $rejectedInscriptions->count(),
                    'pending_inscriptions' => $pendingInscriptions->map(function ($i) {
                        return ['id' => $i->id, 'status' => $i->status];
                    }),
                    'approved_inscriptions' => $approvedInscriptions->map(function ($i) {
                        return ['id' => $i->id, 'status' => $i->status];
                    }),
                ]);

                // Fusionner toutes les inscriptions pertinentes
                $allInscriptionsQuery = $pendingInscriptions->merge($approvedInscriptions)->merge($rejectedInscriptions);

                Log::info('✅ DEBUG - Après fusion', [
                    'total_merged_count' => $allInscriptionsQuery->count(),
                ]);

                $allInscriptions = $allInscriptionsQuery->map(function ($insc) {
                    try {
                        // Récupérer les noms des approbateurs
                        $adminName = null;
                        $conducteurName = null;

                        if ($insc->admin_id) {
                            $admin = \App\Models\User::find($insc->admin_id);
                            $adminName = $admin ? $admin->prenom . ' ' . $admin->nom : 'Admin inconnu';
                        }

                        if ($insc->conducteur_id) {
                            $conducteur = \App\Models\User::find($insc->conducteur_id);
                            $conducteurName = $conducteur ? $conducteur->prenom . ' ' . $conducteur->nom : 'Conducteur inconnu';
                        }

                        $mapped = [
                            'id' => $insc->id,
                            'type' => $insc->type ?? 'inscription_public', // Type réel: famille, conducteur, pasteur
                            'nom' => $insc->responsable_nom ?? ($insc->data['responsable']['nom'] ?? null),
                            'prenom' => $insc->responsable_prenom ?? ($insc->data['responsable']['prenom'] ?? null),
                            'email' => $insc->responsable_email ?? ($insc->data['responsable']['email'] ?? null),
                            'telephone' => $insc->responsable_tel ?? ($insc->data['responsable']['tel'] ?? null),
                            'telephone2' => $insc->responsable_telephone2,
                            'genre' => $insc->responsable_genre,
                            'date_naissance' => $insc->responsable_date_naissance ?? ($insc->data['responsable']['dateNaissance'] ?? null),
                            'adresse' => $insc->data['responsable']['adresse'] ?? null,
                            'fonction_professionnelle' => $insc->responsable_profession ?? ($insc->data['responsable']['profession'] ?? null),
                            'statut_marital' => $insc->responsable_statut_marital,
                            'date_mariage' => $insc->responsable_date_mariage,
                            'lieu_mariage' => $insc->responsable_lieu_mariage,
                            'date_divorce' => $insc->responsable_date_divorce,
                            'baptise' => $insc->responsable_baptise,
                            'date_bapteme' => $insc->responsable_date_bapteme,
                            'lieu_bapteme' => $insc->responsable_lieu_bapteme,
                            'premiere_communion' => $insc->responsable_premiere_communion,
                            'date_premiere_communion' => $insc->responsable_date_premiere_communion,
                            'mariage_religieux' => $insc->responsable_marie_religieusement,
                            'date_mariage_religieux' => $insc->responsable_date_mariage_religieux,
                            'famille_id' => $insc->family_id,
                            'responsable_famille' => ($insc->responsable_nom && $insc->responsable_prenom) ? $insc->responsable_nom . ' ' . $insc->responsable_prenom : 'N/A',
                            'status' => $insc->status,
                            'role' => $insc->type === 'conducteur'
                                ? 'conducteur'
                                : ($insc->type === 'famille' ? 'responsable_famille' : ($insc->data['role'] ?? null)),
                            'conducteur_approved' => $insc->conducteur_approved_at ? true : false,
                            'admin_approved' => $insc->admin_id ? true : false,
                            'admin_id' => $insc->admin_id,
                            'conducteur_id' => $insc->conducteur_id,
                            'admin_name' => $adminName,
                            'conducteur_name' => $conducteurName,
                            'admin_approved_at' => $insc->admin_approved_at,
                            'conducteur_approved_at' => $insc->conducteur_approved_at,
                            'raison_rejet' => $insc->raison_rejet,
                            'created_at' => $insc->created_at,
                            'updated_at' => $insc->updated_at,
                            'profile_photo_url' => PhotoHelper::getPhotoUrl(
                                $insc->photo_path ?? ($insc->photo_data ?? null),
                                $insc->responsable_prenom ?? ($insc->data['responsable']['prenom'] ?? null),
                                $insc->responsable_nom ?? ($insc->data['responsable']['nom'] ?? null)
                            ),
                        ];

                        // Ajouter les données familiales si c'est une inscription de famille
                        if ($insc->type === 'famille') {
                            $mapped['famille_nom'] = $insc->responsable_nom . ' ' . $insc->responsable_prenom;
                            $mapped['responsable_nom'] = $insc->responsable_nom;
                            $mapped['responsable_prenom'] = $insc->responsable_prenom;
                            $mapped['responsable_email'] = $insc->responsable_email;
                            $mapped['responsable_tel'] = $insc->responsable_tel;
                            $mapped['responsable_fonction'] = $insc->responsable_profession ?? ($insc->data['responsable']['profession'] ?? null);
                            $mapped['responsable_date_naissance'] = $insc->responsable_date_naissance ?? ($insc->data['responsable']['dateNaissance'] ?? null);
                            $mapped['responsable_genre'] = $insc->responsable_genre;
                            $mapped['membres_count'] = isset($insc->data['membres']) ? count($insc->data['membres']) : 0;
                            $mapped['membres'] = isset($insc->data['membres']) ? $insc->data['membres'] : [];
                        }

                        // Ensure classe_id is available for filtering
                        $mapped['classe_id'] = $insc->data['famille']['classe_id']
                            ?? $insc->data['classe_id']
                            ?? $insc->data['responsable']['classe_id']
                            ?? $insc->classe_id
                            ?? null;

                        return $mapped;
                    } catch (\Exception $e) {
                        Log::warning('Erreur lors du mapping d\'une inscription', [
                            'inscription_id' => $insc->id ?? null,
                            'error' => $e->getMessage()
                        ]);
                        return null; // Skip this inscription
                    }
                })->filter()->values(); // Remove null values
            } catch (\Exception $e) {
                Log::error('Erreur lors de la récupération des inscriptions', [
                    'class_ids' => $classIds,
                    'error' => $e->getMessage()
                ]);
                $allInscriptions = [];
                $pendingInscriptions = collect();
                $approvedInscriptions = collect();
                $rejectedInscriptions = collect();
            }

            // Récupérer les membres (users) déjà créés de sa classe
            // Charger les membres en incluant les sacrements pour exposer statut_marital etc.
            $members = User::whereIn('classe_id', $classIds)
                ->where('role', '!=', 'admin')
                ->with('sacrements')
                ->get()
                ->map(function ($member) {
                    // Déduire un statut_marital simple à partir de UserSacrement s'il existe
                    $statutMarital = null;
                    if ($member->sacrements) {
                        if ($member->sacrements->est_marie) {
                            $statutMarital = 'marie';
                        } elseif ($member->sacrements->est_divorce) {
                            $statutMarital = 'divorce';
                        } elseif ($member->sacrements->est_veuf) {
                            $statutMarital = 'veuf';
                        }
                    }

                    return [
                        'id' => $member->id,
                        'nom' => $member->nom,
                        'prenom' => $member->prenom,
                        'last_name' => $member->nom,
                        'first_name' => $member->prenom,
                        'email' => $member->email,
                        'phone' => $member->telephone,
                        'genre' => $member->genre ?? null,
                        'role' => $member->role,
                        'status' => $this->normalizeUserStatus($member->statut ?? $member->status ?? null),
                        'famille_id' => $member->family_id,
                        'profile_photo_url' => PhotoHelper::getPhotoUrl($member->photo_path, $member->prenom, $member->nom),
                        'date_naissance' => $member->date_naissance,
                        'profession' => $member->profession,
                        'fonction_professionnelle' => $member->profession,
                        'fonction_id' => $member->fonction_id ?? null,
                        'relation' => $member->relation ?? null,
                        'statut_marital' => $statutMarital,
                        'sacrements' => $member->sacrements ? $member->sacrements->toArray() : null,
                        'created_at' => $member->created_at,
                        'updated_at' => $member->updated_at,
                        'raw' => $member->toArray(),
                    ];
                });

            // Compter les stats - seulement celles traitées par ce conducteur
            $pendingCount = $pendingInscriptions->count();
            $approvedCount = $approvedInscriptions->count();
            $rejectedCount = $rejectedInscriptions->count();

            // Compter les vrais membres (users) déjà créés dans la classe du conducteur
            // Ces utilisateurs ont une famille et une classe assignée
            $membersCount = User::whereIn('classe_id', $classIds)
                ->whereNotNull('family_id')
                ->where('role', '!=', 'admin')
                ->count();

            // Récupérer les familles avec leurs membres
            $families = [];
            try {
                $families = \App\Models\Family::whereIn('classe_id', $classIds)
                    ->with(['responsable', 'users'])
                    ->get()
                    ->map(function ($family) {
                        // Vérifier que le responsable existe
                        if (!$family->responsable) {
                            return null; // Ignorer les familles sans responsable
                        }

                        return [
                            'id' => $family->id,
                            'nom' => $family->nom,
                            'responsable_id' => $family->responsable_id,
                            'responsable' => [
                                'id' => $family->responsable->id,
                                'nom' => $family->responsable->nom ?? '',
                                'prenom' => $family->responsable->prenom ?? '',
                                'email' => $family->responsable->email ?? '',
                                'phone' => $family->responsable->telephone ?? '',
                            ],
                            'members' => $family->users->map(function ($user) use ($family) {
                                return [
                                    'id' => $user->id,
                                    'nom' => $user->nom ?? '',
                                    'prenom' => $user->prenom ?? '',
                                    'email' => $user->email ?? '',
                                    'phone' => $user->telephone ?? '',
                                    'role' => $user->role ?? 'membre',
                                    'status' => $this->normalizeUserStatus($user->statut ?? $user->status ?? null),
                                    'genre' => $user->genre ?? '',
                                    'date_naissance' => $user->date_naissance ?? '',
                                    'relation' => $user->relation ?? null,
                                    'profession' => $user->profession ?? null,
                                    'fonction_id' => $user->fonction_id ?? null,
                                    'family_id' => $user->family_id,
                                    'is_family_responsible' => $family->responsable_id == $user->id,
                                    'created_at' => $user->created_at,
                                    'updated_at' => $user->updated_at,
                                ];
                            })->toArray(),
                            'member_count' => $family->users->count(),
                        ];
                    })
                    ->filter(function ($item) {
                        return $item !== null;
                    })
                    ->values()
                    ->toArray();
            } catch (\Exception $e) {
                Log::error('Erreur chargement familles: ' . $e->getMessage());
                $families = [];
            }

            return Inertia::render('Conducteur/Inscriptions', [
                'inscriptions' => $allInscriptions,
                'members' => $members,
                'families' => $families,
                'className' => $className,
                'pendingCount' => $pendingCount,
                'approvedCount' => $approvedCount,
                'rejectedCount' => $rejectedCount,
                'membersCount' => $membersCount,
                'userFamilyId' => $user->family_id,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur InscriptionsController@index: ' . $e->getMessage());
            abort(500, 'Erreur lors du chargement des inscriptions: ' . $e->getMessage());
        }
    }

    /**
     * APPROUVER une inscription (conducteur)
     */
    public function approveInscription(Request $request, $inscriptionId)
    {
        $user = Auth::user();
        if ($user->role !== 'conducteur') {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        try {
            $inscription = Inscription::findOrFail($inscriptionId);

            if (!in_array($inscription->status, ['en_attente', 'pending'])) {
                $approvedBy = $inscription->admin_id
                    ? 'admin'
                    : ($inscription->conducteur_id ? 'conducteur' : 'autre');

                return response()->json([
                    'success' => false,
                    'type' => 'AlreadyProcessed',
                    'message' => 'Cette inscription a déjà été approuvée par ' . $approvedBy . '. Le premier approbateur est prioritaire.',
                ], 409);
            }

            // Vérifier que c'est de sa classe
            $conductorClasses = $user->getManagedClasses()->pluck('id')->toArray();
            $inscriptionClasseId = $inscription->data['famille']['classe_id']
                ?? $inscription->data['classe_id']
                ?? $inscription->data['responsable']['classe_id']
                ?? $inscription->classe_id
                ?? null;
            if (!in_array($inscriptionClasseId, $conductorClasses)) {
                return response()->json(['error' => 'Inscription ne appartient pas à votre classe'], 403);
            }

            // Utiliser InscriptionApprovalService pour créer les comptes et membres
            DB::beginTransaction();
            try {
                if (in_array($inscription->type, ['famille', 'conducteur'], true)) {
                    // Pour famille/conducteur: créer responsable + famille + membres immédiatement
                    $approvalService = app(InscriptionApprovalService::class);
                    $approvalService->approve($inscription, $user, 'conducteur');

                    Log::info('Inscription approuvée par conducteur via service', [
                        'inscription_id' => $inscription->id,
                        'type' => $inscription->type,
                        'conducteur_id' => $user->id,
                    ]);
                } else {
                    // Pour une inscription individuelle (conducteur), créer le compte utilisateur
                    $password = Str::random(10);

                    // Obtenir la classe_id du JSON
                    $classeId = $inscription->data['famille']['classe_id']
                        ?? $inscription->data['classe_id']
                        ?? $inscription->data['responsable']['classe_id']
                        ?? $inscription->classe_id
                        ?? null;

                    // Générer un identifiant unique
                    $identifier = 'COND' . str_pad(User::where('role', 'conducteur')->count() + 1, 4, '0', STR_PAD_LEFT);

                    if (empty($inscription->email)) {
                        throw new \Exception('Email manquant pour cette inscription. Veuillez compléter l\'email avant approbation.');
                    }

                    $newUser = User::create([
                        'nom' => $inscription->nom,
                        'prenom' => $inscription->prenom,
                        'email' => $inscription->email,
                        'identifier' => $identifier,
                        'password' => Hash::make($password),
                        'role' => $inscription->role ?? 'conducteur',
                        'telephone' => $inscription->telephone,
                        'telephone2' => $inscription->telephone2,
                        'genre' => $inscription->genre,
                        'date_naissance' => $inscription->date_naissance,
                        'adresse' => $inscription->adresse,
                        'ville_id' => $inscription->ville_id,
                        'classe_id' => $classeId,
                        'fonction' => $inscription->fonction_professionnelle,
                        'must_change_password' => true,
                    ]);

                    // Marquer l'inscription comme approuvée
                    $inscription->update([
                        'status' => 'approuve',
                        'conducteur_id' => $user->id,
                        'conducteur_approved_at' => now(),
                    ]);

                    // Envoyer l'email avec les identifiants
                    try {
                        Mail::to($newUser->email)->send(new SendCredentials($newUser, $identifier, $password));
                        $newUser->credentials_sent_at = now();
                        $newUser->save();
                        Log::info('Email envoyé avec succès', [
                            'user_id' => $newUser->id,
                            'email' => $newUser->email,
                            'identifier' => $identifier,
                        ]);
                    } catch (\Exception $mailError) {
                        Log::warning('Email sending failed during approval', [
                            'user_id' => $newUser->id,
                            'email' => $newUser->email,
                            'error' => $mailError->getMessage(),
                        ]);
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Inscription approuvée avec succès',
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                DB::rollBack();
                // Check for unique constraint violation
                if ($e->getCode() == 23000) {
                    return response()->json([
                        'success' => false,
                        'type' => 'UniqueConstraintViolation',
                        'message' => 'Cette inscription a déjà été approuvée et les utilisateurs ont été créés.',
                        'error' => $e->getMessage(),
                    ], 409);
                }
                throw $e;
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Erreur lors de l\'approbation: ' . $e->getMessage());
                if (str_contains($e->getMessage(), 'déjà traitée')) {
                    return response()->json([
                        'success' => false,
                        'type' => 'AlreadyProcessed',
                        'message' => 'Cette inscription a déjà été traitée. Le premier approbateur est prioritaire.',
                    ], 409);
                }
                return response()->json([
                    'success' => false,
                    'type' => 'DatabaseError',
                    'message' => 'Une erreur est survenue lors de l\'approbation. Les entités ont peut-être déjà été créées.',
                    'error' => $e->getMessage(),
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Erreur approveInscription: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erreur lors de l\'approbation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * REJETER une inscription (conducteur)
     */
    public function rejectInscription(Request $request, $inscriptionId)
    {
        $user = Auth::user();
        if ($user->role !== 'conducteur') {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        try {
            $inscription = Inscription::findOrFail($inscriptionId);

            // Vérifier que c'est de sa classe
            $conductorClasses = $user->getManagedClasses()->pluck('id')->toArray();
            $inscriptionClasseId = $inscription->data['famille']['classe_id']
                ?? $inscription->data['classe_id']
                ?? $inscription->data['responsable']['classe_id']
                ?? $inscription->classe_id
                ?? null;
            if (!in_array($inscriptionClasseId, $conductorClasses)) {
                return response()->json(['error' => 'Inscription ne appartient pas à votre classe'], 403);
            }

            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $inscription->update([
                'status' => 'rejete',
                'raison_rejet' => $validated['reason'],
                'conducteur_id' => $user->id,
            ]);

            // 📧 ENVOYER L'EMAIL DE REFUS AU RESPONSABLE
            try {
                // Créer un objet utilisateur temporaire pour l'email
                $userResponsable = new User();
                $userResponsable->email = $inscription->responsable_email ?? $inscription->email;
                $userResponsable->nom = $inscription->responsable_nom ?? $inscription->nom;
                $userResponsable->prenom = $inscription->responsable_prenom ?? $inscription->prenom;

                Mail::send(new InscriptionRejected($userResponsable, $validated['reason'], $inscription->type ?? 'famille'));

                Log::info('Email de refus envoyé par conducteur', [
                    'inscription_id' => $inscription->id,
                    'email' => $userResponsable->email,
                    'conducteur_id' => $user->id,
                ]);
            } catch (\Exception $e) {
                Log::error('Erreur lors de l\'envoi de l\'email de refus (conducteur)', [
                    'inscription_id' => $inscription->id,
                    'email' => $userResponsable->email ?? 'N/A',
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('Inscription rejetée par conducteur', [
                'inscription_id' => $inscription->id,
                'conducteur_id' => $user->id,
                'reason' => $validated['reason'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Inscription rejetée avec succès. Un email de notification a été envoyé au responsable.',
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur rejectInscription: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erreur lors du rejet: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ajouter un nouveau membre à une classe
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            abort(403, 'Accès non autorisé');
        }

        // Log toutes les données reçues pour debug
        \Log::info('Conducteur/Inscription - Données reçues', [
            'all' => $request->all(),
            'input' => $request->input(),
            'files' => $request->allFiles(),
        ]);

        try {
            $validated = $request->validate([
                'family_id' => 'nullable|exists:families,id',
                'family_name' => 'nullable|string|max:255',
                'family_address' => 'nullable|string|max:1000',

                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'telephone' => 'required|string|max:20',
                'date_naissance' => 'required|date',
                'genre' => 'required|string|max:10',
                'classe_id' => 'required|integer',
                'profession' => 'required|string|max:255',
                'statut_marital' => 'required|string|max:255',

                // Champs religieux optionnels mais si cochés, date/lieu requis
                'baptise' => 'nullable|boolean',
                'date_bapteme' => 'required_if:baptise,1|nullable|date',
                'lieu_bapteme' => 'required_if:baptise,1|nullable|string|max:255',
                'premiere_communion' => 'nullable|boolean',
                'date_premiere_communion' => 'required_if:premiere_communion,1|nullable|date',
                'lieu_premiere_communion' => 'required_if:premiere_communion,1|nullable|string|max:255',
                'marie_religieusement' => 'nullable|boolean',
                'date_mariage_religieux' => 'required_if:marie_religieusement,1|nullable|date',
                'lieu_mariage_religieux' => 'required_if:marie_religieusement,1|nullable|string|max:255',

                // Autres champs
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'role' => 'nullable|string|max:50',
                'relation' => 'nullable|string|max:255',
                'statut' => 'nullable|in:actif,inactif,decede',
                'status' => 'nullable|in:actif,inactif,decede',
                'date_mariage' => 'nullable|date',
                'lieu_mariage' => 'nullable|string|max:255',
                'date_divorce' => 'nullable|date',
                'date_deces' => 'nullable|date',
                'contact_urgence' => 'nullable|string|max:255',
                'contact_urgence_tel' => 'nullable|string|max:255',
            ]);

            $conductorClasses = $user->getManagedClasses();
            $classeId = $conductorClasses->first()->id ?? null;

            if (!$classeId) {
                return back()->with('error', 'Aucune classe assignée au conducteur');
            }

            $familyId = $validated['family_id'] ?? null;
            $familyName = $validated['family_name'] ?? null;

            if (!$familyId) {
                if (!$familyName) {
                    return back()->with('error', 'Veuillez renseigner le nom de la famille');
                }

                $family = Family::create([
                    'nom' => $familyName,
                    'classe_id' => $classeId,
                    'adresse' => $validated['family_address'] ?? null,
                ]);

                $familyId = $family->id;
            }

            $nom = $validated['nom'] ?? $validated['last_name'] ?? null;
            $prenom = $validated['prenom'] ?? $validated['first_name'] ?? null;
            $telephone = $validated['telephone'] ?? $validated['phone'] ?? null;
            $statut = $validated['statut'] ?? $validated['status'] ?? 'actif';

            if (!$nom || !$prenom) {
                return back()->with('error', 'Nom et prénom sont requis');
            }

            // Créer un nouvel utilisateur
            $member = User::create([
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => $validated['email'] ?? $prenom . '.' . $nom . '@' . time() . '.local',
                'telephone' => $telephone,
                'family_id' => $familyId,
                'classe_id' => $classeId,
                'date_naissance' => $validated['date_naissance'] ?? null,
                'genre' => $validated['genre'] ?? null,
                'role' => $validated['role'] ?? 'membre',
                'statut' => $statut,
                'statut_marital' => $validated['statut_marital'] ?? null,
                'date_mariage' => $validated['date_mariage'] ?? null,
                'lieu_mariage' => $validated['lieu_mariage'] ?? null,
                'date_divorce' => $validated['date_divorce'] ?? null,
                'date_deces' => $validated['date_deces'] ?? null,
                'password' => Hash::make(Str::random(16)),
            ]);

            // Créer les sacrements pour cet utilisateur
            UserSacrement::create([
                'user_id' => $member->id,
                'baptise' => $request->boolean('baptise'),
                'bapteme_date' => $validated['date_bapteme'] ?? null,
                'bapteme_lieu' => $validated['lieu_bapteme'] ?? null,
                'premiere_communion' => $request->boolean('premiere_communion'),
                'premiere_communion_date' => $validated['date_premiere_communion'] ?? null,
                'premiere_communion_lieu' => $validated['lieu_premiere_communion'] ?? null,
            ]);

            return back()->with('success', 'Membre ajouté avec succès');
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Log les erreurs de validation
            \Log::error('Conducteur/Inscription - Erreur de validation', [
                'errors' => $e->errors(),
                'message' => $e->getMessage(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Conducteur/Inscription - Exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->with('error', 'Erreur lors de l\'ajout du membre');
        }
    }

    /**
     * Mettre à jour un membre
     */
    public function update(Request $request, $memberId)
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            abort(403, 'Accès non autorisé');
        }

        $member = User::findOrFail($memberId);

        $validated = $request->validate([
            'nom' => 'nullable|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',

            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'date_naissance' => 'nullable|date',
            'genre' => 'nullable|string|max:10',
            'role' => 'nullable|string|max:50',
            'relation' => 'nullable|string|max:255',
            'profession' => 'nullable|string|max:255',
            'fonction_id' => 'nullable|integer',
            'statut' => 'nullable|in:actif,inactif,decede',
            'status' => 'nullable|in:actif,inactif,decede',
            'statut_marital' => 'nullable|string|max:255',
            'date_mariage' => 'nullable|date',
            'lieu_mariage' => 'nullable|string|max:255',
            'date_divorce' => 'nullable|date',
            'date_deces' => 'nullable|date',
            'baptise' => 'nullable|boolean',
            'date_bapteme' => 'nullable|date',
            'lieu_bapteme' => 'nullable|string|max:255',
            'premiere_communion' => 'nullable|boolean',
            'date_premiere_communion' => 'nullable|date',
            'lieu_premiere_communion' => 'nullable|string|max:255',
            'marie_religieusement' => 'nullable|boolean',
            'date_mariage_religieux' => 'nullable|date',
            'lieu_mariage_religieux' => 'nullable|string|max:255',
            'contact_urgence' => 'nullable|string|max:255',
            'contact_urgence_tel' => 'nullable|string|max:255',
        ]);

        try {
            $nom = $validated['nom'] ?? $validated['last_name'] ?? $member->nom;
            $prenom = $validated['prenom'] ?? $validated['first_name'] ?? $member->prenom;
            $telephone = $validated['telephone'] ?? $validated['phone'] ?? $member->telephone;
            $statut = $validated['statut'] ?? $validated['status'] ?? $member->statut;

            $member->update([
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => $validated['email'] ?? $member->email,
                'telephone' => $telephone,
                'date_naissance' => $validated['date_naissance'] ?? $member->date_naissance,
                'genre' => $validated['genre'] ?? $member->genre,
                'role' => $validated['role'] ?? $member->role,
                'relation' => $validated['relation'] ?? $member->relation,
                'profession' => $validated['profession'] ?? $member->profession,
                'fonction_id' => $validated['fonction_id'] ?? $member->fonction_id,
                'statut' => $statut,
                'statut_marital' => $validated['statut_marital'] ?? $member->statut_marital,
                'date_mariage' => $validated['date_mariage'] ?? $member->date_mariage,
                'lieu_mariage' => $validated['lieu_mariage'] ?? $member->lieu_mariage,
                'date_divorce' => $validated['date_divorce'] ?? $member->date_divorce,
                'date_deces' => $validated['date_deces'] ?? $member->date_deces,
                'baptise' => $request->has('baptise') ? $request->boolean('baptise') : $member->baptise,
                'date_bapteme' => $validated['date_bapteme'] ?? $member->date_bapteme,
                'lieu_bapteme' => $validated['lieu_bapteme'] ?? $member->lieu_bapteme,
                'premiere_communion' => $request->has('premiere_communion') ? $request->boolean('premiere_communion') : $member->premiere_communion,
                'date_premiere_communion' => $validated['date_premiere_communion'] ?? $member->date_premiere_communion,
                'lieu_premiere_communion' => $validated['lieu_premiere_communion'] ?? $member->lieu_premiere_communion,
                'marie_religieusement' => $request->has('marie_religieusement') ? $request->boolean('marie_religieusement') : $member->marie_religieusement,
                'date_mariage_religieux' => $validated['date_mariage_religieux'] ?? $member->date_mariage_religieux,
                'lieu_mariage_religieux' => $validated['lieu_mariage_religieux'] ?? $member->lieu_mariage_religieux,
                'contact_urgence' => $validated['contact_urgence'] ?? $member->contact_urgence,
                'contact_urgence_tel' => $validated['contact_urgence_tel'] ?? $member->contact_urgence_tel,
            ]);
            return response()->json(['success' => true, 'message' => 'Membre mis à jour avec succès']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Supprimer un membre
     */
    public function destroy($memberId)
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            abort(403, 'Accès non autorisé');
        }

        $member = User::findOrFail($memberId);

        try {
            $member->delete();
            return back()->with('success', 'Membre supprimé avec succès');
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la suppression');
        }
    }

    /**
     * API: Récupérer les membres en JSON
     */
    public function getMembersApi()
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        try {
            $conductorClasses = $user->getManagedClasses();

            if ($conductorClasses->isEmpty()) {
                return response()->json([
                    'members' => [],
                    'className' => 'Aucune classe',
                    'pendingCount' => 0,
                ]);
            }

            $classes = $conductorClasses->pluck('id')->toArray();

            // Récupérer les membres (users) des classes du conducteur
            $membersRaw = User::whereIn('classe_id', $classes)
                ->where('role', '!=', 'admin')
                ->get();
            $members = $membersRaw->map(function ($member) {
                return [
                    'id' => $member->id,
                    'first_name' => $member->prenom,
                    'last_name' => $member->nom,
                    'email' => $member->email,
                    'phone' => $member->telephone,
                    'role' => $member->role ?? 'autre',
                    'status' => $this->normalizeUserStatus($member->statut ?? $member->status ?? null),
                ];
            });

            return response()->json([
                'members' => $members,
                'className' => $conductorClasses->first()->nom ?? 'Classes multiples',
                'pendingCount' => $membersRaw->where('statut', 'inactif')->count(),
                'approvedCount' => $membersRaw->where('statut', 'actif')->count(),
                'rejectedCount' => $membersRaw->where('statut', 'rejeté')->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getMembersApi: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * API: Valider un membre
     */
    public function validateMember(Request $request, $memberId)
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        $member = User::findOrFail($memberId);

        try {
            $this->setUserStatus($member, true);
            if ($request->header('X-Inertia')) {
                return back()->with('success', 'Membre validé');
            }
            return response()->json(['success' => true, 'message' => 'Membre validé']);
        } catch (\Exception $e) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', $e->getMessage());
            }
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * API: Rejeter un membre
     */
    public function rejectMember(Request $request, $memberId)
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        $member = User::findOrFail($memberId);
        $reason = $request->input('reason', 'Aucune raison fournie');

        try {
            $this->setUserStatus($member, false);
            if ($request->header('X-Inertia')) {
                return back()->with('success', 'Membre rejeté');
            }
            return response()->json(['success' => true, 'message' => 'Membre rejeté', 'reason' => $reason]);
        } catch (\Exception $e) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', $e->getMessage());
            }
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Modifier une inscription (conducteur)
     */
    public function updateInscription(Request $request, $inscriptionId)
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        $inscription = Inscription::findOrFail($inscriptionId);

        // Vérifier que le conducteur gère la classe (obtenir depuis JSON)
        $classeId = $inscription->data['famille']['classe_id']
            ?? $inscription->data['classe_id']
            ?? $inscription->data['responsable']['classe_id']
            ?? $inscription->classe_id
            ?? null;
        $conductorClasses = $user->getManagedClasses()->pluck('id')->toArray();
        if (!in_array($classeId, $conductorClasses)) {
            return response()->json(['error' => 'Vous ne gérez pas cette classe'], 403);
        }

        try {
            // Valider les données
            $validated = $request->validate([
                'nom' => 'required|string|min:2',
                'prenom' => 'required|string|min:2',
                'email' => 'required|email',
                'telephone' => 'nullable|string',
                'telephone2' => 'nullable|string',
                'genre' => 'nullable|in:M,F',
                'date_naissance' => 'nullable|date',
                'adresse' => 'nullable|string',
                'fonction_professionnelle' => 'nullable|string',
                'statut_marital' => 'nullable|string',
            ]);

            // Mettre à jour l'inscription
            $inscription->update([
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'],
                'telephone' => $validated['telephone'] ?? $inscription->telephone,
                'telephone2' => $validated['telephone2'] ?? $inscription->telephone2,
                'genre' => $validated['genre'] ?? $inscription->genre,
                'date_naissance' => $validated['date_naissance'] ?? $inscription->date_naissance,
                'adresse' => $validated['adresse'] ?? $inscription->adresse,
                'fonction_professionnelle' => $validated['fonction_professionnelle'] ?? $inscription->fonction_professionnelle,
                'statut_marital' => $validated['statut_marital'] ?? $inscription->statut_marital,
            ]);

            Log::info('Inscription modifiée par conducteur', [
                'inscription_id' => $inscription->id,
                'conducteur_id' => $user->id,
                'email' => $inscription->email,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Inscription modifiée avec succès',
                'inscription' => $inscription,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la modification inscription', [
                'error' => $e->getMessage(),
                'inscription_id' => $inscriptionId,
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Créer une famille complète avec responsable et membres - Conducteur
     * Création directe dans users/families/user_sacrements sans approbation
     */
    public function storeFamily(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            abort(403, 'Accès non autorisé');
        }

        DB::beginTransaction();

        try {
            // Valider les données de la famille et ses membres
            $validated = $request->validate([
                'famille.nom' => 'required|string|max:255',
                'famille.adresse' => 'nullable|string|max:1000',
                'famille.quartier' => 'nullable|string|max:255',
                'famille.classe_id' => 'required|exists:classes,id',
                'famille.ville' => 'required|exists:villes,id',
                'famille.telephone' => 'required|regex:/^[0-9]{10}$/',

                'responsable.nom' => 'required|string|max:255',
                'responsable.prenom' => 'required|string|max:255',
                'responsable.email' => 'required|email|unique:users,email',
                'responsable.tel' => 'required|regex:/^[0-9]{10}$/',
                'responsable.dateNaissance' => 'required|date|before:today',
                'responsable.genre' => 'required|in:M,F',
                'responsable.profession' => 'required|string|max:255',
                'responsable.baptise' => 'nullable|boolean',
                'responsable.dateBapteme' => 'nullable|date|before:today',
                'responsable.lieuBapteme' => 'nullable|string|max:255',
                'responsable.premiereCommunion' => 'nullable|boolean',
                'responsable.datePremiereCommunion' => 'nullable|date|before:today',
                'responsable.lieuPremiereCommunion' => 'nullable|string|max:255',
                'responsable.statutMarital' => 'required|in:celibataire,marie,divorce,veuf,dot',
                'responsable.dateMariage' => 'nullable|date|before:today',
                'responsable.lieuMariage' => 'nullable|string|max:255',
                'responsable.dateDivorce' => 'nullable|date|before:today',
                'responsable.lieuDivorce' => 'nullable|string|max:255',
                'responsable.dateDeces' => 'nullable|date|before:today',
                'responsable.lieuDeces' => 'nullable|string|max:255',
                'responsable.dote' => 'nullable|date|before:today',
                'responsable.lieuDote' => 'nullable|string|max:255',
                'responsable.marieReligieusement' => 'nullable|boolean',
                'responsable.dateMariageReligieux' => 'nullable|date|before:today',
                'responsable.lieuMariageReligieux' => 'nullable|string|max:255',
                'responsable.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',

                'membres.*.nom' => 'required|string|max:255',
                'membres.*.prenom' => 'required|string|max:255',
                'membres.*.email' => 'required|email|unique:users,email',
                'membres.*.telephone' => 'nullable|regex:/^[0-9]{10}$/',
                'membres.*.dateNaissance' => 'required|date|before:today',
                'membres.*.genre' => 'required|in:M,F',
                'membres.*.profession' => 'required|string|max:255',
                'membres.*.baptise' => 'nullable|boolean',
                'membres.*.dateBapteme' => 'nullable|date|before:today',
                'membres.*.lieuBapteme' => 'nullable|string|max:255',
                'membres.*.premiereCommunion' => 'nullable|boolean',
                'membres.*.datePremiereCommunion' => 'nullable|date|before:today',
                'membres.*.lieuPremiereCommunion' => 'nullable|string|max:255',
                'membres.*.statutMarital' => 'required|in:celibataire,marie,divorce,veuf,dot',
                'membres.*.dateMariage' => 'nullable|date|before:today',
                'membres.*.lieuMariage' => 'nullable|string|max:255',
                'membres.*.dateDivorce' => 'nullable|date|before:today',
                'membres.*.lieuDivorce' => 'nullable|string|max:255',
                'membres.*.dateDeces' => 'nullable|date|before:today',
                'membres.*.lieuDeces' => 'nullable|string|max:255',
                'membres.*.dote' => 'nullable|date|before:today',
                'membres.*.lieuDote' => 'nullable|string|max:255',
                'membres.*.marieReligieusement' => 'nullable|boolean',
                'membres.*.dateMariageReligieux' => 'nullable|date|before:today',
                'membres.*.lieuMariageReligieux' => 'nullable|string|max:255',
                'membres.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            ]);

            // Récupérer la classe gérée par le conducteur
            $conductorClasses = $user->getManagedClasses();
            if ($conductorClasses->isEmpty()) {
                return response()->json([
                    'error' => 'Aucune classe assignée au conducteur.',
                ], 403);
            }

            // 1. Créer la famille
            $family = Family::create([
                'nom' => $validated['famille']['nom'],
                'adresse' => $validated['famille']['adresse'],
                'quartier' => $validated['famille']['quartier'],
                'classe_id' => $validated['famille']['classe_id'],
                'ville_id' => $validated['famille']['ville'],
                'telephone' => $validated['famille']['telephone'],
            ]);

            // 2. Créer l'utilisateur responsable
            $tempPassword = $this->generateTempPassword();

            $photoPath = null;
            if ($request->hasFile('responsable.photo')) {
                $photoPath = $request->file('responsable.photo')->store('photos/users', 'public');
            }

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
            foreach ($validated['membres'] as $index => $membreData) {
                $membreTempPassword = $this->generateTempPassword();
                $membreIdentifier = User::generateIdentifier(strtoupper($membreData['nom']), ucfirst($membreData['prenom']), $membreData['dateNaissance']);

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
                    'family_id' => $family->id,
                    'role' => 'membre_famille',
                    'photo_path' => $membrePhotoPath,
                    'classe_id' => $validated['famille']['classe_id'],
                    'ville_id' => $validated['famille']['ville'],
                ]);

                // Créer les sacrements du membre
                $this->createUserSacrements($membre, $membreData);
            }

            // 5. Créer une inscription approuvée directement (pas besoin d'approbation)
            $inscription = Inscription::create([
                'type' => 'famille',
                'status' => 'approuve', // Directement approuvée par conducteur
                'conducteur_approved_at' => now(),
                'conducteur_id' => $user->id,
                'data' => [
                    'famille' => [
                        'nom' => $validated['famille']['nom'],
                        'adresse' => $validated['famille']['adresse'],
                        'quartier' => $validated['famille']['quartier'],
                        'ville' => $validated['famille']['ville'],
                        'telephone' => $validated['famille']['telephone'],
                        'telephone2' => $validated['famille']['telephone2'],
                        'classe_id' => $validated['famille']['classe_id'],
                    ],
                    'responsable' => [],
                    'membres' => [],
                ],
                // Champs du responsable
                'responsable_nom' => $validated['responsable']['nom'],
                'responsable_prenom' => $validated['responsable']['prenom'],
                'responsable_email' => $validated['responsable']['email'],
                'responsable_tel' => $validated['responsable']['tel'],
                'responsable_genre' => $validated['responsable']['genre'],
                'responsable_date_naissance' => $validated['responsable']['dateNaissance'],
                'responsable_profession' => $validated['responsable']['profession'],
                'responsable_statut_marital' => $validated['responsable']['statutMarital'],
            ]);

            DB::commit();

            Log::info('Famille créée directement par Conducteur', [
                'family_id' => $family->id,
                'responsable_id' => $responsable->id,
                'conducteur_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Famille créée avec succès ! Les comptes peuvent se connecter maintenant.',
                'family_id' => $family->id,
                'responsable_id' => $responsable->id,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création famille conducteur', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Une erreur est survenue lors de la création de la famille.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Créer les sacrements d'un utilisateur
     */
    private function createUserSacrements(User $user, array $data)
    {
        try {
            $sacrementsData = [
                'user_id' => $user->id,
                // Baptême
                'baptise' => $this->stringToBoolean($data['baptise'] ?? false),
                'bapteme_date' => $data['dateBapteme'] ?? null,
                'bapteme_lieu' => $data['lieuBapteme'] ?? null,
                // Première communion
                'premiere_communion' => $this->stringToBoolean($data['premiereCommunion'] ?? false),
                'premiere_communion_date' => $data['datePremiereCommunion'] ?? null,
                'premiere_communion_lieu' => $data['lieuPremiereCommunion'] ?? null,
                // Mariage religieux
                'marie_religieusement' => $this->stringToBoolean($data['marieReligieusement'] ?? false),
                'mariage_religieux_date' => $data['dateMariageReligieux'] ?? null,
                'mariage_religieux_lieu' => $data['lieuMariageReligieux'] ?? null,
                // Mariage civil
                'est_marie' => $this->stringToBoolean($data['statutMarital'] === 'marie'),
                'mariage_civil_date' => ($data['statutMarital'] === 'marie') ? ($data['dateMariage'] ?? null) : null,
                'mariage_civil_lieu' => ($data['statutMarital'] === 'marie') ? ($data['lieuMariage'] ?? null) : null,
                // Divorce
                'est_divorce' => $this->stringToBoolean($data['statutMarital'] === 'divorce'),
                'divorce_date' => ($data['statutMarital'] === 'divorce') ? ($data['dateDivorce'] ?? null) : null,
                'divorce_lieu' => ($data['statutMarital'] === 'divorce') ? ($data['lieuDivorce'] ?? null) : null,
                // Veuvage
                'est_veuf' => $this->stringToBoolean($data['statutMarital'] === 'veuf'),
                'deces_conjoint_date' => ($data['statutMarital'] === 'veuf') ? ($data['dateDeces'] ?? null) : null,
                'deces_conjoint_lieu' => ($data['statutMarital'] === 'veuf') ? ($data['lieuDeces'] ?? null) : null,
                // Dot
                'dot_effectue' => $this->stringToBoolean($data['statutMarital'] === 'dot'),
                'dot_date' => ($data['statutMarital'] === 'dot') ? ($data['dote'] ?? null) : null,
                'dot_lieu' => ($data['statutMarital'] === 'dot') ? ($data['lieuDote'] ?? null) : null,
            ];

            \App\Models\UserSacrement::create($sacrementsData);
        } catch (\Exception $e) {
            Log::warning('Erreur création sacrements pour user ' . $user->id, [
                'error' => $e->getMessage(),
                'user_data' => $data
            ]);
        }
    }

    /**
     * Générer un mot de passe temporaire
     */
    private function generateTempPassword(): string
    {
        return Str::random(8);
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
}
