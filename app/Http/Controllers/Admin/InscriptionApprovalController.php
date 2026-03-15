<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inscription;
use App\Models\User;
use App\Models\Family;
use App\Models\UserSacrement;
use App\Mail\SendCredentials;
use App\Mail\ResponsibleCredentials;
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
     * 1. CrÃ©er Family avec donnÃ©es de inscription.data['famille'] + responsable_*
     * 2. CrÃ©er User pour le responsable
     * 3. CrÃ©er User pour chaque membre
     * 4. CrÃ©er UserSacrement pour responsable et membres (depuis les champs boolÃ©ens + dates)
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
                    ->with('error', 'Inscription non trouvÃ©e');
            }

            // RÃ©cupÃ©rer l'inscription
            $inscription = Inscription::findOrFail($id);

            // VÃ©rifier le statut (accepter les deux formats)
            if (!in_array($inscription->status, ['en_attente', 'pending'])) {
                return redirect()->back()
                    ->with('error', 'Inscription dÃ©jÃ  traitÃ©e. Statut: ' . $inscription->status);
            }

            // VÃ©rifier les permissions
            if (!Auth::user() || Auth::user()->role !== 'admin') {
                return redirect()->back()
                    ->with('error', 'Vous n\'avez pas la permission d\'approuver cette inscription');
            }

            // ExÃ©cuter tout dans une transaction
            DB::transaction(function () use ($inscription) {
                // 1ï¸âƒ£ CRÃ‰ER LA FAMILLE
                $family = $this->createFamily($inscription);

                // 2ï¸âƒ£ CRÃ‰ER L'UTILISATEUR RESPONSABLE
                $responsableUser = $this->createResponsableUser($inscription, $family);

                // 3ï¸âƒ£ CRÃ‰ER LES UTILISATEURS POUR LES MEMBRES
                $memberCredentials = $this->createFamilyMembers($inscription, $family, $responsableUser);

                // 4ï¸âƒ£ CRÃ‰ER LES SACREMENTS DU RESPONSABLE
                $this->createUserSacrements($responsableUser, $inscription, 'responsable');

                // 5ï¸âƒ£ CRÃ‰ER LES SACREMENTS DES MEMBRES
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

                // 6ï¸âƒ£ METTRE Ã€ JOUR LE STATUT DE L'INSCRIPTION
                $inscription->update([
                    'status' => 'approuve',
                    'admin_id' => Auth::id(),
                    'admin_approved_at' => now(),
                ]);

                if (!empty($responsableUser->email)) {
                    try {
                        if (!empty($memberCredentials)) {
                            Mail::to($responsableUser->email)->send(
                                new ResponsibleCredentials(
                                    $responsableUser,
                                    (string) $responsableUser->identifier,
                                    '11111',
                                    $family->classe,
                                    $memberCredentials
                                )
                            );
                        } else {
                            Mail::to($responsableUser->email)->send(
                                new SendCredentials($responsableUser, (string) $responsableUser->identifier, '11111')
                            );
                        }

                        $responsableUser->credentials_sent_at = now();
                        $responsableUser->save();
                    } catch (\Exception $e) {
                        Log::error('Erreur lors de l\'envoi des identifiants au responsable', [
                            'user_id' => $responsableUser->id,
                            'email' => $responsableUser->email,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                Log::info('Inscription approuvÃ©e et donnÃ©es crÃ©Ã©es', [
                    'inscription_id' => $inscription->id,
                    'family_id' => $family->id,
                    'responsable_id' => $responsableUser->id,
                    'admin_id' => Auth::id(),
                ]);
            });

            return redirect()->back()
                ->with('success', 'Inscription approuvÃ©e! Famille et utilisateurs crÃ©Ã©s avec succÃ¨s.');
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
     * 1ï¸âƒ£ CrÃ©er la famille Ã  partir des donnÃ©es d'inscription
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

        Log::info('Famille crÃ©Ã©e', [
            'family_id' => $family->id,
            'nom' => $family->nom,
            'classe_id' => $family->classe_id,
            'ville_id' => $family->ville_id,
        ]);

        return $family;
    }

    /**
     * 2ï¸âƒ£ CrÃ©er l'utilisateur responsable
     */
    private function createResponsableUser(Inscription $inscription, Family $family): User
    {
        $responsableNom = $inscription->responsable_nom
            ?? ($inscription->data['responsable']['nom'] ?? null)
            ?? $inscription->nom
            ?? 'NOM';
        $responsablePrenom = $inscription->responsable_prenom
            ?? ($inscription->data['responsable']['prenom'] ?? null)
            ?? $inscription->prenom
            ?? 'PRENOM';
        $responsableEmail = $inscription->responsable_email
            ?? ($inscription->data['responsable']['email'] ?? null)
            ?? $inscription->email;
        $responsableTel = $inscription->responsable_tel
            ?? ($inscription->data['responsable']['tel'] ?? null)
            ?? $inscription->telephone;
        $responsableTel2 = $inscription->responsable_telephone2
            ?? ($inscription->data['responsable']['telephone2'] ?? null)
            ?? $inscription->telephone2;
        $responsableDateNaissance = $inscription->responsable_date_naissance
            ?? ($inscription->data['responsable']['dateNaissance'] ?? null)
            ?? $inscription->date_naissance;
        $responsablePhotoPath = $this->resolvePhotoPathFromValues([
            $inscription->photo_path,
            $inscription->profile_photo_url,
            $inscription->data['responsable']['photo_path'] ?? null,
            $inscription->data['responsable']['photo_url'] ?? null,
            $inscription->data['responsable']['photo'] ?? null,
        ]);

        // VÃ©rifier si un utilisateur avec cet email existe dÃ©jÃ 
        $existingUser = $responsableEmail
            ? User::where('email', $responsableEmail)->first()
            : null;
        if ($existingUser) {
            // Lier l'utilisateur existant Ã  la famille
            $updatePayload = ['family_id' => $family->id];
            if (empty($existingUser->photo_path) && !empty($responsablePhotoPath)) {
                $updatePayload['photo_path'] = $responsablePhotoPath;
            }
            $existingUser->update($updatePayload);
            return $existingUser;
        }

        // GÃ©nÃ©rer l'identifiant
        $identifier = User::generateIdentifier(
            (string) $responsableNom,
            (string) $responsablePrenom,
            $responsableDateNaissance
        );

        // Mot de passe temporaire
        $tempPassword = '11111';

        // DÃ©terminer le rÃ´le en fonction du type d'inscription
        $role = $inscription->type === 'conducteur' ? 'conducteur' : 'responsable_famille';

        // CrÃ©er le nouvel utilisateur responsable ou conducteur
        $user = User::create([
            'nom' => $responsableNom,
            'prenom' => $responsablePrenom,
            'email' => $responsableEmail,
            'password' => Hash::make($tempPassword),
            'identifier' => $identifier,
            'telephone' => $responsableTel,
            'telephone2' => $responsableTel2,
            'genre' => $inscription->data['responsable']['genre'] ?? 'M',
            'date_naissance' => $responsableDateNaissance,
            'photo_path' => $responsablePhotoPath,
            'family_id' => $family->id,
            'classe_id' => $family->classe_id,
            'role' => $role,
            'is_family_responsible' => $role === 'responsable_famille',
            'ville_id' => $family->ville_id,
            'must_change_password' => true,
        ]);

        // Mettre Ã  jour la famille avec le responsable_id
        $family->update(['responsable_id' => $user->id]);

        Log::info('Utilisateur responsable crÃ©Ã©', [
            'user_id' => $user->id,
            'email' => $user->email,
            'identifier' => $identifier,
            'family_id' => $family->id,
        ]);

        return $user;
    }

    /**
     * 3ï¸âƒ£ CrÃ©er les utilisateurs pour les membres de la famille
     */
    private function createFamilyMembers(Inscription $inscription, Family $family, User $responsableUser): array
    {
        if (!in_array($inscription->type, ['famille', 'conducteur']) || !isset($inscription->data['membres'])) {
            return [];
        }

        $membres = $inscription->data['membres'];
        $memberCredentials = [];

        foreach ($membres as $membre) {
            $providedEmail = $membre['email'] ?? null;
            $memberPhotoPath = $this->resolvePhotoPathFromValues([
                $membre['photo_path'] ?? null,
                $membre['photo_url'] ?? null,
                $membre['photo'] ?? null,
            ]);
            $existingMember = null;

            if (!empty($providedEmail)) {
                $existingMember = User::where('email', $providedEmail)->first();
            } else {
                $existingMember = User::where('family_id', $family->id)
                    ->where('nom', $membre['nom'] ?? '')
                    ->where('prenom', $membre['prenom'] ?? '')
                    ->first();
            }

            if ($existingMember && $existingMember->family_id !== $family->id) {
                // Lier au mÃªme utilisateur existant
                $updatePayload = ['family_id' => $family->id];
                if (empty($existingMember->photo_path) && !empty($memberPhotoPath)) {
                    $updatePayload['photo_path'] = $memberPhotoPath;
                }
                $existingMember->update($updatePayload);
                continue;
            }

            if ($existingMember) {
                continue; // DÃ©jÃ  dans la famille
            }

            // GÃ©nÃ©rer l'identifiant pour le membre
            $identifier = User::generateIdentifier(
                $membre['nom'] ?? '',
                $membre['prenom'] ?? '',
                $membre['dateNaissance'] ?? null
            );

            $tempPassword = '11111';
            $memberEmail = !empty($providedEmail)
                ? $providedEmail
                : $this->generateFallbackMemberEmail($membre, (int) $family->id);

            $memberUser = User::create([
                'nom' => $membre['nom'] ?? '',
                'prenom' => $membre['prenom'] ?? '',
                'email' => $memberEmail,
                'password' => Hash::make($tempPassword),
                'identifier' => $identifier,
                'telephone' => $membre['telephone'] ?? null,
                'genre' => $membre['genre'] ?? 'M',
                'date_naissance' => $membre['dateNaissance'] ?? null,
                'photo_path' => $memberPhotoPath,
                'family_id' => $family->id,
                'classe_id' => $family->classe_id,
                'role' => 'membre_famille',
                'is_family_responsible' => false,
                'ville_id' => $family->ville_id,
                'must_change_password' => true,
            ]);

            $memberCredentials[] = [
                'nom' => $memberUser->nom,
                'prenom' => $memberUser->prenom,
                'classe' => $family->classe?->nom ?? null,
                'identifier' => $identifier,
                'password' => $tempPassword,
            ];

            if (!empty($providedEmail)) {
                try {
                    Mail::to($memberUser->email)->send(new SendCredentials($memberUser, $identifier, $tempPassword));
                    $memberUser->credentials_sent_at = now();
                    $memberUser->save();
                } catch (\Exception $e) {
                    Log::error('Erreur lors de l\'envoi des identifiants au membre', [
                        'user_id' => $memberUser->id,
                        'email' => $memberUser->email,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Utilisateur membre crÃ©Ã©', [
                'user_id' => $memberUser->id,
                'email' => $memberUser->email,
                'identifier' => $identifier,
                'family_id' => $family->id,
                'nom' => $memberUser->nom . ' ' . $memberUser->prenom,
            ]);
        }

        return $memberCredentials;
    }

    private function generateFallbackMemberEmail(array $membre, int $familyId): string
    {
        $nom = strtolower(preg_replace('/[^a-z0-9]/i', '', (string) ($membre['nom'] ?? 'membre')));
        $prenom = strtolower(preg_replace('/[^a-z0-9]/i', '', (string) ($membre['prenom'] ?? 'famille')));
        $datePart = isset($membre['dateNaissance'])
            ? str_replace('-', '', (string) $membre['dateNaissance'])
            : now()->format('Ymd');

        $base = "{$prenom}.{$nom}.f{$familyId}.{$datePart}";
        $email = "{$base}@approval-local.invalid";
        $suffix = 1;

        while (User::where('email', $email)->exists()) {
            $email = "{$base}.{$suffix}@approval-local.invalid";
            $suffix++;
        }

        return $email;
    }

    /**
     * Normalize first available photo value to DB relative path.
     */
    private function resolvePhotoPathFromValues(array $candidates): ?string
    {
        foreach ($candidates as $value) {
            if (!is_string($value) || trim($value) === '') {
                continue;
            }

            $resolved = $this->resolvePhotoPath((string) $value);
            if (!empty($resolved)) {
                return $resolved;
            }
        }

        return null;
    }

    /**
     * Convert absolute/public storage URLs to relative DB photo path.
     */
    private function resolvePhotoPath(string $photo): ?string
    {
        $photo = trim($photo);
        if ($photo === '') {
            return null;
        }

        if (!str_contains($photo, '://') && !str_starts_with($photo, '/storage/') && !str_starts_with($photo, 'storage/')) {
            return ltrim($photo, '/');
        }

        if (str_starts_with($photo, '/storage/')) {
            return ltrim(substr($photo, strlen('/storage/')), '/');
        }

        if (str_starts_with($photo, 'storage/')) {
            return ltrim(substr($photo, strlen('storage/')), '/');
        }

        $parsed = parse_url($photo);
        if (isset($parsed['path']) && str_contains($parsed['path'], '/storage/')) {
            $relative = substr($parsed['path'], strpos($parsed['path'], '/storage/') + strlen('/storage/'));
            return ltrim($relative, '/');
        }

        return null;
    }

    /**
     * 4ï¸âƒ£ CrÃ©er les sacrements/Ã©vÃ©nements religieux d'un utilisateur
     *
     * Nouvelle structure: Un seul enregistrement UserSacrement par utilisateur
     * avec colonnes pour statut matrimonial civil et sacrements religieux
     */
    private function createUserSacrements(User $user, Inscription $inscription, string $type = 'responsable', ?array $memberData = null): void
    {
        // PrÃ©parer les donnÃ©es de base
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
            // Pour le responsable, construire les donnÃ©es Ã  partir des colonnes responsable_*
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

        // BAPTÃŠME
        if (($personData['baptise'] ?? false) || !empty($personData['dateBapteme'] ?? null)) {
            $sacrementRecord['baptise'] = true;
            $sacrementRecord['bapteme_date'] = $personData['dateBapteme'] ?? null;
            $sacrementRecord['bapteme_lieu'] = $personData['lieuBapteme'] ?? null;
        }

        // PREMIÃˆRE COMMUNION
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

        // DOT (Cadeau de mariage) - basÃ© sur le statut marital ou donnÃ©es explicites
        // Note: pas de colonnes sÃ©parÃ©es pour dot dans la table responsable, juste le statut
        if ((strtolower($statutMarital ?? '') === 'dote') || !empty($personData['dateDot'] ?? null)) {
            $sacrementRecord['dot_effectue'] = true;
            $sacrementRecord['dot_date'] = $personData['dateDot'] ?? null;
            $sacrementRecord['dot_lieu'] = $personData['lieuDot'] ?? null;
        }

        // DÃ‰CÃˆS (Veuvage)
        if (!empty($personData['dateDeces'] ?? null) || (strtolower($statutMarital ?? '') === 'veuf')) {
            $sacrementRecord['est_veuf'] = true;
            $sacrementRecord['deces_conjoint_date'] = $personData['dateDeces'] ?? null;
            $sacrementRecord['deces_conjoint_lieu'] = $personData['lieuDeces'] ?? null;
        }

        // CrÃ©er le record unique de sacrements pour cet utilisateur
        try {
            UserSacrement::create($sacrementRecord);
            Log::info('Sacrements crÃ©Ã©s', [
                'user_id' => $user->id,
                'user_name' => $user->nom . ' ' . $user->prenom,
                'type' => $type,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la crÃ©ation des sacrements', [
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
            // Valider l'entrÃ©e
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

            // VÃ©rifier le statut (accepter les deux formats)
            if (!in_array($inscription->status, ['en_attente', 'pending'])) {
                return redirect()->back()
                    ->with('error', 'Inscription dÃ©jÃ  traitÃ©e. Statut: ' . $inscription->status);
            }

            // VÃ©rifier les permissions
            if (!Auth::user() || Auth::user()->role !== 'admin') {
                return redirect()->back()
                    ->with('error', 'Vous n\'avez pas la permission de rejeter cette inscription');
            }

            // Rejeter l'inscription avec les bonnes colonnes
            $inscription->update([
                'status' => 'rejete',
                'admin_id' => Auth::id(),
                'admin_approved_at' => now(),
                'raison_rejet' => $request->input('raison', 'Non spÃ©cifiÃ©e'),
            ]);

            Log::info('Inscription rejetÃ©e', [
                'inscription_id' => $inscription->id,
                'admin_id' => Auth::id(),
                'responsable' => $inscription->responsable_nom . ' ' . $inscription->responsable_prenom,
                'raison' => $inscription->raison_rejet,
            ]);

            return redirect()->route('admin.inscriptions')
                ->with('success', 'âœ— Inscription rejetÃ©e avec succÃ¨s.');
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


