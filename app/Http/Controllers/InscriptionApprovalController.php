<?php

namespace App\Http\Controllers;

use App\Models\Inscription;
use App\Models\User;
use App\Models\Family;
use App\Models\Classe;
use App\Models\UserSacrement;
use App\Mail\SendCredentials;
use App\Mail\InscriptionRejected;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InscriptionApprovalController extends Controller
{
    /**
     * Approuver une inscription et créer l'utilisateur correspondant
     */
    public function approveAsAdmin(Request $request, Inscription $inscription)
    {
        try {
            $validated = $request->validate([
                'admin_notes' => 'nullable|string|max:500',
            ]);

            if ($inscription->status === 'approuve') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette inscription a déjà été approuvée',
                ], 400);
            }

            // Si c'est une inscription de famille, traiter TOUTE la famille ensemble
            if ($inscription->type === 'famille') {
                return $this->approveFamilyAsAdmin($inscription, $validated);
            }

            // Pour les conducteurs/pasteurs, approuver directement et créer les comptes
            // (pas d'attente d'approbation conducteur puisqu'ils n'existent pas encore)
            if ($inscription->type === 'conducteur' || $inscription->type === 'pasteur') {
                $user = DB::transaction(function () use ($inscription) {
                    if ($inscription->type === 'conducteur') {
                        // Créer la famille du conducteur et tous ses membres
                        $this->createConductorFamilyFromInscription($inscription);
                    } elseif ($inscription->type === 'pasteur') {
                        // Créer le pasteur
                        $role = 'pasteur';

                        // Créer l'utilisateur pasteur (sans famille pour l'instant)
                        $nom = $inscription->nom
                            ?? $inscription->responsable_nom
                            ?? ($inscription->data['responsable']['nom'] ?? 'NOM');
                        $prenom = $inscription->prenom
                            ?? $inscription->responsable_prenom
                            ?? ($inscription->data['responsable']['prenom'] ?? 'PRENOM');
                        $dateNaissance = $inscription->date_naissance
                            ?? ($inscription->data['responsable']['dateNaissance'] ?? null);
                        $identifier = User::generateIdentifier(
                            (string) $nom,
                            (string) $prenom,
                            $dateNaissance ? (is_string($dateNaissance) ? $dateNaissance : $dateNaissance->format('Y-m-d')) : null
                        );

                        $tempPassword = '11111';

                        $user = User::create([
                            'nom' => $nom,
                            'prenom' => $prenom,
                            'email' => $inscription->email ?? ($inscription->responsable_email ?? ($inscription->data['responsable']['email'] ?? null)),
                            'telephone' => $inscription->telephone ?? ($inscription->responsable_tel ?? ($inscription->data['responsable']['tel'] ?? null)),
                            'telephone2' => $inscription->telephone2 ?? ($inscription->responsable_telephone2 ?? ($inscription->data['responsable']['telephone2'] ?? null)),
                            'date_naissance' => $inscription->date_naissance ?? ($inscription->data['responsable']['dateNaissance'] ?? null),
                            'genre' => $inscription->genre ?? ($inscription->responsable_genre ?? ($inscription->data['responsable']['genre'] ?? null)),
                            'adresse' => $inscription->data['person']['adresse'] ?? null,
                            'fonction_professionnelle' => $inscription->data['person']['fonction_professionnelle'] ?? null,
                            'fonction_id' => $inscription->data['person']['fonction'] ?? null,
                            'classe_id' => $inscription->classe_id,
                            'photo_path' => $inscription->photo_path,
                            'ville_id' => $inscription->data['person']['ville_id'] ?? null,
                            'identifier' => $identifier,
                            'password' => bcrypt($tempPassword),
                            'role' => $role,
                        ]);

                        // Créer les sacrements du pasteur
                        $this->createUserSacrements($user, null, $inscription);

                        // Mettre à jour l'inscription
                        $inscription->update([
                            'status' => 'approuve',
                            'user_id' => $user->id,
                        ]);

                        // Récupérer la classe pour l'email
                        $classe = Classe::find($inscription->classe_id);

                        // 📧 Envoyer les identifiants et mot de passe par email
                        try {
                            Mail::to($user->email)->send(new SendCredentials($user, $identifier, $tempPassword, $classe));
                            $user->credentials_sent_at = now();
                            $user->save();
                        } catch (\Exception $e) {
                            Log::error('Erreur lors de l\'envoi des identifiants du pasteur', [
                                'user_id' => $user->id,
                                'email' => $user->email,
                                'error' => $e->getMessage(),
                            ]);
                        }

                        Log::info('Compte utilisateur créé pour pasteur', [
                            'inscription_id' => $inscription->id,
                            'user_id' => $user->id,
                            'role' => $role,
                            'classe_id' => $inscription->classe_id,
                        ]);
                    }
                    return null;
                });

                Log::info('Inscription de ' . $inscription->type . ' approuvée par l\'admin avec création des comptes', [
                    'inscription_id' => $inscription->id,
                    'admin_id' => Auth::id(),
                ]);

                return redirect()->route('admin.inscriptions')
                    ->with('success', '🎉 Excellente nouvelle ! L\'inscription a été approuvée avec succès et les comptes utilisateur ont été créés. Bienvenue dans notre communauté spirituelle !');
            }

            // Sinon, traiter l'inscription individuelle/famille normalement
            $user = DB::transaction(function () use ($inscription, $validated) {
                // Déterminer le type d'utilisateur et créer/trouver la famille
                $family = null;
                $role = 'membre'; // Par défaut

                if ($inscription->type === 'individuel') {
                    // Cas: individu
                    if ($inscription->family_id) {
                        // L'individu s'inscrit pour une famille existante
                        $family = Family::find($inscription->family_id);
                        $role = 'membre'; // Devient membre de la famille existante
                    } else {
                        // L'individu crée sa propre famille
                        $family = Family::create([
                            'nom' => $inscription->nom . ' ' . $inscription->prenom,
                            'classe_id' => $inscription->classe_id,
                            'adresse' => $inscription->data['famille']['adresse'] ?? null,
                            'quartier' => $inscription->data['famille']['quartier'] ?? null,
                            'ville_id' => $inscription->data['famille']['ville_id'] ?? null,
                            'telephone' => $inscription->telephone,
                            'telephone2' => $inscription->telephone2,
                            'email' => $inscription->email,
                        ]);
                        $role = 'responsable'; // Devient responsable de sa propre famille
                    }
                } elseif ($inscription->type === 'membre_famille') {
                    // Cas: membre d'une famille existante
                    $family = Family::find($inscription->family_id);
                    $role = 'membre';
                }

                // Créer l'utilisateur
                $nom = $inscription->nom
                    ?? $inscription->responsable_nom
                    ?? ($inscription->data['responsable']['nom'] ?? 'NOM');
                $prenom = $inscription->prenom
                    ?? $inscription->responsable_prenom
                    ?? ($inscription->data['responsable']['prenom'] ?? 'PRENOM');
                $dateNaissance = $inscription->date_naissance
                    ?? ($inscription->data['responsable']['dateNaissance'] ?? null);
                $identifier = User::generateIdentifier(
                    (string) $nom,
                    (string) $prenom,
                    $dateNaissance ? (is_string($dateNaissance) ? $dateNaissance : $dateNaissance->format('Y-m-d')) : null
                );

                $tempPassword = '11111';

                $user = User::create([
                    'nom' => $nom,
                    'prenom' => $prenom,
                    'email' => $inscription->email ?? ($inscription->responsable_email ?? ($inscription->data['responsable']['email'] ?? null)),
                    'telephone' => $inscription->telephone ?? ($inscription->responsable_tel ?? ($inscription->data['responsable']['tel'] ?? null)),
                    'telephone2' => $inscription->telephone2 ?? ($inscription->responsable_telephone2 ?? ($inscription->data['responsable']['telephone2'] ?? null)),
                    'date_naissance' => $inscription->date_naissance ?? ($inscription->data['responsable']['dateNaissance'] ?? null),
                    'genre' => $inscription->genre ?? ($inscription->responsable_genre ?? ($inscription->data['responsable']['genre'] ?? null)),
                    'photo_path' => $inscription->photo_path,
                    'identifier' => $identifier,  // ✅ Identifiant généré
                    'password' => bcrypt($tempPassword), // Mot de passe temporaire
                    'family_id' => $family?->id,
                    'classe_id' => $family?->classe_id ?? $inscription->data['classe_id'] ?? null,
                    'is_family_responsible' => in_array($role, ['responsable']),
                    'last_login_at' => null,
                    'profession' => $inscription->data['profession'] ?? null,
                    'fonction_id' => $inscription->data['fonction_id'] ?? null,
                    'relation' => $inscription->data['relation'] ?? null,
                    'role' => ($role === 'responsable') ? 'responsable_famille' : 'membre_famille',
                ]);

                // Créer les sacrements/événements religieux
                if (isset($inscription->data['sacrements']) && is_array($inscription->data['sacrements'])) {
                    $this->createUserSacrements($user, $inscription->data['sacrements'], $inscription);
                } else {
                    // Créer un record de sacrements même sans données initiales
                    $this->createUserSacrements($user, null, $inscription);
                }

                // Si on a créé une nouvelle famille, mise à jour du responsable
                if ($family && in_array($role, ['responsable'])) {
                    $family->update(['responsable_id' => $user->id]);
                }

                // Relation famille-membre créée via user.family_id
                // Plus besoin de FamilyMember::create() - table supprimée

                // Le rôle est déjà assigné lors de la création de l'utilisateur
                // Mettre à jour l'inscription avec le statut approuvé
                $inscription->update([
                    'status' => 'approuve',
                    'user_id' => $user->id,
                    'family_id' => $family?->id,
                    // 'admin_approved' => true,
                    'admin_id' => Auth::id(),
                    'admin_approved_at' => now(),
                ]);

                // Récupérer la classe pour l'email
                $classe = Classe::find($inscription->classe_id);

                // 📧 Envoyer les identifiants et mot de passe par email
                try {
                    Mail::to($user->email)->send(new SendCredentials($user, $identifier, $tempPassword, $classe));
                    $user->credentials_sent_at = now();
                    $user->save();
                } catch (\Exception $e) {
                    Log::error('Erreur lors de l\'envoi des identifiants', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'error' => $e->getMessage(),
                    ]);
                }

                Log::info('Inscription approuvée', [
                    'inscription_id' => $inscription->id,
                    'user_id' => $user->id,
                    'role' => $role,
                    'family_id' => $family?->id,
                ]);

                return $user;
            });

            return redirect()->route('admin.inscriptions')
                ->with('success', '🎉 Félicitations ! L\'inscription a été approuvée avec succès. Bienvenue dans notre communauté spirituelle !');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Erreur validation approbation inscription', $e->errors());
            return redirect()->back()
                ->withErrors($e->errors())
                ->with('error', 'Validation échouée');
        } catch (\Exception $e) {
            Log::error('Erreur approbation inscription', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->back()
                ->with('error', 'Erreur lors de l\'approbation: ' . $e->getMessage());
        }
    }

    /**
     * Approuver une inscription de famille (responsable + tous les membres)
     * Maintenant, l'approbation admin seule ne crée pas les comptes - il faut aussi l'approbation du conducteur
     */
    private function approveFamilyAsAdmin(Inscription $inscriptionResponsable, $adminData)
    {
        try {
            // ✅ Approuver par l'admin ET créer les utilisateurs, famille et sacrements immédiatement
            $inscriptionResponsable->update([
                'admin_approved' => true,
                'admin_id' => Auth::id(),
                'admin_approved_at' => now(),
            ]);

            // ✅ Transaction: créer la famille et tous les utilisateurs
            DB::transaction(function () use ($inscriptionResponsable) {
                $this->createFamilyUsersFromInscription($inscriptionResponsable);
            });

            // ✅ Mettre à jour le statut à "approuve"
            $inscriptionResponsable->update([
                'status' => 'approuve',
            ]);

            Log::info('Inscription famille approuvée par l\'admin avec création des comptes', [
                'inscription_id' => $inscriptionResponsable->id,
                'admin_id' => Auth::id(),
                'type' => 'famille',
            ]);

            return redirect()->route('admin.inscriptions')
                ->with('success', '🎉 Excellente nouvelle ! L\'inscription famille a été approuvée et les utilisateurs ont été créés avec succès. Bienvenue dans notre communauté !');
        } catch (\Exception $e) {
            Log::error('Erreur approbation famille', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->back()
                ->with('error', 'Erreur lors de l\'approbation de la famille: ' . $e->getMessage());
        }
    }

    /**
     * Approuver une inscription (Conducteur)
     *
     * Les conducteurs ne peuvent approuver que les inscriptions de leur classe
     */
    public function approveAsConductor(Request $request, Inscription $inscription)
    {
        try {
            $conducteur = Auth::user();

            // Vérifier que c'est un conducteur authentifié
            if (!$conducteur || $conducteur->role !== 'conducteur') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un conducteur peut approuver une inscription',
                ], 403);
            }

            // IMPORTANT: Vérifier que le conducteur n'approuve que les inscriptions de sa classe
            if ($conducteur->classe_id !== $inscription->classe_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez approuver que les inscriptions de votre classe',
                ], 403);
            }

            $validated = $request->validate([
                'conducteur_notes' => 'nullable|string|max:500',
            ]);

            if ($inscription->status === 'approuve') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette inscription a déjà été approuvée',
                ], 400);
            }

            if ($inscription->conducteur_approved === true) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette inscription a déjà été approuvée par un conducteur',
                ], 400);
            }

            $inscription->update([
                'conducteur_approved' => true,
                'conducteur_id' => $conducteur->id,
                'conducteur_approved_at' => now(),
            ]);

            Log::info('Inscription approuvée par le conducteur de sa classe', [
                'inscription_id' => $inscription->id,
                'conducteur_id' => $conducteur->id,
                'classe_id' => $inscription->classe_id,
            ]);

            // Vérifier si l'approbation admin est aussi complète
            $inscription->refresh();
            if ($inscription->admin_approved && $inscription->conducteur_approved) {
                // ✓ Les deux approbations sont complètes, créer les comptes utilisateurs
                DB::transaction(function () use ($inscription) {
                    if ($inscription->type === 'famille') {
                        $this->createFamilyUsersFromInscription($inscription);
                    } elseif ($inscription->type === 'conducteur') {
                        $this->createConductorFamilyFromInscription($inscription);
                    } elseif ($inscription->type === 'pasteur') {
                        // Créer le pasteur
                        $role = 'pasteur';

                        // Créer l'utilisateur pasteur (sans famille pour l'instant)
                        $nom = $inscription->nom
                            ?? $inscription->responsable_nom
                            ?? ($inscription->data['responsable']['nom'] ?? 'NOM');
                        $prenom = $inscription->prenom
                            ?? $inscription->responsable_prenom
                            ?? ($inscription->data['responsable']['prenom'] ?? 'PRENOM');
                        $dateNaissance = $inscription->date_naissance
                            ?? ($inscription->data['responsable']['dateNaissance'] ?? null);
                        $identifier = User::generateIdentifier(
                            (string) $nom,
                            (string) $prenom,
                            $dateNaissance ? (is_string($dateNaissance) ? $dateNaissance : $dateNaissance->format('Y-m-d')) : null
                        );

                        $tempPassword = '11111';

                        $user = User::create([
                            'nom' => $nom,
                            'prenom' => $prenom,
                            'email' => $inscription->email ?? ($inscription->responsable_email ?? ($inscription->data['responsable']['email'] ?? null)),
                            'telephone' => $inscription->telephone ?? ($inscription->responsable_tel ?? ($inscription->data['responsable']['tel'] ?? null)),
                            'telephone2' => $inscription->telephone2 ?? ($inscription->responsable_telephone2 ?? ($inscription->data['responsable']['telephone2'] ?? null)),
                            'date_naissance' => $inscription->date_naissance ?? ($inscription->data['responsable']['dateNaissance'] ?? null),
                            'genre' => $inscription->genre ?? ($inscription->responsable_genre ?? ($inscription->data['responsable']['genre'] ?? null)),
                            'adresse' => $inscription->data['person']['adresse'] ?? null,
                            'fonction_professionnelle' => $inscription->data['person']['fonction_professionnelle'] ?? null,
                            'fonction_id' => $inscription->data['person']['fonction'] ?? null,
                            'classe_id' => $inscription->classe_id,
                            'photo_path' => $inscription->photo_path,
                            'ville_id' => $inscription->data['person']['ville_id'] ?? null,
                            'identifier' => $identifier,
                            'password' => bcrypt($tempPassword),
                            'role' => $role,
                        ]);

                        // Créer les sacrements du pasteur
                        $this->createUserSacrements($user, null, $inscription);

                        // Mettre à jour l'inscription
                        $inscription->update([
                            'status' => 'approuve',
                            'user_id' => $user->id,
                        ]);

                        // Récupérer la classe pour l'email
                        $classe = Classe::find($inscription->classe_id);

                        // 📧 Envoyer les identifiants et mot de passe par email
                        try {
                            Mail::send(new SendCredentials($user, $identifier, $tempPassword, $classe));
                        } catch (\Exception $e) {
                            Log::error('Erreur lors de l\'envoi des identifiants du pasteur', [
                                'user_id' => $user->id,
                                'email' => $user->email,
                                'error' => $e->getMessage(),
                            ]);
                        }

                        Log::info('Compte utilisateur créé pour pasteur', [
                            'inscription_id' => $inscription->id,
                            'user_id' => $user->id,
                            'role' => $role,
                            'classe_id' => $inscription->classe_id,
                        ]);
                    }
                    // ============ CAS: INDIVIDUEL OU MEMBRE FAMILLE ============
                    elseif ($inscription->type === 'individuel' || $inscription->type === 'membre_famille') {
                        $this->createIndividualUserFromInscription($inscription);
                    }
                });

                return response()->json([
                    'success' => true,
                    'message' => '🎉 Excellente nouvelle ! L\'inscription a été approuvée et les comptes utilisateur ont été créés avec succès. Bienvenue dans notre communauté spirituelle !',
                    'inscription_id' => $inscription->id,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => '✅ Parfait ! L\'inscription a été approuvée par le conducteur. En attente de validation finale par l\'administrateur.',
                'inscription_id' => $inscription->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur approbation inscription par conducteur', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rejeter une inscription
     */
    public function reject(Request $request, Inscription $inscription)
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            if (in_array($inscription->status, ['approuve', 'rejete'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette inscription ne peut pas être modifiée (déjà ' . $inscription->status . ')',
                ], 400);
            }

            // Récupérer l'email du responsable
            $email = $inscription->responsable_email ?? $inscription->email;

            // Si c'est une inscription de famille, rejeter aussi les inscriptions des membres
            if ($inscription->type === 'famille') {
                $membresInscriptions = Inscription::where('type', 'membre_famille')
                    ->where('status', 'en_attente')
                    ->get();

                foreach ($membresInscriptions as $membreInscription) {
                    $membreInscription->update([
                        'status' => 'rejete',
                        'admin_approved' => false,
                        'admin_id' => Auth::id(),
                        'admin_approved_at' => now(),
                        'data' => array_merge($membreInscription->data ?? [], [
                            'raison_rejet' => $validated['reason'],
                        ]),
                    ]);
                }
            }

            $inscription->update([
                'status' => 'rejete',
                'admin_approved' => false,
                'admin_id' => Auth::id(),
                'admin_approved_at' => now(),
                'data' => array_merge($inscription->data ?? [], [
                    'raison_rejet' => $validated['reason'],
                ]),
            ]);

            // 📧 ENVOYER L'EMAIL DE REFUS AU RESPONSABLE
            try {
                // Créer un objet utilisateur temporaire pour l'email
                $user = new User();
                $user->email = $email;
                $user->nom = $inscription->responsable_nom ?? $inscription->nom;
                $user->prenom = $inscription->responsable_prenom ?? $inscription->prenom;

                Mail::send(new InscriptionRejected($user, $validated['reason'], $inscription->type));

                Log::info('Email de refus envoyé', [
                    'inscription_id' => $inscription->id,
                    'email' => $email,
                    'type' => $inscription->type,
                ]);
            } catch (\Exception $e) {
                Log::error('Erreur lors de l\'envoi de l\'email de refus', [
                    'inscription_id' => $inscription->id,
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('Inscription rejetée', [
                'inscription_id' => $inscription->id,
                'type' => $inscription->type,
                'raison' => $validated['reason'],
            ]);

            $message = $inscription->type === 'famille'
                ? 'Famille rejetée avec succès. Un email de notification a été envoyé au responsable.'
                : 'Inscription rejetée avec succès. Un email de notification a été envoyé.';

            return response()->json([
                'success' => true,
                'message' => $message,
                'inscription_id' => $inscription->id,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Erreur validation rejet inscription', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur rejet inscription', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lister les inscriptions à approuver
     * Pour les admins: toutes les inscriptions
     * Pour les conducteurs: seulement les inscriptions de leur classe
     */
    public function pendingApprovals()
    {
        try {
            $user = Auth::user();

            $query = Inscription::where('status', 'pending_approval')
                ->with(['classe', 'family', 'user', 'admin', 'conducteur']);

            // Si c'est un conducteur, filtrer par sa classe
            if ($user && $user->role === 'conducteur') {
                $query->where('classe_id', $user->classe_id);
            }
            // Si ce n'est pas un admin, interdire l'accès
            elseif (!$user || ($user->role !== 'admin' && $user->role !== 'super_admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé',
                ], 403);
            }

            $inscriptions = $query->orderBy('created_at', 'desc')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $inscriptions,
                'user_role' => $user?->roles->pluck('name')->first(),
                'user_classe_id' => $user?->classe_id,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur récupération inscriptions à approuver', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des inscriptions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lister les inscriptions en attente
     */
    public function pending()
    {
        try {
            $inscriptions = Inscription::where('status', 'en_attente')
                ->with(['classe', 'family'])
                ->orderBy('created_at', 'desc')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $inscriptions,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur récupération inscriptions en attente', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des inscriptions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir le détail d'une inscription
     */
    public function show(Inscription $inscription)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $inscription->load(['user', 'classe', 'family']),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur récupération détail inscription', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Créer une famille de conducteur et tous ses membres à partir d'une inscription
     * Appelé après approbation admin ET conducteur
     * Le responsable devient 'conducteur', les membres deviennent 'membre_famille'
     */
    private function createConductorFamilyFromInscription(Inscription $inscriptionConducteur)
    {
        // Récupérer les données du responsable depuis les colonnes responsable_*
        $nomConducteur = $inscriptionConducteur->responsable_nom ?? $inscriptionConducteur->nom;
        $prenomConducteur = $inscriptionConducteur->responsable_prenom ?? $inscriptionConducteur->prenom;
        $emailConducteur = $inscriptionConducteur->responsable_email ?? $inscriptionConducteur->email;
        $telConducteur = $inscriptionConducteur->responsable_tel ?? $inscriptionConducteur->telephone;
        $tel2Conducteur = $inscriptionConducteur->responsable_telephone2 ?? $inscriptionConducteur->telephone2;
        $dateNaissanceConducteur = $inscriptionConducteur->responsable_date_naissance ?? $inscriptionConducteur->date_naissance;
        $genreConducteur = $inscriptionConducteur->responsable_genre ?? $inscriptionConducteur->genre;

        // 1. Créer la famille du conducteur
        $family = Family::create([
            'nom' => $nomConducteur . ' ' . $prenomConducteur . ' (Conducteur)',
            'classe_id' => $inscriptionConducteur->classe_id,
            'adresse' => $inscriptionConducteur->data['famille']['adresse'] ?? null,
            'quartier' => $inscriptionConducteur->data['famille']['quartier'] ?? null,
            'ville_id' => $inscriptionConducteur->data['famille']['ville_id'] ?? null,
            'telephone' => $telConducteur,
            'telephone2' => $tel2Conducteur,
            'email' => $emailConducteur,
        ]);

        // Récupérer la classe pour les emails
        $classe = Classe::find($inscriptionConducteur->classe_id);

        // 2. Créer l'utilisateur conducteur (responsable)
        $identifierConducteur = User::generateIdentifier(
            $nomConducteur,
            $prenomConducteur,
            $dateNaissanceConducteur instanceof \DateTime ? $dateNaissanceConducteur->format('Y-m-d') : $dateNaissanceConducteur
        );

        $tempPasswordConducteur = '11111';

        $userConducteur = User::create([
            'nom' => $nomConducteur,
            'prenom' => $prenomConducteur,
            'email' => $emailConducteur,
            'telephone' => $telConducteur,
            'telephone2' => $tel2Conducteur,
            'date_naissance' => $dateNaissanceConducteur,
            'genre' => $genreConducteur,
            'photo_path' => $inscriptionConducteur->photo_path,
            'identifier' => $identifierConducteur,
            'password' => bcrypt($tempPasswordConducteur),
            'family_id' => $family->id,
            'classe_id' => $inscriptionConducteur->classe_id,
            'is_family_responsible' => true,
            'last_login_at' => null,
            'role' => 'conducteur', // ✅ Conducteur
        ]);

        // Créer les sacrements du conducteur (depuis les colonnes responsable_* ou data)
        $this->createUserSacrements($userConducteur, null, $inscriptionConducteur);

        // Mettre à jour la famille avec le responsable
        $family->update(['responsable_id' => $userConducteur->id]);

        // Mettre à jour l'inscription du conducteur
        $inscriptionConducteur->update([
            'status' => 'approuve',
            'user_id' => $userConducteur->id,
            'family_id' => $family->id,
        ]);

        // 📧 Envoyer les identifiants et mot de passe par email au conducteur
        try {
            Mail::send(new SendCredentials($userConducteur, $identifierConducteur, $tempPasswordConducteur, $classe));
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi des identifiants au conducteur', [
                'user_id' => $userConducteur->id,
                'email' => $userConducteur->email,
                'error' => $e->getMessage(),
            ]);
        }

        Log::info('Conducteur créé', [
            'inscription_id' => $inscriptionConducteur->id,
            'user_id' => $userConducteur->id,
            'family_id' => $family->id,
        ]);

        // 3. Créer les utilisateurs pour les membres (rôle: membre_famille)
        if (!empty($inscriptionConducteur->data['membres']) && is_array($inscriptionConducteur->data['membres'])) {
            foreach ($inscriptionConducteur->data['membres'] as $membreData) {
                $identifierMembre = User::generateIdentifier(
                    $membreData['nom'] ?? 'X',
                    $membreData['prenom'] ?? 'X',
                    isset($membreData['dateNaissance']) ? ($membreData['dateNaissance'] instanceof \DateTime ? $membreData['dateNaissance']->format('Y-m-d') : $membreData['dateNaissance']) : now()->format('Y-m-d')
                );

                $tempPasswordMembre = '11111';

                $userMembre = User::create([
                    'nom' => $membreData['nom'] ?? null,
                    'prenom' => $membreData['prenom'] ?? null,
                    'email' => $membreData['email'] ?? null,
                    'telephone' => $membreData['telephone'] ?? null,
                    'telephone2' => $membreData['telephone2'] ?? null,
                    'date_naissance' => $membreData['dateNaissance'] ?? null,
                    'genre' => $membreData['genre'] ?? null,
                    'photo_path' => $membreData['photo_path'] ?? null,
                    'identifier' => $identifierMembre,
                    'password' => bcrypt($tempPasswordMembre),
                    'family_id' => $family->id,
                    'classe_id' => $inscriptionConducteur->classe_id,
                    'is_family_responsible' => false,
                    'last_login_at' => null,
                    'role' => 'membre_famille', // ✅ Membre de famille
                ]);

                // ✅ Créer les sacrements du membre depuis le JSON membreData 
                // (les données sont directes: baptise, premiereCommunion, etc. - pas groupées dans 'sacrements')
                $this->createUserSacrements($userMembre, $membreData);

                // 📧 Envoyer les identifiants et mot de passe par email au membre
                try {
                    if (!empty($membreData['email'])) {
                        Mail::send(new SendCredentials($userMembre, $identifierMembre, $tempPasswordMembre, $classe));
                    }
                } catch (\Exception $e) {
                    Log::error('Erreur lors de l\'envoi des identifiants au membre de conducteur', [
                        'user_id' => $userMembre->id,
                        'email' => $membreData['email'] ?? 'N/A',
                        'error' => $e->getMessage(),
                    ]);
                }

                Log::info('Membre de famille du conducteur créé', [
                    'user_id' => $userMembre->id,
                    'family_id' => $family->id,
                    'nom' => $membreData['nom'] ?? null,
                ]);
            }
        }
    }

    /**
     * Créer une famille et tous ses membres à partir d'une inscription
     * Appelé après approbation admin ET conducteur
     */
    private function createFamilyUsersFromInscription(Inscription $inscriptionResponsable)
    {
        // 1. Créer la famille
        $family = Family::create([
            'nom' => $inscriptionResponsable->data['famille']['nom'] ?? $inscriptionResponsable->responsable_nom . ' ' . $inscriptionResponsable->responsable_prenom,
            'classe_id' => $inscriptionResponsable->classe_id,
            'adresse' => $inscriptionResponsable->data['famille']['adresse'] ?? null,
            'quartier' => $inscriptionResponsable->data['famille']['quartier'] ?? null,
            'ville_id' => $inscriptionResponsable->data['famille']['ville_id'] ?? null,
            'telephone' => $inscriptionResponsable->responsable_tel,
            'telephone2' => $inscriptionResponsable->responsable_telephone2,
            'email' => $inscriptionResponsable->responsable_email,
        ]);

        // Récupérer la classe pour les emails
        $classe = Classe::find($inscriptionResponsable->classe_id);

        // ✅ CORRECTION: Utiliser les colonnes responsable_* pour créer l'utilisateur responsable
        // 2. Créer l'utilisateur responsable
        $identifierResponsable = User::generateIdentifier(
            $inscriptionResponsable->responsable_nom,
            $inscriptionResponsable->responsable_prenom,
            $inscriptionResponsable->responsable_date_naissance?->format('Y-m-d')
        );

        $tempPasswordResponsable = '11111';

        $userResponsable = User::create([
            'nom' => $inscriptionResponsable->responsable_nom,
            'prenom' => $inscriptionResponsable->responsable_prenom,
            'email' => $inscriptionResponsable->responsable_email,
            'telephone' => $inscriptionResponsable->responsable_tel,
            'telephone2' => $inscriptionResponsable->responsable_telephone2,
            'date_naissance' => $inscriptionResponsable->responsable_date_naissance,
            'genre' => $inscriptionResponsable->responsable_genre,
            'photo_path' => $inscriptionResponsable->photo_path,
            'identifier' => $identifierResponsable,
            'password' => bcrypt($tempPasswordResponsable),
            'family_id' => $family->id,
            'classe_id' => $inscriptionResponsable->classe_id,
            'is_family_responsible' => true,
            'last_login_at' => null,
            'role' => 'responsable_famille',
        ]);

        // ✅ Créer les sacrements du responsable à partir des colonnes responsable_*
        $this->createResponsableSacrementsFromInscription($userResponsable, $inscriptionResponsable);

        // Mettre à jour la famille avec le responsable
        $family->update(['responsable_id' => $userResponsable->id]);

        // Relation famille-responsable créée via user.family_id
        // Plus besoin de FamilyMember::create() - table supprimée

        // Le rôle est déjà assigné lors de la création de l'utilisateur
        // Approuver l'inscription du responsable
        $inscriptionResponsable->update([
            'status' => 'approuve',
            'user_id' => $userResponsable->id,
            'family_id' => $family->id,
        ]);

        // Vérifier que la mise à jour est faite
        $inscriptionResponsable->refresh();
        Log::info('Inscription responsable approuvée et vérifiée', [
            'inscription_id' => $inscriptionResponsable->id,
            'status' => $inscriptionResponsable->status,
            'user_id' => $userResponsable->id,
            'family_id' => $family->id,
        ]);

        // 📧 Envoyer les identifiants et mot de passe par email au responsable
        try {
            Mail::send(new SendCredentials($userResponsable, $identifierResponsable, $tempPasswordResponsable, $classe));
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi des identifiants au responsable', [
                'user_id' => $userResponsable->id,
                'email' => $userResponsable->email,
                'error' => $e->getMessage(),
            ]);
        }

        Log::info('Responsable de famille créé', [
            'inscription_id' => $inscriptionResponsable->id,
            'user_id' => $userResponsable->id,
            'family_id' => $family->id,
        ]);

        // 3. Créer les utilisateurs pour les membres
        if (!empty($inscriptionResponsable->data['membres']) && is_array($inscriptionResponsable->data['membres'])) {
            foreach ($inscriptionResponsable->data['membres'] as $membreData) {
                // Créer l'utilisateur membre
                $identifierMembre = User::generateIdentifier(
                    $membreData['nom'] ?? 'X',
                    $membreData['prenom'] ?? 'X',
                    isset($membreData['dateNaissance']) ? ($membreData['dateNaissance'] instanceof \DateTime ? $membreData['dateNaissance']->format('Y-m-d') : $membreData['dateNaissance']) : now()->format('Y-m-d')
                );

                $tempPasswordMembre = '11111';

                $userMembre = User::create([
                    'nom' => $membreData['nom'] ?? null,
                    'prenom' => $membreData['prenom'] ?? null,
                    'email' => $membreData['email'] ?? null,
                    'telephone' => $membreData['telephone'] ?? null,
                    'telephone2' => $membreData['telephone2'] ?? null,
                    'date_naissance' => $membreData['dateNaissance'] ?? null,
                    'genre' => $membreData['genre'] ?? null,
                    'photo_path' => $membreData['photo_path'] ?? null,
                    'identifier' => $identifierMembre,
                    'password' => bcrypt($tempPasswordMembre),
                    'family_id' => $family->id,
                    'classe_id' => $inscriptionResponsable->classe_id,
                    'is_family_responsible' => false,
                    'last_login_at' => null,
                    'role' => 'membre_famille',
                ]);

                // ✅ Créer les sacrements du membre depuis le JSON membreData 
                // (les données sont directes: baptise, premiereCommunion, etc. - pas groupées dans 'sacrements')
                $this->createUserSacrements($userMembre, $membreData);

                // Relation famille-membre créée via user.family_id
                // Plus besoin de FamilyMember::create() - table supprimée

                // 📧 Envoyer les identifiants et mot de passe par email au membre
                try {
                    if (!empty($membreData['email'])) {
                        Mail::send(new SendCredentials($userMembre, $identifierMembre, $tempPasswordMembre, $classe));
                    }
                } catch (\Exception $e) {
                    Log::error('Erreur lors de l\'envoi des identifiants au membre', [
                        'user_id' => $userMembre->id,
                        'email' => $membreData['email'] ?? 'N/A',
                        'error' => $e->getMessage(),
                    ]);
                }

                // Le rôle est déjà assigné lors de la création de l'utilisateur
                // Mettre à jour l'inscription du membre si elle existe
                Inscription::where('type', 'membre_famille')
                    ->where('nom', $membreData['nom'] ?? null)
                    ->where('prenom', $membreData['prenom'] ?? null)
                    ->where('status', 'en_attente')
                    ->first()?->update([
                        'status' => 'approuve',
                        'user_id' => $userMembre->id,
                        'family_id' => $family->id,
                    ]);

                Log::info('Membre de famille créé', [
                    'user_id' => $userMembre->id,
                    'family_id' => $family->id,
                    'nom' => $membreData['nom'] ?? null,
                ]);
            }
        }
    }

    /**
     * Créer un utilisateur individuel à partir d'une inscription
     * Appelé après approbation admin ET conducteur
     */
    private function createIndividualUserFromInscription(Inscription $inscription)
    {
        // Déterminer le rôle basé sur la famille
        $family = null;
        $role = 'individuel';

        if ($inscription->family_id) {
            // L'individu s'ajoute à une famille existante
            $family = Family::find($inscription->family_id);
            $role = 'membre';
        } else {
            // Créer une nouvelle famille pour l'individu
            $family = Family::create([
                'nom' => $inscription->nom . ' ' . $inscription->prenom,
                'classe_id' => $inscription->classe_id,
                'adresse' => $inscription->adresse,
                'quartier' => null,
                'ville_id' => $inscription->ville_id,
                'telephone' => $inscription->telephone,
                'telephone2' => $inscription->telephone2,
                'email' => $inscription->email,
            ]);
            $role = 'responsable'; // Devient responsable de sa propre famille
        }

        // Créer l'utilisateur
        $nom = $inscription->nom
            ?? $inscription->responsable_nom
            ?? ($inscription->data['responsable']['nom'] ?? 'NOM');
        $prenom = $inscription->prenom
            ?? $inscription->responsable_prenom
            ?? ($inscription->data['responsable']['prenom'] ?? 'PRENOM');
        $dateNaissance = $inscription->date_naissance
            ?? ($inscription->data['responsable']['dateNaissance'] ?? null);
        $identifier = User::generateIdentifier(
            (string) $nom,
            (string) $prenom,
            $dateNaissance ? (is_string($dateNaissance) ? $dateNaissance : $dateNaissance->format('Y-m-d')) : null
        );

        $tempPassword = '11111';

        $user = User::create([
            'nom' => $nom,
            'prenom' => $prenom,
            'email' => $inscription->email ?? ($inscription->responsable_email ?? ($inscription->data['responsable']['email'] ?? null)),
            'telephone' => $inscription->telephone ?? ($inscription->responsable_tel ?? ($inscription->data['responsable']['tel'] ?? null)),
            'telephone2' => $inscription->telephone2 ?? ($inscription->responsable_telephone2 ?? ($inscription->data['responsable']['telephone2'] ?? null)),
            'date_naissance' => $inscription->date_naissance ?? ($inscription->data['responsable']['dateNaissance'] ?? null),
            'genre' => $inscription->genre ?? ($inscription->responsable_genre ?? ($inscription->data['responsable']['genre'] ?? null)),
            'photo_path' => $inscription->photo_path,
            'identifier' => $identifier,  // ✅ Identifiant généré
            'password' => bcrypt($tempPassword), // Mot de passe temporaire
            'family_id' => $family->id,
            'classe_id' => $inscription->classe_id,
            'ville_id' => $inscription->ville_id,
            'is_family_responsible' => ($role === 'responsable'),
            'last_login_at' => null,
            'role' => ($role === 'responsable') ? 'responsable_famille' : 'membre_famille',
        ]);

        // Le rôle est déjà assigné lors de la création de l'utilisateur
        if ($role === 'responsable') {
            $family->update(['responsable_id' => $user->id]);
            $relationRole = 'responsable';
        } else {
            $relationRole = 'membre';
        }

        // Relation famille-utilisateur créée via user.family_id
        // Plus besoin de FamilyMember::create() - table supprimée

        // Mettre à jour l'inscription
        $inscription->update([
            'status' => 'approuve',
            'user_id' => $user->id,
            'family_id' => $family->id,
        ]);

        // Récupérer la classe pour l'email
        $classe = Classe::find($inscription->classe_id);

        // 📧 Envoyer les identifiants et mot de passe par email
        try {
            Mail::send(new SendCredentials($user, $identifier, $tempPassword, $classe));
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi des identifiants à l\'utilisateur individuel', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }

        Log::info('Utilisateur individuel créé', [
            'inscription_id' => $inscription->id,
            'user_id' => $user->id,
            'family_id' => $family->id,
            'role' => $role,
        ]);
    }

    /**
     * Créer les sacrements/événements religieux et statut matrimonial d'un utilisateur à partir des données d'inscription
     *
     * @param User $user
     * @param array|null $sacrementData Les données de sacrements (si disponibles)
     * @param Inscription|null $inscription L'inscription pour récupérer les informations complètes
     */
    private function createUserSacrements(User $user, ?array $sacrementData, ?Inscription $inscription = null)
    {
        // Préparer les données de sacrements
        $sacrementRecord = [
            'user_id' => $user->id,
            // Sacrements religieux
            'baptise' => false,
            'premiere_communion' => false,
            'marie_religieusement' => false,
            // Statut matrimonial civil
            'est_marie' => false,
            'dot_effectue' => false,
            'est_veuf' => false,
            'est_divorce' => false,
        ];

        // Si sacrementData est fourni (d'une inscription/formulaire), l'utiliser
        if ($sacrementData && is_array($sacrementData)) {
            // Données du membre depuis le JSON ou formulaire
            $sacrementRecord['baptise'] = (bool)($sacrementData['baptise'] ?? false);
            if ($sacrementRecord['baptise']) {
                $sacrementRecord['bapteme_date'] = $sacrementData['date_bapteme'] ?? $sacrementData['bapteme_date'] ?? null;
                $sacrementRecord['bapteme_lieu'] = $sacrementData['lieu_bapteme'] ?? $sacrementData['bapteme_lieu'] ?? null;
            }

            $sacrementRecord['premiere_communion'] = (bool)($sacrementData['premiere_communion'] ?? false);
            if ($sacrementRecord['premiere_communion']) {
                $sacrementRecord['premiere_communion_date'] = $sacrementData['date_premiere_communion'] ?? $sacrementData['premiere_communion_date'] ?? null;
                $sacrementRecord['premiere_communion_lieu'] = $sacrementData['lieu_premiere_communion'] ?? $sacrementData['premiere_communion_lieu'] ?? null;
            }

            $sacrementRecord['marie_religieusement'] = (bool)($sacrementData['marie_religieusement'] ?? false);
            if ($sacrementRecord['marie_religieusement']) {
                $sacrementRecord['mariage_religieux_date'] = $sacrementData['date_mariage_religieux'] ?? $sacrementData['mariage_religieux_date'] ?? null;
                $sacrementRecord['mariage_religieux_lieu'] = $sacrementData['lieu_mariage_religieux'] ?? $sacrementData['mariage_religieux_lieu'] ?? null;
            }

            // Statut matrimonial civil du membre
            $statut = $sacrementData['statut_marital'] ?? null;
            $dateMarriage = $sacrementData['date_mariage'] ?? $sacrementData['mariage_civil_date'] ?? null;
            $lieuMarriage = $sacrementData['lieu_mariage'] ?? $sacrementData['mariage_civil_lieu'] ?? null;
            $dateDot = $sacrementData['date_dot'] ?? $sacrementData['dot_date'] ?? null;
            $lieuDot = $sacrementData['lieu_dot'] ?? $sacrementData['dot_lieu'] ?? null;
            $dateDeces = $sacrementData['date_deces'] ?? $sacrementData['deces_conjoint_date'] ?? null;
            $lieuDeces = $sacrementData['lieu_deces'] ?? $sacrementData['deces_conjoint_lieu'] ?? null;
            $dateDivorce = $sacrementData['date_divorce'] ?? $sacrementData['divorce_date'] ?? null;
            $lieuDivorce = $sacrementData['lieu_divorce'] ?? $sacrementData['divorce_lieu'] ?? null;
        } else {
            // Si pas de sacrementData, on peut extraire depuis l'inscription si c'est un responsable
            $statut = null;
            $dateMarriage = null;
            $lieuMarriage = null;
            $dateDot = null;
            $lieuDot = null;
            $dateDeces = null;
            $lieuDeces = null;
            $dateDivorce = null;
            $lieuDivorce = null;
        }

        // Si l'inscription est fournie ET qu'on a pas sacrementData (cas responsable/famille)
        if ($inscription && (!$sacrementData || !is_array($sacrementData))) {
            // Pour un responsable - utiliser les colonnes responsable_*
            if ($inscription->type === 'responsable' || $inscription->type === 'famille') {
                $statut = $inscription->responsable_statut_marital;
                $dateMarriage = $inscription->responsable_date_mariage;
                $lieuMarriage = $inscription->responsable_lieu_mariage;
                $dateDot = $inscription->responsable_date_dot ?? $inscription->date_dot;
                $lieuDot = $inscription->responsable_lieu_dot ?? $inscription->lieu_dot;
                $dateDeces = $inscription->responsable_date_deces;
                $lieuDeces = $inscription->responsable_lieu_deces;
                $dateDivorce = $inscription->responsable_date_divorce;
                $lieuDivorce = $inscription->responsable_lieu_divorce;

                // Sacrements religieux du responsable
                if ($inscription->responsable_baptise ?? false) {
                    $sacrementRecord['baptise'] = true;
                    $sacrementRecord['bapteme_date'] = $inscription->responsable_date_bapteme;
                    $sacrementRecord['bapteme_lieu'] = $inscription->responsable_lieu_bapteme;
                }
                if ($inscription->responsable_premiere_communion ?? false) {
                    $sacrementRecord['premiere_communion'] = true;
                    $sacrementRecord['premiere_communion_date'] = $inscription->responsable_date_premiere_communion;
                    $sacrementRecord['premiere_communion_lieu'] = $inscription->responsable_lieu_premiere_communion;
                }
                if ($inscription->responsable_marie_religieusement ?? false) {
                    $sacrementRecord['marie_religieusement'] = true;
                    $sacrementRecord['mariage_religieux_date'] = $inscription->responsable_date_mariage_religieux;
                    $sacrementRecord['mariage_religieux_lieu'] = $inscription->responsable_lieu_mariage_religieux;
                }
            }
        }

        // Mapper le statut matrimonial civil (depuis sacrementData OU inscription responsable)
        if ($statut) {
            $statutLower = strtolower($statut);
            if (strpos($statutLower, 'mari') !== false) {
                $sacrementRecord['est_marie'] = true;
                $sacrementRecord['mariage_civil_date'] = $dateMarriage;
                $sacrementRecord['mariage_civil_lieu'] = $lieuMarriage;
            } elseif (strpos($statutLower, 'divorc') !== false) {
                $sacrementRecord['est_divorce'] = true;
                $sacrementRecord['divorce_date'] = $dateDivorce;
                $sacrementRecord['divorce_lieu'] = $lieuDivorce;
            } elseif (strpos($statutLower, 'veuf') !== false) {
                $sacrementRecord['est_veuf'] = true;
                $sacrementRecord['deces_conjoint_date'] = $dateDeces;
                $sacrementRecord['deces_conjoint_lieu'] = $lieuDeces;
            } elseif (strpos($statutLower, 'dot') !== false) {
                $sacrementRecord['dot_effectue'] = true;
                $sacrementRecord['dot_date'] = $dateDot;
                $sacrementRecord['dot_lieu'] = $lieuDot;
            }
        }

        // Créer le record unique de sacrements pour cet utilisateur
        try {
            UserSacrement::create($sacrementRecord);
            Log::info('Sacrements créés pour l\'utilisateur', [
                'user_id' => $user->id,
                'data' => $sacrementRecord,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création des sacrements', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * ✅ Créer les sacrements du responsable depuis les colonnes responsable_* de l'inscription
     */
    private function createResponsableSacrementsFromInscription(User $user, Inscription $inscription): void
    {
        // Appeler createUserSacrements avec les données du responsable
        $this->createUserSacrements($user, null, $inscription);
    }

    /**
     * Chercher le responsable d'une inscription famille et hériter ses family_id et classe_id
     */
    private function getResponsibleInheritance(?string $familyTempKey, ?array $data): array
    {
        $familyId = null;
        $classeId = null;

        // Chercher l'utilisateur responsable par family_temp_key
        if ($familyTempKey) {
            $inscription = Inscription::where('family_temp_key', $familyTempKey)
                ->where('type', 'responsable')
                ->first();

            if ($inscription && $inscription->user_id) {
                $responsable = User::find($inscription->user_id);
                if ($responsable) {
                    $familyId = $responsable->family_id;
                    $classeId = $responsable->classe_id;
                }
            }
        }

        // Fallback sur les données d'inscription
        if (!$classeId && isset($data['classe_id'])) {
            $classeId = $data['classe_id'];
        }

        return [
            'family_id' => $familyId,
            'classe_id' => $classeId,
        ];
    }
}
