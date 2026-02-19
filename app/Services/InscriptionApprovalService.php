<?php

namespace App\Services;

use App\Models\Inscription;
use App\Models\Family;
use App\Models\User;
use App\Models\UserSacrement;
use App\Mail\SendCredentials;
use App\Traits\GeneratesIdentifier;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class InscriptionApprovalService
{
    use GeneratesIdentifier;

    /**
     * Approuver une inscription avec optimisation de performance
     */
    public function approve(Inscription $inscription, User $approver, string $approverRole, ?string $reason = null): void
    {
        if (!in_array($approverRole, ['admin', 'conducteur'])) {
            throw new Exception('Le rôle d\'approbateur doit être admin ou conducteur');
        }
        DB::transaction(function () use ($inscription, $approver, $approverRole) {
            $updateData = [];

            if ($approverRole === 'admin') {
                $updateData = [
                    'admin_id' => $approver->id,
                    'admin_approved_at' => now(),
                ];
            } else {
                $updateData = [
                    'conducteur_id' => $approver->id,
                    'conducteur_approved_at' => now(),
                ];
            }

            $inscription->update($updateData);

            // ✅ CORRECTION: Rafraîchir le modèle depuis la base de données
            // pour s'assurer que les valeurs de admin_id et conducteur_id sont correctes
            $inscription->refresh();

            $shouldCreate = false;

            if (in_array($inscription->type, ['famille', 'conducteur', 'membre_famille'])) {
                // Créer les entités dès que admin OU conducteur approuve
                if ($inscription->admin_id || $inscription->conducteur_id) {
                    $shouldCreate = true;
                }
            }

            if ($shouldCreate) {
                $this->createEntitiesFromInscription($inscription);
                $inscription->update(['status' => 'approuve']);
            }
        });
    }

    /**
     * Rejeter une inscription
     */
    public function reject(Inscription $inscription, User $rejector, ?string $reason = null): void
    {
        $inscription->update([
            'status' => 'rejete',
            'deleted_by' => $rejector->id,
            'deleted_reason' => $reason ?? 'Inscription rejetée',
        ]);
    }

    /**
     * Créer les entités permanentes
     */
    public function createEntitiesFromInscription(Inscription $inscription): void
    {
        $data = $inscription->data ?? [];

        switch ($inscription->type) {
            case 'famille':
                $this->createFamilyWithMembers($inscription, $data);
                break;
            case 'conducteur':
                // Pour le conducteur: créer une famille avec le conducteur et ses membres
                $this->createConductorWithFamily($inscription, $data);
                break;
        }
    }

    /**
     * Créer une famille complète
     */
    private function createFamilyWithMembers(Inscription $inscription, array $data): void
    {
        // Vérifier si la famille a déjà été créée
        if ($inscription->family_id) {
            return;
        }

        $familleData = $data['famille'] ?? [];
        $responsableData = $data['responsable'] ?? [];
        $membresData = $data['membres'] ?? [];

        // Récupérer la classe_id depuis le JSON ou depuis le champ direct
        $classeId = $familleData['classe_id'] ?? $inscription->classe_id;

        if (!$classeId) {
            Log::warning('classe_id manquante, utilisation de null', [
                'inscription_id' => $inscription->id,
                'familleData' => $familleData,
                'inscription_classe_id' => $inscription->classe_id
            ]);
        }

        // Check if family already exists to avoid duplicates
        $familyName = $familleData['nom'] ?? $inscription->nom . ' ' . $inscription->prenom;
        $existingFamily = Family::where('nom', $familyName)->where('classe_id', $classeId)->first();
        if ($existingFamily) {
            $inscription->update(['family_id' => $existingFamily->id]);
            return;
        }

        $family = Family::create([
            'nom' => $familyName,
            'classe_id' => $classeId,
            'adresse' => $familleData['adresse'] ?? null,
            'quartier' => $familleData['quartier'] ?? null,
            'email' => $inscription->responsable_email ?? $inscription->email ?? null,
            'telephone' => $familleData['telephone'] ?? $inscription->responsable_tel ?? null,
            'telephone2' => $familleData['telephone2'] ?? $inscription->responsable_telephone2 ?? null,
            'ville_id' => $familleData['ville_id'] ?? $familleData['ville'] ?? $inscription->ville_id ?? null,
        ]);

        // Check if responsable already exists
        $identifier = self::generateIdentifier(
            $inscription->nom ?? $responsableData['nom'] ?? 'Unknown',
            $inscription->prenom ?? $responsableData['prenom'] ?? 'Unknown',
            $inscription->date_naissance?->format('Y-m-d') ?? $responsableData['date_naissance'] ?? null
        );
        $existingUser = User::where('identifier', $identifier)->first();
        if ($existingUser) {
            $family->update(['responsable_id' => $existingUser->id]);
            $inscription->update(['user_id' => $existingUser->id, 'family_id' => $family->id]);
            return;
        }

        $responsable = User::create([
            'nom' => $inscription->responsable_nom ?? $responsableData['nom'] ?? $inscription->nom,
            'prenom' => $inscription->responsable_prenom ?? $responsableData['prenom'] ?? $inscription->prenom,
            'email' => $inscription->responsable_email ?? $inscription->email,
            'telephone' => $inscription->responsable_tel ?? $inscription->telephone,
            'telephone2' => $inscription->responsable_telephone2 ?? null,
            'date_naissance' => $inscription->responsable_date_naissance ?? $inscription->date_naissance,
            'genre' => $inscription->responsable_genre ?? $inscription->genre,
            'profession' => $inscription->responsable_profession ?? null,
            'photo_path' => $inscription->photo_path,
            'identifier' => $identifier,
            'password' => bcrypt('11111'),
            'role' => 'responsable_famille',
            'family_id' => $family->id,
            'classe_id' => $classeId,
            'ville_id' => $family->ville_id,
            'statut' => 'actif',
            'must_change_password' => true,
        ]);

        $family->update(['responsable_id' => $responsable->id]);
        $inscription->update(['user_id' => $responsable->id, 'family_id' => $family->id]);

        // Créer les données de sacrements pour le responsable
        $this->createUserSacrementsFromInscriptionResponsable($responsable->id, $inscription);

        // Créer les membres de la famille
        if (!empty($membresData)) {
            foreach ($membresData as $memberData) {
                // Déterminer le rôle basé sur la relation
                $role = $this->determineRoleFromRelation($memberData['relation'] ?? 'Autre');

                // Check if member already exists
                $identifier = self::generateIdentifier(
                    $memberData['nom'] ?? 'Unknown',
                    $memberData['prenom'] ?? 'Unknown',
                    $memberData['dateNaissance'] ?? $memberData['date_naissance'] ?? null
                );
                $existingMember = User::where('identifier', $identifier)->first();
                if ($existingMember) {
                    continue;
                }

                // Créer l'utilisateur membre
                $member = User::create([
                    'nom' => $memberData['nom'] ?? '',
                    'prenom' => $memberData['prenom'] ?? '',
                    'email' => $memberData['email'] ?? null,
                    'telephone' => $memberData['telephone'] ?? null,
                    'date_naissance' => $memberData['dateNaissance'] ?? $memberData['date_naissance'] ?? null,
                    'genre' => $memberData['genre'] ?? null,
                    'profession' => $memberData['profession'] ?? $memberData['fonction'] ?? null,
                    'relation' => $memberData['relation'] ?? $memberData['lienParente'] ?? null,
                    'photo_path' => $memberData['photo_path'] ?? null,
                    'identifier' => $identifier,
                    'password' => bcrypt('11111'),
                    'role' => $role,
                    'family_id' => $family->id,
                    'classe_id' => $classeId,
                    'ville_id' => $family->ville_id,
                    'statut' => 'actif',
                    'must_change_password' => false,
                ]);

                // Créer les données de sacrements pour le membre
                $this->createUserSacrementsFromMember($member->id, $memberData);
            }
        }
    }

    /**
     * Créer un conducteur avec sa famille et ses membres
     * Le conducteur a le rôle 'conducteur' et tous les membres héritent de la famille du conducteur
     */
    private function createConductorWithFamily(Inscription $inscription, array $data): void
    {
        // Vérifier si la famille a déjà été créée
        if ($inscription->family_id) {
            return;
        }

        $familleData = $data['famille'] ?? [];
        $responsableData = $data['responsable'] ?? [];
        $membresData = $data['membres'] ?? [];

        // Récupérer la classe_id depuis le JSON ou depuis le champ direct
        $classeId = $familleData['classe_id'] ?? $inscription->classe_id;

        if (!$classeId) {
            Log::warning('classe_id manquante pour conducteur, utilisation de null', [
                'inscription_id' => $inscription->id,
                'familleData' => $familleData,
                'inscription_classe_id' => $inscription->classe_id
            ]);
        }

        // Check if family already exists
        $familyName = $familleData['nom'] ?? $inscription->responsable_nom . ' ' . $inscription->responsable_prenom;
        $existingFamily = Family::where('nom', $familyName)->where('classe_id', $classeId)->first();
        if ($existingFamily) {
            $inscription->update(['family_id' => $existingFamily->id]);
            return;
        }

        // Créer la famille pour le conducteur
        $family = Family::create([
            'nom' => $familyName,
            'classe_id' => $classeId,
            'adresse' => $familleData['adresse'] ?? null,
            'quartier' => $familleData['quartier'] ?? null,
            'email' => $inscription->responsable_email ?? null,
            'telephone' => $familleData['telephone'] ?? $inscription->responsable_tel ?? null,
            'telephone2' => $familleData['telephone2'] ?? $inscription->responsable_telephone2 ?? null,
            'ville_id' => $familleData['ville_id'] ?? $familleData['ville'] ?? $inscription->ville_id ?? null,
        ]);

        // Check if conductor already exists
        $identifier = self::generateIdentifier(
            $inscription->responsable_nom ?? 'Unknown',
            $inscription->responsable_prenom ?? 'Unknown',
            $inscription->responsable_date_naissance?->format('Y-m-d') ?? null
        );
        $existingUser = User::where('identifier', $identifier)->first();
        if ($existingUser) {
            $family->update(['responsable_id' => $existingUser->id]);
            $inscription->update(['user_id' => $existingUser->id, 'family_id' => $family->id, 'status' => 'approuve']);
            return;
        }

        // Créer le conducteur avec le rôle 'conducteur'
        $conductor = User::create([
            'nom' => $inscription->responsable_nom,
            'prenom' => $inscription->responsable_prenom,
            'email' => $inscription->responsable_email,
            'telephone' => $inscription->responsable_tel,
            'telephone2' => $inscription->responsable_telephone2,
            'date_naissance' => $inscription->responsable_date_naissance,
            'genre' => $inscription->responsable_genre,
            'profession' => $inscription->responsable_profession ?? null,
            'photo_path' => $inscription->photo_path,
            'identifier' => $identifier,
            'password' => bcrypt('11111'),
            'role' => 'conducteur',
            'family_id' => $family->id,
            'classe_id' => $classeId,
            'ville_id' => $family->ville_id,
            'statut' => 'actif',
            'must_change_password' => true,
        ]);

        // Créer les données de sacrements pour le conducteur dans users_sacraments
        $this->createUserSacrementsFromInscriptionResponsable($conductor->id, $inscription);

        // Mettre à jour la famille avec l'ID du conducteur comme responsable
        $family->update(['responsable_id' => $conductor->id]);
        $inscription->update(['user_id' => $conductor->id, 'family_id' => $family->id, 'status' => 'approuve']);

        // Créer les membres de la famille du conducteur
        if (!empty($membresData)) {
            foreach ($membresData as $memberData) {
                // Déterminer le rôle basé sur la relation
                $role = $this->determineRoleFromRelation($memberData['relation'] ?? 'Autre');

                // Check if member already exists
                $identifier = self::generateIdentifier(
                    $memberData['nom'] ?? 'Unknown',
                    $memberData['prenom'] ?? 'Unknown',
                    $memberData['dateNaissance'] ?? $memberData['date_naissance'] ?? null
                );
                $existingMember = User::where('identifier', $identifier)->first();
                if ($existingMember) {
                    continue;
                }

                // Créer l'utilisateur membre
                $member = User::create([
                    'nom' => $memberData['nom'] ?? '',
                    'prenom' => $memberData['prenom'] ?? '',
                    'email' => $memberData['email'] ?? null,
                    'telephone' => $memberData['telephone'] ?? null,
                    'date_naissance' => $memberData['dateNaissance'] ?? $memberData['date_naissance'] ?? null,
                    'genre' => $memberData['genre'] ?? null,
                    'profession' => $memberData['profession'] ?? $memberData['fonction'] ?? null,
                    'relation' => $memberData['relation'] ?? $memberData['lienParente'] ?? null,
                    'photo_path' => $memberData['photo_path'] ?? null,
                    'identifier' => $identifier,
                    'password' => bcrypt('11111'),
                    'role' => $role,
                    'family_id' => $family->id,
                    'classe_id' => $classeId,
                    'ville_id' => $family->ville_id,
                    'statut' => 'actif',
                    'must_change_password' => false,
                ]);

                // Créer les données de sacrements pour le membre
                $this->createUserSacrementsFromMember($member->id, $memberData);
            }
        }

        // Envoyer les identifiants au conducteur
        try {
            Mail::send(new SendCredentials($conductor, $conductor->identifier, '11111'));
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi des identifiants au conducteur', [
                'user_id' => $conductor->id,
                'email' => $conductor->email,
                'error' => $e->getMessage(),
            ]);
        }

        Log::info('Conducteur créé', [
            'inscription_id' => $inscription->id,
            'user_id' => $conductor->id,
            'family_id' => $family->id,
        ]);
    }

    /**     * Créer les données de sacrements pour un responsable/conducteur à partir des colonnes de l'inscription
     */
    private function createUserSacrementsFromInscriptionResponsable(int $userId, Inscription $inscription): void
    {
        UserSacrement::create([
            'user_id' => $userId,
            // Statut matrimonial civil
            'est_marie' => in_array($inscription->responsable_statut_marital ?? '', ['marie', 'marié']),
            'mariage_civil_date' => $inscription->responsable_date_mariage ?? null,
            'mariage_civil_lieu' => $inscription->responsable_lieu_mariage ?? null,
            'est_veuf' => ($inscription->responsable_statut_marital ?? '') === 'veuf' ? true : false,
            'deces_conjoint_date' => $inscription->responsable_date_deces ?? null,
            'deces_conjoint_lieu' => $inscription->responsable_lieu_deces ?? null,
            'est_divorce' => ($inscription->responsable_statut_marital ?? '') === 'divorce' ? true : false,
            'divorce_date' => $inscription->responsable_date_divorce ?? null,
            'divorce_lieu' => $inscription->responsable_lieu_divorce ?? null,
            // Sacrements religieux
            'baptise' => $this->stringToBoolean($inscription->responsable_baptise ?? false),
            'bapteme_date' => $inscription->responsable_date_bapteme ?? null,
            'bapteme_lieu' => $inscription->responsable_lieu_bapteme ?? null,
            'premiere_communion' => $this->stringToBoolean($inscription->responsable_premiere_communion ?? false),
            'premiere_communion_date' => $inscription->responsable_date_premiere_communion ?? null,
            'premiere_communion_lieu' => $inscription->responsable_lieu_premiere_communion ?? null,
            'marie_religieusement' => $this->stringToBoolean($inscription->responsable_marie_religieusement ?? false),
            'mariage_religieux_date' => $inscription->responsable_date_mariage_religieux ?? null,
            'mariage_religieux_lieu' => $inscription->responsable_lieu_mariage_religieux ?? null,
        ]);
    }

    /**     * Créer les données de sacrements pour le conducteur
     */
    private function createUserSacrementsFromResponsable(int $userId, array $responsableData): void
    {
        UserSacrement::create([
            'user_id' => $userId,
            // Statut matrimonial civil
            'est_marie' => in_array($responsableData['statutMarital'] ?? '', ['marie', 'marié']),
            'mariage_civil_date' => $responsableData['dateMariage'] ?? null,
            'mariage_civil_lieu' => $responsableData['lieuMariage'] ?? null,
            'est_veuf' => $responsableData['statutMarital'] === 'veuf' ? true : false,
            'deces_conjoint_date' => $responsableData['dateDeces'] ?? null,
            'deces_conjoint_lieu' => $responsableData['lieuDeces'] ?? null,
            'est_divorce' => $responsableData['statutMarital'] === 'divorce' ? true : false,
            'divorce_date' => $responsableData['dateDivorce'] ?? null,
            'divorce_lieu' => $responsableData['lieuDivorce'] ?? null,
            // Sacrements religieux
            'baptise' => $this->stringToBoolean($responsableData['baptise'] ?? false),
            'bapteme_date' => $responsableData['dateBapteme'] ?? null,
            'bapteme_lieu' => $responsableData['lieuBapteme'] ?? null,
            'premiere_communion' => $this->stringToBoolean($responsableData['premiereCommunion'] ?? false),
            'premiere_communion_date' => $responsableData['datePremiereCommunion'] ?? null,
            'premiere_communion_lieu' => $responsableData['lieuPremiereCommunion'] ?? null,
            'marie_religieusement' => $this->stringToBoolean($responsableData['marieReligieusement'] ?? false),
            'mariage_religieux_date' => $responsableData['dateMariageReligieux'] ?? null,
            'mariage_religieux_lieu' => $responsableData['lieuMariageReligieux'] ?? null,
        ]);
    }

    /**
     * Créer les données de sacrements pour un membre de famille
     */
    private function createUserSacrementsFromMember(int $userId, array $memberData): void
    {
        // Si les sacrements sont groupés dans une clé sacrements, les utiliser
        if (isset($memberData['sacrements']) && is_array($memberData['sacrements'])) {
            $sacrementData = $memberData['sacrements'];
        } else {
            $sacrementData = $memberData;
        }

        UserSacrement::create([
            'user_id' => $userId,
            // Statut matrimonial civil
            'est_marie' => in_array($sacrementData['statutMarital'] ?? $sacrementData['statut_marital'] ?? '', ['marie', 'marié']),
            'mariage_civil_date' => $sacrementData['dateMariage'] ?? $sacrementData['date_mariage'] ?? null,
            'mariage_civil_lieu' => $sacrementData['lieuMariage'] ?? $sacrementData['lieu_mariage'] ?? null,
            'est_veuf' => ($sacrementData['statutMarital'] ?? $sacrementData['statut_marital'] ?? '') === 'veuf' ? true : false,
            'deces_conjoint_date' => $sacrementData['dateDeces'] ?? $sacrementData['deces_conjoint_date'] ?? null,
            'deces_conjoint_lieu' => $sacrementData['lieuDeces'] ?? $sacrementData['deces_conjoint_lieu'] ?? null,
            'est_divorce' => ($sacrementData['statutMarital'] ?? $sacrementData['statut_marital'] ?? '') === 'divorce' ? true : false,
            'divorce_date' => $sacrementData['dateDivorce'] ?? $sacrementData['divorce_date'] ?? null,
            'divorce_lieu' => $sacrementData['lieuDivorce'] ?? $sacrementData['divorce_lieu'] ?? null,
            // Dot (Dot effectué)
            'dot_effectue' => $this->stringToBoolean($sacrementData['dote'] ?? $sacrementData['dot_effectue'] ?? false),
            'dot_date' => $sacrementData['dateDote'] ?? $sacrementData['dot_date'] ?? null,
            'dot_lieu' => $sacrementData['lieuDote'] ?? $sacrementData['dot_lieu'] ?? null,
            // Sacrements religieux
            'baptise' => $this->stringToBoolean($sacrementData['baptise'] ?? false),
            'bapteme_date' => $sacrementData['dateBapteme'] ?? $sacrementData['bapteme_date'] ?? null,
            'bapteme_lieu' => $sacrementData['lieuBapteme'] ?? $sacrementData['bapteme_lieu'] ?? null,
            'premiere_communion' => $this->stringToBoolean($sacrementData['premiereCommunion'] ?? $sacrementData['premiere_communion'] ?? false),
            'premiere_communion_date' => $sacrementData['datePremiereCommunion'] ?? $sacrementData['premiere_communion_date'] ?? null,
            'premiere_communion_lieu' => $sacrementData['lieuPremiereCommunion'] ?? $sacrementData['premiere_communion_lieu'] ?? null,
            'marie_religieusement' => $this->stringToBoolean($sacrementData['marieReligieusement'] ?? $sacrementData['marie_religieusement'] ?? false),
            'mariage_religieux_date' => $sacrementData['dateMariageReligieux'] ?? $sacrementData['mariage_religieux_date'] ?? null,
            'mariage_religieux_lieu' => $sacrementData['lieuMariageReligieux'] ?? $sacrementData['mariage_religieux_lieu'] ?? null,
        ]);
    }

    /**
     * Déterminer le rôle d'un membre basé sur sa relation familiale
     */
    private function determineRoleFromRelation(?string $relation): string
    {
        if (!$relation) {
            return 'membre_famille';
        }

        $relation = strtolower(trim($relation));

        $roles = [
            'épouse' => 'membre_famille',
            'spouse' => 'membre_famille',
            'wife' => 'membre_famille',
            'mari' => 'membre_famille',
            'husband' => 'membre_famille',
            'fils' => 'membre_famille',
            'son' => 'membre_famille',
            'fille' => 'membre_famille',
            'daughter' => 'membre_famille',
            'frère' => 'membre_famille',
            'brother' => 'membre_famille',
            'sœur' => 'membre_famille',
            'sister' => 'membre_famille',
            'père' => 'membre_famille',
            'father' => 'membre_famille',
            'mère' => 'membre_famille',
            'mother' => 'membre_famille',
            'grand-parent' => 'membre_famille',
            'grandparent' => 'membre_famille',
            'cousin' => 'membre_famille',
            'tante' => 'membre_famille',
            'aunt' => 'membre_famille',
            'oncle' => 'membre_famille',
            'uncle' => 'membre_famille',
        ];

        return $roles[$relation] ?? 'membre_famille';
    }

    /**
     * Convertir une string booléenne en booléen
     */
    private function stringToBoolean($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        return in_array(strtolower($value), ['true', '1', 'yes', 'on'], true);
    }
}
