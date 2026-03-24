<?php

namespace App\Services;

use App\Models\Inscription;
use App\Models\Family;
use App\Models\User;
use App\Models\UserSacrement;
use App\Mail\SendCredentials;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class InscriptionApprovalService
{
    /**
     * Approuver une inscription avec optimisation de performance
     */
    public function approve(Inscription $inscription, User $approver, string $approverRole, ?string $reason = null): void
    {
        if (!in_array($approverRole, ['admin', 'conducteur'])) {
            throw new Exception('Le rôle d\'approbateur doit être admin ou conducteur');
        }

        DB::transaction(function () use ($inscription, $approver, $approverRole) {
            // Premier approbateur prioritaire: si déjà traité, on bloque.
            if (!in_array($inscription->status, ['en_attente', 'pending'])) {
                throw new Exception('Cette inscription a déjà été traitée.');
            }

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

            // Au lieu de refresh(), on réassigne les valeurs en mémoire
            foreach ($updateData as $key => $value) {
                $inscription->$key = $value;
            }

            // Le premier approbateur crée immédiatement les entités.
            $shouldCreate = in_array($inscription->type, ['famille', 'conducteur', 'membre_famille']);

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
    private function createEntitiesFromInscription(Inscription $inscription): void
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
        Log::info('🔍 createFamilyWithMembers started', [
            'inscription_id' => $inscription->id,
            'data_keys' => array_keys($data),
            'data_famille' => isset($data['famille']) ? 'EXISTS' : 'MISSING',
            'data_responsable' => isset($data['responsable']) ? 'EXISTS' : 'MISSING',
            'data_membres' => isset($data['membres']) ? 'EXISTS (' . count($data['membres']) . ' items)' : 'MISSING',
        ]);

        $familleData = $data['famille'] ?? [];
        $responsableData = $data['responsable'] ?? [];
        $membresData = $data['membres'] ?? [];

        Log::info('📋 Extracted data', [
            'membres_count' => count($membresData),
            'first_membre_keys' => array_keys($membresData[0] ?? []),
            'first_membre_photo_path' => $membresData[0]['photo_path'] ?? 'MISSING',
        ]);

        $responsableNom = $inscription->responsable_nom ?? ($responsableData['nom'] ?? null);
        $responsablePrenom = $inscription->responsable_prenom ?? ($responsableData['prenom'] ?? null);
        $responsableEmail = $this->resolveEmail(
            $inscription->responsable_email ?? ($responsableData['email'] ?? null),
            $responsablePrenom,
            $responsableNom,
            'responsable'
        );
        $responsableTel = $inscription->responsable_tel ?? ($responsableData['tel'] ?? null);
        $responsableTel2 = $inscription->responsable_telephone2 ?? ($responsableData['telephone2'] ?? null);
        $responsableDateNaissance = $inscription->responsable_date_naissance ?? ($responsableData['dateNaissance'] ?? null);
        $responsableGenre = $inscription->responsable_genre ?? ($responsableData['genre'] ?? null);
        $responsableProfession = $inscription->responsable_profession ?? ($responsableData['profession'] ?? null);
        $responsableEmploymentStatus = $this->resolveEmploymentStatus(
            $responsableData,
            $inscription->responsable_employment_status ?? null
        );
        $responsableProfessionDetail = $this->resolveProfessionDetail(
            $responsableData,
            $inscription->responsable_profession ?? null
        );
        if (empty($responsableProfession) && !empty($responsableProfessionDetail)) {
            $responsableProfession = $responsableProfessionDetail;
        }
        $classeId = $inscription->classe_id ?? ($familleData['classe_id'] ?? null);
        $villeId = $familleData['ville_id'] ?? ($familleData['ville'] ?? null);

        $family = Family::create([
            'nom' => $familleData['nom'] ?? trim(($responsableNom ?? '') . ' ' . ($responsablePrenom ?? '')),
            'classe_id' => $classeId,
            'adresse' => $familleData['adresse'] ?? null,
            'quartier' => $familleData['quartier'] ?? null,
            'ville_id' => $villeId,
        ]);

        // ✅ CORRECTION: Utiliser les colonnes responsable_* de la table, pas $inscription->nom/prenom/email
        $responsable = User::create([
            'nom' => $responsableNom,
            'prenom' => $responsablePrenom,
            'email' => $responsableEmail,
            'telephone' => $responsableTel,
            'telephone2' => $responsableTel2,
            'date_naissance' => $responsableDateNaissance,
            'genre' => $responsableGenre,
            'relation' => $responsableData['lienParente'] ?? ($responsableData['relation'] ?? null),
            'adresse' => $familleData['adresse'] ?? null,
            'profession' => $responsableProfession,
            'employment_status' => $responsableEmploymentStatus,
            'profession_detail' => $responsableProfessionDetail,
            'fonction_id' => $responsableData['fonction'] ?? null,
            'photo_path' => $inscription->photo_path,
            'profile_photo_url' => $inscription->profile_photo_url,
            'identifier' => User::generateIdentifier(
                (string) ($responsableNom ?? ''),
                (string) ($responsablePrenom ?? ''),
                $this->normalizeDateForIdentifier($responsableDateNaissance)
            ),
            'password' => bcrypt('11111'),
            'role' => 'responsable_famille',
            'family_id' => $family->id,
            'classe_id' => $classeId,
            'ville_id' => $family->ville_id,
            'must_change_password' => true,
        ]);

        // ✅ Créer les sacrements du responsable
        $this->createResponsableSacrements($responsable->id, $inscription);

        // ✅ Créer les membres de la famille
        if (!empty($membresData) && is_array($membresData)) {
            foreach ($membresData as $index => $membreData) {
                Log::info('👤 Creating family member', [
                    'index' => $index,
                    'name' => $membreData['prenom'] . ' ' . $membreData['nom'],
                    'photo_path_in_data' => $membreData['photo_path'] ?? 'MISSING',
                    'photo_url_in_data' => $membreData['photo_url'] ?? 'MISSING',
                ]);

                $member = User::create([
                    'nom' => $membreData['nom'] ?? null,
                    'prenom' => $membreData['prenom'] ?? null,
                    'email' => $this->resolveEmail(
                        $membreData['email'] ?? null,
                        $membreData['prenom'] ?? null,
                        $membreData['nom'] ?? null,
                        'membre'
                    ),
                    'telephone' => $membreData['telephone'] ?? null,
                    'date_naissance' => $membreData['dateNaissance'] ?? null,
                    'genre' => $membreData['genre'] ?? null,
                    'relation' => $membreData['relation'] ?? ($membreData['lienParente'] ?? null),
                    'adresse' => $familleData['adresse'] ?? null,
                    'profession' => $this->resolveProfessionDetail($membreData),
                    'employment_status' => $this->resolveEmploymentStatus($membreData),
                    'profession_detail' => $this->resolveProfessionDetail($membreData),
                    'fonction_id' => $membreData['fonction'] ?? null,
                    'photo_path' => $membreData['photo_path'] ?? ($membreData['photo'] ?? null),
                    'profile_photo_url' => $membreData['photo_url'] ?? null,
                    'identifier' => User::generateIdentifier($membreData['nom'] ?? '', $membreData['prenom'] ?? '', $membreData['dateNaissance'] ?? null),
                    'password' => bcrypt('11111'),
                    'role' => 'membre_famille',
                    'family_id' => $family->id,
                    'classe_id' => $classeId,
                    'ville_id' => $family->ville_id,
                    'must_change_password' => true,
                ]);

                Log::info('✅ Member created', [
                    'member_id' => $member->id,
                    'name' => $member->prenom . ' ' . $member->nom,
                    'photo_path_saved' => $member->photo_path ?? 'NULL',
                ]);

                // Créer les sacrements du membre
                $this->createUserSacrementsFromMember($member->id, $membreData);
            }
        }

        $family->update(['responsable_id' => $responsable->id]);
        $inscription->update(['user_id' => $responsable->id, 'family_id' => $family->id]);
    }

    /**
     * Créer un conducteur avec sa famille et ses membres
     * Le conducteur a le rôle 'conducteur' et tous les membres héritent de la famille du conducteur
     */
    private function createConductorWithFamily(Inscription $inscription, array $data): void
    {
        Log::info('🔍 createConductorWithFamily started', [
            'inscription_id' => $inscription->id,
            'data_keys' => array_keys($data),
            'data_membres' => isset($data['membres']) ? 'EXISTS (' . count($data['membres']) . ' items)' : 'MISSING',
        ]);

        $familleData = $data['famille'] ?? [];
        $responsableData = $data['responsable'] ?? [];
        $membresData = $data['membres'] ?? [];
        $responsableNom = $inscription->responsable_nom ?? ($responsableData['nom'] ?? null);
        $responsablePrenom = $inscription->responsable_prenom ?? ($responsableData['prenom'] ?? null);
        $responsableEmail = $this->resolveEmail(
            $inscription->responsable_email ?? ($responsableData['email'] ?? null),
            $responsablePrenom,
            $responsableNom,
            'conducteur'
        );
        $responsableTel = $inscription->responsable_tel ?? ($responsableData['tel'] ?? null);
        $responsableTel2 = $inscription->responsable_telephone2 ?? ($responsableData['telephone2'] ?? null);
        $responsableDateNaissance = $inscription->responsable_date_naissance ?? ($responsableData['dateNaissance'] ?? null);
        $responsableGenre = $inscription->responsable_genre ?? ($responsableData['genre'] ?? null);
        $responsableProfession = $inscription->responsable_profession ?? ($responsableData['profession'] ?? null);
        $responsableEmploymentStatus = $this->resolveEmploymentStatus(
            $responsableData,
            $inscription->responsable_employment_status ?? null
        );
        $responsableProfessionDetail = $this->resolveProfessionDetail(
            $responsableData,
            $inscription->responsable_profession ?? null
        );
        if (empty($responsableProfession) && !empty($responsableProfessionDetail)) {
            $responsableProfession = $responsableProfessionDetail;
        }
        $classeId = $inscription->classe_id ?? ($familleData['classe_id'] ?? null);
        $villeId = $familleData['ville_id'] ?? ($familleData['ville'] ?? null);

        // Créer la famille pour le conducteur
        $family = Family::create([
            'nom' => $familleData['nom'] ?? trim(($responsableNom ?? '') . ' ' . ($responsablePrenom ?? '')),
            'classe_id' => $classeId,
            'adresse' => $familleData['adresse'] ?? null,
            'quartier' => $familleData['quartier'] ?? null,
            'ville_id' => $villeId,
        ]);

        // Créer le conducteur avec le rôle 'conducteur'
        $conductor = User::create([
            'nom' => $responsableNom,
            'prenom' => $responsablePrenom,
            'email' => $responsableEmail,
            'telephone' => $responsableTel,
            'telephone2' => $responsableTel2,
            'date_naissance' => $responsableDateNaissance,
            'genre' => $responsableGenre,
            'relation' => $responsableData['lienParente'] ?? ($responsableData['relation'] ?? null),
            'adresse' => $familleData['adresse'] ?? null,
            'profession' => $responsableProfession,
            'employment_status' => $responsableEmploymentStatus,
            'profession_detail' => $responsableProfessionDetail,
            'fonction_id' => $responsableData['fonction'] ?? null,
            'photo_path' => $inscription->photo_path,
            'profile_photo_url' => $inscription->profile_photo_url,
            'identifier' => User::generateIdentifier(
                (string) ($responsableNom ?? ''),
                (string) ($responsablePrenom ?? ''),
                $this->normalizeDateForIdentifier($responsableDateNaissance)
            ),
            'password' => bcrypt('11111'),
            'role' => 'conducteur', // ✅ Le conducteur a le rôle 'conducteur'
            'family_id' => $family->id,
            'classe_id' => $classeId,
            'ville_id' => $family->ville_id,
            'must_change_password' => true,
        ]);

        // ✅ Créer les données de sacrements pour le conducteur
        $this->createResponsableSacrements($conductor->id, $inscription);

        // ✅ Créer les membres de la famille du conducteur
        if (!empty($membresData) && is_array($membresData)) {
            foreach ($membresData as $index => $membreData) {
                Log::info('👤 Creating member for conductor', [
                    'index' => $index,
                    'name' => ($membreData['prenom'] ?? '') . ' ' . ($membreData['nom'] ?? ''),
                    'photo_path_in_data' => $membreData['photo_path'] ?? 'MISSING',
                ]);

                $member = User::create([
                    'nom' => $membreData['nom'] ?? null,
                    'prenom' => $membreData['prenom'] ?? null,
                    'email' => $this->resolveEmail(
                        $membreData['email'] ?? null,
                        $membreData['prenom'] ?? null,
                        $membreData['nom'] ?? null,
                        'membre'
                    ),
                    'telephone' => $membreData['telephone'] ?? null,
                    'date_naissance' => $membreData['dateNaissance'] ?? null,
                    'genre' => $membreData['genre'] ?? null,
                    'relation' => $membreData['relation'] ?? ($membreData['lienParente'] ?? null),
                    'adresse' => $familleData['adresse'] ?? null,
                    'profession' => $this->resolveProfessionDetail($membreData),
                    'employment_status' => $this->resolveEmploymentStatus($membreData),
                    'profession_detail' => $this->resolveProfessionDetail($membreData),
                    'fonction_id' => $membreData['fonction'] ?? null,
                    'photo_path' => $membreData['photo_path'] ?? ($membreData['photo'] ?? null),
                    'profile_photo_url' => $membreData['photo_url'] ?? null,
                    'identifier' => User::generateIdentifier($membreData['nom'] ?? '', $membreData['prenom'] ?? '', $membreData['dateNaissance'] ?? null),
                    'password' => bcrypt('11111'),
                    'role' => 'membre_famille',
                    'family_id' => $family->id,
                    'classe_id' => $classeId,
                    'ville_id' => $family->ville_id,
                    'must_change_password' => true,
                ]);

                Log::info('✅ Member for conductor created', [
                    'member_id' => $member->id,
                    'name' => ($member->prenom ?? '') . ' ' . ($member->nom ?? ''),
                    'photo_path_saved' => $member->photo_path ?? 'NULL',
                ]);

                // Créer les sacrements du membre
                $this->createUserSacrementsFromMember($member->id, $membreData);
            }
        }

        // Mettre à jour la famille avec l'ID du conducteur comme responsable
        $family->update(['responsable_id' => $conductor->id]);
        $inscription->update(['user_id' => $conductor->id, 'family_id' => $family->id, 'status' => 'approuve']);

        // Envoyer les identifiants au conducteur
        if ($this->shouldSendCredentialsMail($conductor->email)) {
            try {
                Mail::to($conductor->email)->send(new SendCredentials($conductor, $conductor->identifier, '11111'));
                $conductor->credentials_sent_at = now();
                $conductor->save();
            } catch (\Exception $e) {
                Log::error('Erreur lors de l\'envoi des identifiants au conducteur', [
                    'user_id' => $conductor->id,
                    'email' => $conductor->email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Conducteur créé', [
            'inscription_id' => $inscription->id,
            'user_id' => $conductor->id,
            'family_id' => $family->id,
        ]);
    }

    /**
     * Créer les données de sacrements pour le conducteur
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
     * ✅ Créer les sacrements du responsable à partir des colonnes responsable_* de l'inscription
     */
    private function createResponsableSacrements(int $userId, Inscription $inscription): void
    {
        UserSacrement::create([
            'user_id' => $userId,
            // Statut matrimonial civil
            'est_marie' => in_array($inscription->responsable_statut_marital ?? '', ['marie', 'marié']),
            'mariage_civil_date' => $inscription->responsable_date_mariage,
            'mariage_civil_lieu' => $inscription->responsable_lieu_mariage,
            'est_veuf' => ($inscription->responsable_statut_marital ?? '') === 'veuf' ? true : false,
            'deces_conjoint_date' => $inscription->responsable_date_deces,
            'deces_conjoint_lieu' => $inscription->responsable_lieu_deces,
            'est_divorce' => ($inscription->responsable_statut_marital ?? '') === 'divorce' ? true : false,
            'divorce_date' => $inscription->responsable_date_divorce,
            'divorce_lieu' => $inscription->responsable_lieu_divorce,
            // Sacrements religieux
            'baptise' => $this->stringToBoolean($inscription->responsable_baptise ?? false),
            'bapteme_date' => $inscription->responsable_date_bapteme,
            'bapteme_lieu' => $inscription->responsable_lieu_bapteme,
            'premiere_communion' => $this->stringToBoolean($inscription->responsable_premiere_communion ?? false),
            'premiere_communion_date' => $inscription->responsable_date_premiere_communion,
            'premiere_communion_lieu' => $inscription->responsable_lieu_premiere_communion,
            'marie_religieusement' => $this->stringToBoolean($inscription->responsable_marie_religieusement ?? false),
            'mariage_religieux_date' => $inscription->responsable_date_mariage_religieux,
            'mariage_religieux_lieu' => $inscription->responsable_lieu_mariage_religieux,
        ]);
    }

    /**
     * Convertir une string booléenne en booléen
     */
    private function normalizeDateForIdentifier($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        return (string) $value;
    }

    private function stringToBoolean($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        return in_array(strtolower($value), ['true', '1', 'yes', 'on'], true);
    }

    private function resolveEmail(?string $email, ?string $prenom, ?string $nom, string $prefix): string
    {
        $candidate = trim((string) ($email ?? ''));
        if ($candidate !== '') {
            return $candidate;
        }
        throw new Exception("Email manquant pour {$prefix}. Veuillez compléter l'inscription avant approbation.");
    }

    private function shouldSendCredentialsMail(?string $email): bool
    {
        $value = trim((string) ($email ?? ''));
        if ($value === '') {
            return false;
        }

        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        return true;
    }

    private function resolveEmploymentStatus(array $personData, ?string $fallback = null): ?string
    {
        $value = $personData['employment_status'] ?? $fallback;
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $normalized = strtoupper(trim($value));
        $allowed = ['TRAVAILLEUR', 'RETRAITE', 'ETUDIANT', 'SANS_EMPLOI'];

        return in_array($normalized, $allowed, true) ? $normalized : null;
    }

    private function resolveProfessionDetail(array $personData, ?string $fallback = null): ?string
    {
        $value = $personData['profession_detail']
            ?? $personData['profession']
            ?? $fallback;

        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        return trim($value);
    }
}
