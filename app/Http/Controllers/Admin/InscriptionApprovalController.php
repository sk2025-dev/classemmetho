<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inscription;
use App\Models\User;
use App\Models\Family;
use App\Models\UserSacrement;
use App\Mail\SendCredentials;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Services\InscriptionProcessor;

class InscriptionApprovalController extends Controller
{
    /**
     * Approuver une inscription
     * POST /admin/inscriptions/{id}/approve
     *
     * Flux:
     * 1. Créer Family avec données de inscription.data['famille'] + responsable_*
     * 2. Créer User pour le responsable
     * 3. Créer User pour chaque membre
     * 4. Créer UserSacrement pour responsable et membres (depuis les champs booléens + dates)
     */
    public function approve(Request $request, $id)
    {
        try {
            // Valider l'ID
            $validator = Validator::make(['id' => $id], [
                'id' => 'required|integer|exists:inscriptions,id',
            ]);
            if ($validator->fails()) {
                return redirect()->back()
                    ->with('error', 'Inscription non trouvée');
            }

            // Récupérer l'inscription
            $inscription = Inscription::findOrFail($id);

            // Vérifier le statut (accepter les deux formats)
            if (!in_array($inscription->status, ['en_attente', 'pending'])) {
                return redirect()->back()
                    ->with('error', 'Inscription déjà traitée. Statut: ' . $inscription->status);
            }

            // Vérifier les permissions
            if (!Auth::user() || Auth::user()->role !== 'admin') {
                return redirect()->back()
                    ->with('error', 'Vous n\'avez pas la permission d\'approuver cette inscription');
            }

            // Exécuter tout dans une transaction
            DB::transaction(function () use ($inscription) {
                // 1️⃣ CRÉER LA FAMILLE
                $family = $this->createFamily($inscription);

                // 2️⃣ CRÉER L'UTILISATEUR RESPONSABLE
                $responsableUser = $this->createResponsableUser($inscription, $family);

                // 3️⃣ CRÉER LES UTILISATEURS POUR LES MEMBRES
                $this->createFamilyMembers($inscription, $family, $responsableUser);

                // 4️⃣ CRÉER LES SACREMENTS DU RESPONSABLE
                $this->createUserSacrements($responsableUser, $inscription, 'responsable');

                // 5️⃣ CRÉER LES SACREMENTS DES MEMBRES
                if ($inscription->type === 'famille' && isset($inscription->data['membres'])) {
                    foreach ($inscription->data['membres'] as $membre) {
                        $memberUser = User::where('family_id', $family->id)
                            ->where('nom', $membre['nom'] ?? '')
                            ->where('prenom', $membre['prenom'] ?? '')
                            ->first();

                        if ($memberUser) {
                            $this->createUserSacrements($memberUser, $inscription, 'membre', $membre);
                        }
                    }
                }

                // 6️⃣ METTRE À JOUR LE STATUT DE L'INSCRIPTION
                $inscription->update([
                    'status' => 'approuve',
                    'admin_id' => Auth::id(),
                    'admin_approved_at' => now(),
                ]);

                Log::info('Inscription approuvée et données créées', [
                    'inscription_id' => $inscription->id,
                    'family_id' => $family->id,
                    'responsable_id' => $responsableUser->id,
                    'admin_id' => Auth::id(),
                ]);
            });

            return redirect()->back()
                ->with('success', 'Inscription approuvée! Famille et utilisateurs créés avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'approbation', [
                'inscription_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->back()
                ->with('error', 'Erreur: ' . $e->getMessage());
        }
    }

    /**
     * 1️⃣ Créer la famille à partir des données d'inscription
     */
    private function createFamily(Inscription $inscription): Family
    {
        $familyData = $inscription->data['famille'] ?? [];

        // Extraire classe_id et ville_id depuis le JSON data
        $classeId = $familyData['classe_id'] ?? null;
        $villeId = $familyData['ville_id'] ?? $inscription->ville_id;

        $family = Family::create([
            'nom' => $familyData['nom'] ?? $inscription->responsable_nom,
            'classe_id' => $classeId,
            'adresse' => $familyData['adresse'] ?? '',
            'quartier' => $familyData['quartier'] ?? '',
            'ville_id' => $villeId,
            'email' => $inscription->responsable_email,
            'telephone' => $inscription->responsable_tel,
            'telephone2' => $inscription->responsable_telephone2,
            'contact_urgence' => $familyData['contact_urgence'] ?? '',
            'contact_urgence_tel' => $familyData['contact_urgence_tel'] ?? '',
        ]);

        Log::info('Famille créée', [
            'family_id' => $family->id,
            'nom' => $family->nom,
            'classe_id' => $family->classe_id,
            'ville_id' => $family->ville_id,
        ]);

        return $family;
    }

    /**
     * 2️⃣ Créer l'utilisateur responsable
     */
    private function createResponsableUser(Inscription $inscription, Family $family): User
    {
        // Vérifier si un utilisateur avec cet email existe déjà
        $existingUser = User::where('email', $inscription->responsable_email)->first();
        if ($existingUser) {
            // Lier l'utilisateur existant à la famille
            $existingUser->update(['family_id' => $family->id]);
            return $existingUser;
        }

        // Générer l'identifiant
        $identifier = User::generateIdentifier(
            $inscription->responsable_nom,
            $inscription->responsable_prenom,
            $inscription->responsable_date_naissance
        );

        // Mot de passe temporaire
        $tempPassword = '11111';

        // Déterminer le rôle en fonction du type d'inscription
        $role = $inscription->type === 'conducteur' ? 'conducteur' : 'responsable_famille';

        // Créer le nouvel utilisateur responsable ou conducteur
        $user = User::create([
            'nom' => $inscription->responsable_nom,
            'prenom' => $inscription->responsable_prenom,
            'email' => $inscription->responsable_email,
            'password' => Hash::make($tempPassword),
            'identifier' => $identifier,
            'telephone' => $inscription->responsable_tel,
            'telephone2' => $inscription->responsable_telephone2,
            'genre' => $inscription->data['responsable']['genre'] ?? 'M',
            'date_naissance' => $inscription->responsable_date_naissance,
            'profession' => $inscription->data['responsable']['profession'] ?? null,
            'relation' => $inscription->data['responsable']['relation'] ?? null,
            'fonction_id' => $inscription->data['responsable']['fonction_id'] ?? null,
            'family_id' => $family->id,
            'classe_id' => $family->classe_id,
            'role' => $role,
            'is_family_responsible' => $role === 'responsable_famille',
            'ville_id' => $family->ville_id,
            'must_change_password' => true,
        ]);

        // Mettre à jour la famille avec le responsable_id
        $family->update(['responsable_id' => $user->id]);

        // 📧 Envoyer les identifiants par email
        try {
            Mail::send(new SendCredentials($user, $identifier, $tempPassword));
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi des identifiants au responsable', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }

        Log::info('Utilisateur responsable créé', [
            'user_id' => $user->id,
            'email' => $user->email,
            'identifier' => $identifier,
            'family_id' => $family->id,
        ]);

        return $user;
    }

    /**
     * 3️⃣ Créer les utilisateurs pour les membres de la famille
     */
    private function createFamilyMembers(Inscription $inscription, Family $family, User $responsableUser): void
    {
        // Créer les membres pour les familles ET les conducteurs
        if (!in_array($inscription->type, ['famille', 'conducteur']) || !isset($inscription->data['membres'])) {
            return;
        }

        $membres = $inscription->data['membres'];

        foreach ($membres as $membre) {
            // Vérifier si ce membre existe déjà
            $existingMember = User::where('email', $membre['email'] ?? '')
                ->orWhere(function ($query) use ($membre) {
                    return $query->where('nom', $membre['nom'] ?? '')
                        ->where('prenom', $membre['prenom'] ?? '');
                })
                ->first();

            if ($existingMember && $existingMember->family_id !== $family->id) {
                // Lier au même utilisateur existant
                $existingMember->update(['family_id' => $family->id]);
                continue;
            }

            if ($existingMember) {
                continue; // Déjà dans la famille
            }

            // Générer l'identifiant pour le membre
            $identifier = User::generateIdentifier(
                $membre['nom'] ?? '',
                $membre['prenom'] ?? '',
                $membre['dateNaissance'] ?? null
            );

            // Mot de passe temporaire
            $tempPassword = '11111';

            // Créer le nouvel utilisateur membre
            $memberUser = User::create([
                'nom' => $membre['nom'] ?? '',
                'prenom' => $membre['prenom'] ?? '',
                'email' => $membre['email'] ?? null,
                'password' => Hash::make($tempPassword),
                'identifier' => $identifier,
                'telephone' => $membre['telephone'] ?? null,
                'genre' => $membre['genre'] ?? 'M',
                'date_naissance' => $membre['dateNaissance'] ?? null,
                'profession' => $membre['profession'] ?? null,
                'relation' => $membre['relation'] ?? null,
                'fonction_id' => $membre['fonction_id'] ?? null,
                'family_id' => $family->id,
                'classe_id' => $family->classe_id,
                'role' => 'membre_famille',
                'is_family_responsible' => false,
                'ville_id' => $family->ville_id,
                'must_change_password' => true,
            ]);

            // 📧 Envoyer les identifiants par email si email fourni
            if (!empty($membre['email'])) {
                try {
                    Mail::send(new SendCredentials($memberUser, $identifier, $tempPassword));
                } catch (\Exception $e) {
                    Log::error('Erreur lors de l\'envoi des identifiants au membre', [
                        'user_id' => $memberUser->id,
                        'email' => $memberUser->email,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Utilisateur membre créé', [
                'user_id' => $memberUser->id,
                'email' => $memberUser->email,
                'identifier' => $identifier,
                'family_id' => $family->id,
                'nom' => $memberUser->nom . ' ' . $memberUser->prenom,
            ]);
        }
    }

    /**
     * 4️⃣ Créer les sacrements/événements religieux d'un utilisateur
     *
     * Nouvelle structure: Un seul enregistrement UserSacrement par utilisateur
     * avec colonnes pour statut matrimonial civil et sacrements religieux
     */
    private function createUserSacrements(User $user, Inscription $inscription, string $type = 'responsable', ?array $memberData = null): void
    {
        // Préparer les données de base
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

        if ($type === 'responsable') {
            // Pour le responsable, construire les données à partir des colonnes responsable_*
            $personData = [
                'baptise' => $inscription->responsable_baptise ?? false,
                'dateBapteme' => $inscription->responsable_date_bapteme,
                'lieuBapteme' => $inscription->responsable_lieu_bapteme,
                'premiereCommunion' => $inscription->responsable_premiere_communion ?? false,
                'datePremiereCommunion' => $inscription->responsable_date_premiere_communion,
                'lieuPremiereCommunion' => $inscription->responsable_lieu_premiere_communion,
                'marieReligieusement' => $inscription->responsable_marie_religieusement ?? false,
                'dateMariageReligieux' => $inscription->responsable_date_mariage_religieux,
                'lieuMariageReligieux' => $inscription->responsable_lieu_mariage_religieux,
                'dateMariageCivil' => $inscription->responsable_date_mariage,
                'lieuMariageCivil' => $inscription->responsable_lieu_mariage,
                'dateDivorce' => $inscription->responsable_date_divorce,
                'lieuDivorce' => $inscription->responsable_lieu_divorce,
                'dateDeces' => $inscription->responsable_date_deces,
                'lieuDeces' => $inscription->responsable_lieu_deces,
                'statutMarital' => $inscription->responsable_statut_marital,
            ];
        } else {
            // Pour le membre, utiliser memberData du JSON
            $personData = $memberData ?? [];
        }

        if (!$personData || !is_array($personData)) {
            $personData = [];
        }

        // ========== SACREMENTS RELIGIEUX ==========

        // BAPTÊME
        if (($personData['baptise'] ?? false) || !empty($personData['dateBapteme'] ?? null)) {
            $sacrementRecord['baptise'] = true;
            $sacrementRecord['bapteme_date'] = $personData['dateBapteme'] ?? null;
            $sacrementRecord['bapteme_lieu'] = $personData['lieuBapteme'] ?? null;
        }

        // PREMIÈRE COMMUNION
        if (($personData['premiereCommunion'] ?? false) || !empty($personData['datePremiereCommunion'] ?? null)) {
            $sacrementRecord['premiere_communion'] = true;
            $sacrementRecord['premiere_communion_date'] = $personData['datePremiereCommunion'] ?? null;
            $sacrementRecord['premiere_communion_lieu'] = $personData['lieuPremiereCommunion'] ?? null;
        }

        // MARIAGE RELIGIEUX
        if (($personData['marieReligieusement'] ?? false) || !empty($personData['dateMariageReligieux'] ?? null)) {
            $sacrementRecord['marie_religieusement'] = true;
            $sacrementRecord['mariage_religieux_date'] = $personData['dateMariageReligieux'] ?? null;
            $sacrementRecord['mariage_religieux_lieu'] = $personData['lieuMariageReligieux'] ?? null;
        }

        // ========== STATUT MATRIMONIAL CIVIL ==========

        $statutMarital = $personData['statutMarital'] ?? null;

        // MARIAGE CIVIL
        if (!empty($personData['dateMariageCivil'] ?? null) || (strtolower($statutMarital ?? '') === 'marie')) {
            $sacrementRecord['est_marie'] = true;
            $sacrementRecord['mariage_civil_date'] = $personData['dateMariageCivil'] ?? null;
            $sacrementRecord['mariage_civil_lieu'] = $personData['lieuMariageCivil'] ?? null;
        }

        // DIVORCE
        if (!empty($personData['dateDivorce'] ?? null) || (strtolower($statutMarital ?? '') === 'divorce')) {
            $sacrementRecord['est_divorce'] = true;
            $sacrementRecord['divorce_date'] = $personData['dateDivorce'] ?? null;
            $sacrementRecord['divorce_lieu'] = $personData['lieuDivorce'] ?? null;
        }

        // DOT (Cadeau de mariage) - basé sur le statut marital ou données explicites
        // Note: pas de colonnes séparées pour dot dans la table responsable, juste le statut
        if ((strtolower($statutMarital ?? '') === 'dote') || !empty($personData['dateDot'] ?? null)) {
            $sacrementRecord['dot_effectue'] = true;
            $sacrementRecord['dot_date'] = $personData['dateDot'] ?? null;
            $sacrementRecord['dot_lieu'] = $personData['lieuDot'] ?? null;
        }

        // DÉCÈS (Veuvage)
        if (!empty($personData['dateDeces'] ?? null) || (strtolower($statutMarital ?? '') === 'veuf')) {
            $sacrementRecord['est_veuf'] = true;
            $sacrementRecord['deces_conjoint_date'] = $personData['dateDeces'] ?? null;
            $sacrementRecord['deces_conjoint_lieu'] = $personData['lieuDeces'] ?? null;
        }

        // Créer le record unique de sacrements pour cet utilisateur
        try {
            UserSacrement::create($sacrementRecord);
            Log::info('Sacrements créés', [
                'user_id' => $user->id,
                'user_name' => $user->nom . ' ' . $user->prenom,
                'type' => $type,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création des sacrements', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Rejeter une inscription
     * POST /admin/inscriptions/{id}/reject
     */
    public function reject(Request $request, $id)
    {
        try {
            // Valider l'entrée
            $validator = Validator::make(
                array_merge(['id' => $id], $request->all()),
                [
                    'id' => 'required|integer|exists:inscriptions,id',
                    'raison' => 'nullable|string|max:1000',
                ]
            );

            if ($validator->fails()) {
                return redirect()->back()
                    ->withErrors($validator)
                    ->with('error', 'Erreur de validation');
            }

            $inscription = Inscription::findOrFail($id);

            // Vérifier le statut (accepter les deux formats)
            if (!in_array($inscription->status, ['en_attente', 'pending'])) {
                return redirect()->back()
                    ->with('error', 'Inscription déjà traitée. Statut: ' . $inscription->status);
            }

            // Vérifier les permissions
            if (!Auth::user() || Auth::user()->role !== 'admin') {
                return redirect()->back()
                    ->with('error', 'Vous n\'avez pas la permission de rejeter cette inscription');
            }

            // Rejeter l'inscription avec les bonnes colonnes
            $inscription->update([
                'status' => 'rejete',
                'admin_id' => Auth::id(),
                'admin_approved_at' => now(),
                'raison_rejet' => $request->input('raison', 'Non spécifiée'),
            ]);

            Log::info('Inscription rejetée', [
                'inscription_id' => $inscription->id,
                'admin_id' => Auth::id(),
                'responsable' => $inscription->responsable_nom . ' ' . $inscription->responsable_prenom,
                'raison' => $inscription->raison_rejet,
            ]);

            return redirect()->route('admin.inscriptions')
                ->with('success', '✗ Inscription rejetée avec succès.');

        } catch (\Exception $e) {
            Log::error('Erreur lors du rejet', [
                'inscription_id' => $id ?? null,
                'admin_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()
                ->with('error', 'Erreur: ' . $e->getMessage());
        }
    }
}

