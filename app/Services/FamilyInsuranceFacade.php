<?php

namespace App\Services;

use App\Models\Family;
use App\Models\User;

use App\Models\Inscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\AccountCreated;
use App\Mail\SendCredentials;
use Exception;

/**
 * FamilyInsuranceFacade
 *
 * Service centralisé pour gérer les inscriptions de famille
 * Garantit l'intégrité des données et évite les duplications
 *
 * Responsabilités:
 * 1. Dédupliquer les families (email, classe, responsable)
 * 2. Créer/Mettre à jour Users avec classe correcte
 * 3. Gérer les FamilyMembers sans duplication
 * 4. Empêcher les changements non autorisés (family_id immutable)
 */
class FamilyInsuranceFacade
{
    private $transactionErrors = [];

    /**
     * Traiter une inscription de famille complète
     * Transaction ACID: tout réussit ou tout échoue
     */
    public function processFamily(Inscription $inscription): array
    {
        return DB::transaction(function () use ($inscription) {
            try {
                Log::info('FamilyInsuranceFacade: Processing inscription', [
                    'inscription_id' => $inscription->id,
                    'type' => $inscription->type,
                ]);

                // 1. Créer ou récupérer la Famille (DEDUP)
                $family = $this->ensureFamily($inscription);
                if (!$family) {
                    throw new Exception('Failed to create or find family');
                }

                // 2. Créer ou mettre à jour le responsable
                $responsable = $this->ensureResponsable($inscription, $family);
                if (!$responsable) {
                    throw new Exception('Failed to create or find responsable');
                }

                // 3. Mettre à jour la famille avec responsable
                $family->update(['responsable_id' => $responsable->id]);

                // 4. Créer/Mettre à jour les Users pour chaque membre
                $createdUsers = [];
                $createdUsers[] = $responsable; // Le responsable est aussi un User

                foreach ($membersData as $memberData) {
                    $memberUser = $this->ensureMemberUser($family, $memberData);
                    if ($memberUser) {
                        $createdUsers[] = $memberUser;
                    }
                }

                Log::info('FamilyInsuranceFacade: Inscription processed successfully', [
                    'inscription_id' => $inscription->id,
                    'family_id' => $family->id,
                    'members_created' => count($createdUsers),
                ]);

                return [
                    'success' => true,
                    'family' => $family,
                    'responsable' => $responsable,
                    'users' => $createdUsers,
                ];
            } catch (Exception $e) {
                Log::error('FamilyInsuranceFacade: Error processing inscription', [
                    'inscription_id' => $inscription->id,
                    'error' => $e->getMessage(),
                ]);

                return [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        });
    }

    /**
     * Créer ou récupérer une Famille (avec déduplication)
     *
     * Règles de dédup:
     * - Chercher par (email, classe_id) → Famille UNIQUE
     * - Si pas trouvée → Créer nouvelle
     * - Si trouvée mais mergedinto_id → Suivre la chaîne
     */
    private function ensureFamily(Inscription $inscription): ?Family
    {
        $email = $inscription->email;
        $classeId = $inscription->classe_id;
        $familleData = $inscription->data['famille'] ?? [];

        // Chercher une famille existante avec ce combinaison (email, classe)
        $existingFamily = Family::where('email', $email)
            ->where('classe_id', $classeId)
            ->whereNull('deleted_at')
            ->first();

        if ($existingFamily) {
            // Famille trouvée → la retourner
            return $existingFamily;
        }

        // Créer une nouvelle famille
        $familyName = $familleData['nom'] ?? $inscription->nom . ' ' . $inscription->prenom;

        try {
            $family = Family::create([
                'nom' => $familyName,
                'classe_id' => $classeId,
                'adresse' => $familleData['adresse'] ?? $inscription->adresse,
                'quartier' => $familleData['quartier'] ?? null,
                'ville_id' => $inscription->ville_id,
                'telephone' => $inscription->telephone,
                'telephone2' => $inscription->telephone2,
                'email' => $email,
                'email_hash' => hash('sha256', $email . $classeId), // Pour dedup future
            ]);

            return $family;
        } catch (Exception $e) {
            Log::error('Failed to create family', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Créer ou mettre à jour le responsable de famille
     *
     * Important: Le responsable partage la classe_id de la famille
     * (tous les membres d'une famille ont la même classe méthodiste)
     */
    private function ensureResponsable(Inscription $inscription, Family $family): ?User
    {
        $email = $inscription->email;
        $responsableData = $inscription->data['responsable'] ?? [];

        // Chercher si l'utilisateur existe déjà
        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            // Vérifier qu'il n'essaie pas de changer de famille
            if ($existingUser->family_id && $existingUser->family_id !== $family->id) {
                Log::warning('User trying to change family', [
                    'user_id' => $existingUser->id,
                    'old_family_id' => $existingUser->family_id,
                    'new_family_id' => $family->id,
                ]);
                throw new Exception('Cannot change family_id after user creation!');
            }

            // Mettre à jour les infos du responsable
            $existingUser->update([
                'nom' => $inscription->nom,
                'prenom' => $inscription->prenom,
                'telephone' => $inscription->telephone,
                'telephone2' => $responsableData['telephone2'] ?? null,
                'genre' => $inscription->genre,
                'date_naissance' => $inscription->date_naissance,
                'fonction_professionnelle' => $responsableData['profession'] ?? null,
                'family_id' => $family->id,
                'is_family_responsible' => true,
                'classe_id' => $family->classe_id, // ✅ PARTAGÉE avec la famille
                'role' => 'responsable_famille',
            ]);

            return $existingUser;
        }

        // Créer un nouvel utilisateur
        $identifier = User::generateIdentifier(
            $inscription->nom,
            $inscription->prenom,
            $inscription->date_naissance?->format('Y-m-d')
        );

        try {
            $user = User::create([
                'nom' => $inscription->nom,
                'prenom' => $inscription->prenom,
                'email' => $email,
                'identifier' => $identifier,
                'password' => Hash::make('11111'), // Mot de passe provisoire
                'role' => 'responsable_famille',
                'is_family_responsible' => true,
                'family_id' => $family->id,
                'family_id_locked' => true, // Empêcher les changements
                'telephone' => $inscription->telephone,
                'telephone2' => $responsableData['telephone2'] ?? null,
                'genre' => $inscription->genre,
                'date_naissance' => $inscription->date_naissance,
                'fonction_professionnelle' => $responsableData['profession'] ?? null,
                'classe_id' => $family->classe_id, // ✅ PARTAGÉE avec la famille
                'ville_id' => $inscription->ville_id,
                'must_change_password' => true,
            ]);

            // Envoyer les identifiants
            $this->sendCredentials($user, '11111');

            return $user;
        } catch (Exception $e) {
            Log::error('Failed to create responsable', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Créer ou mettre à jour un User membre de famille
     * TOUS les membres d'une famille partagent la même classe_id
     */
    private function ensureMemberUser(Family $family, array $memberData): ?User
    {
        $email = $memberData['email'] ?? null;
        if (!$email) {
            Log::warning('Member data has no email', ['member' => $memberData]);
            return null;
        }

        // Chercher si l'utilisateur existe
        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            // Vérifier qu'il ne change pas de famille
            if ($existingUser->family_id && $existingUser->family_id !== $family->id) {
                Log::warning('Member trying to change family', [
                    'user_id' => $existingUser->id,
                    'old_family' => $existingUser->family_id,
                    'new_family' => $family->id,
                ]);
                throw new Exception('Member cannot change family!');
            }

            return $existingUser;
        }

        // Créer un nouvel utilisateur membre
        $identifier = User::generateIdentifier(
            $memberData['nom'] ?? '',
            $memberData['prenom'] ?? '',
            $memberData['dateNaissance'] ?? null
        );

        $plainPassword = $this->generatePassword();

        try {
            $user = User::create([
                'nom' => $memberData['nom'] ?? null,
                'prenom' => $memberData['prenom'] ?? null,
                'email' => $email,
                'identifier' => $identifier,
                'password' => Hash::make($plainPassword),
                'role' => 'membre_famille',
                'family_id' => $family->id,
                'family_id_locked' => true,
                'telephone' => $memberData['telephone'] ?? null,
                'genre' => $memberData['genre'] ?? null,
                'date_naissance' => $memberData['dateNaissance'] ?? null,
                'classe_id' => $family->classe_id, // ✅ PARTAGÉE avec la famille
                'must_change_password' => true,
            ]);

            // Envoyer les identifiants
            $this->sendCredentials($user, $plainPassword);

            return $user;
        } catch (Exception $e) {
            Log::error('Failed to create member user', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Envoyer les identifiants à l'utilisateur
     */
    private function sendCredentials(User $user, string $plainPassword): void
    {
        try {
            if ($user->email) {
                Mail::to($user->email)->queue(new AccountCreated($user, $plainPassword));
            }
        } catch (Exception $e) {
            Log::error('Failed to send credentials', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Générer un mot de passe temporaire
     */
    private function generatePassword(): string
    {
        return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

}
