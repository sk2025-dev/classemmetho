<?php

namespace App\Services;

use App\Models\Inscription;
use App\Models\Family;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Log;
use App\Mail\AccountCreated;

class InscriptionProcessor
{
    public function processApproval(Inscription $inscription, $approver)
    {
        if ($inscription->status !== 'en_attente') {
            throw new \Exception('Inscription déjà traitée.');
        }

        // Check if email is provided
        if (!$inscription->email) {
            throw new \Exception('Email manquant pour cette inscription.');
        }

        // Initialiser les variables
        $plainPassword = $this->generatePassword();
        $user = null;

        // Utiliser Eloquent pour récupérer l'utilisateur existant
        $existingUser = User::whereEmail($inscription->email)->first();

        // Si l'utilisateur existe et a déjà une inscription approuvée, rejeter cette nouvelle
        if ($existingUser) {
            // Utiliser Eloquent avec la relationship
            $approvedInscription = $existingUser->inscriptions()
                ->whereStatus('approuve')
                ->first();

            if ($approvedInscription) {
                throw new \Exception('Cet utilisateur a déjà une inscription approuvée. Impossible de créer un doublon.');
            }

            // Si l'utilisateur existe mais pas d'inscription approuvée, réutiliser cet utilisateur
            $user = $existingUser;

            // Déterminer la famille de l'utilisateur existant basée sur l'inscription
            $type = $inscription->type;
            $family = null;
            if ($type === 'famille') {
                // L'utilisateur devient responsable d'une nouvelle famille
                $familyName = $inscription->data['famille']['nom'] ?? $inscription->nom ?? 'Famille';
                $family = Family::create([
                    'nom' => $familyName,
                    'classe_id' => $inscription->classe_id,
                    'adresse' => $inscription->adresse,
                    'quartier' => $inscription->data['famille']['quartier'] ?? null,
                    'ville_id' => $inscription->ville_id,
                    'telephone' => $inscription->telephone,
                    'telephone2' => $inscription->telephone2,
                    'email' => $inscription->email,
                ]);
            } elseif ($type === 'conducteur') {
                // Conducteur: créer une famille
                $familyName = $inscription->data['famille']['nom'] ?? $inscription->responsable_nom ?? 'Famille';
                $family = Family::create([
                    'nom' => $familyName,
                    'classe_id' => $inscription->classe_id,
                    'adresse' => $inscription->adresse,
                    'quartier' => $inscription->data['famille']['quartier'] ?? null,
                    'ville_id' => $inscription->ville_id,
                    'telephone' => $inscription->telephone,
                    'telephone2' => $inscription->telephone2,
                    'email' => $inscription->email,
                ]);
            }
            // Les données du responsable sont dans les colonnes de l'inscription, pas dans le JSON
            $user->update([
                'nom' => $inscription->nom,
                'prenom' => $inscription->prenom,
                'role' => $type === 'conducteur' ? 'conducteur' : 'responsable_famille',
                'classe_id' => $inscription->classe_id,
                'family_id' => $family ? $family->id : null,
                'telephone' => $inscription->telephone,
                'telephone2' => $inscription->telephone2,
                'date_naissance' => $inscription->date_naissance,
                'genre' => $inscription->genre,
                'adresse' => $inscription->adresse,
                'fonction' => $inscription->fonction,
                'statut_marital' => $inscription->statut_marital,
                // Champs de mariage civil
                'date_mariage' => $inscription->date_mariage,
                'lieu_mariage' => $inscription->lieu_mariage,
                'date_divorce' => $inscription->date_divorce,
                'date_deces' => $inscription->date_deces,
                // Champs religieux - baptême
                'baptise' => $inscription->baptise,
                'date_bapteme' => $inscription->date_bapteme,
                'lieu_bapteme' => $inscription->lieu_bapteme,
                // Champs religieux - première communion
                'premiere_communion' => $inscription->premiere_communion,
                'date_premiere_communion' => $inscription->date_premiere_communion,
                'lieu_premiere_communion' => $inscription->lieu_premiere_communion,
                // Champs religieux - mariage religieux
                'mariage_religieux' => $inscription->mariage_religieux,
                'date_mariage_religieux' => $inscription->date_mariage_religieux,
                'lieu_mariage_religieux' => $inscription->lieu_mariage_religieux,
            ]);

            // Générer identifier pour l'utilisateur existant s'il ne l'a pas
            if (!$user->identifier) {
                $identifier = $this->generateIdentifier($inscription, $user);
                $user->update(['identifier' => $identifier]);
            } else {
                $identifier = $user->identifier;
            }

            // Synchroniser la fonction d'église si présente dans l'inscription
            if (isset($inscription->data['selectedRoles']) && is_array($inscription->data['selectedRoles']) && !empty($inscription->data['selectedRoles'])) {
                $roleIds = array_map(function ($role) {
                    return $role['id'] ?? $role;
                }, $inscription->data['selectedRoles']);
                // Utiliser la première fonction ou la première du tableau
                if (!empty($roleIds)) {
                    $user->fonction_id = $roleIds[0];
                    $user->save();
                }
            }

            // Attach family or member
            if ($type === 'famille') {
                if ($family) {
                    $family->responsable_id = $user->id;
                    $family->save();
                    $user->update(['classe_id' => $family->classe_id]);

                }
            }
        } else {
            // Créer un nouvel utilisateur avec Eloquent
            $type = $inscription->type;
            $identifier = null;

            // Determine role basé sur le type d'inscription
            $role = $type === 'conducteur' ? 'conducteur' : 'responsable_famille';

            // Les types acceptés (famille, conducteur) ont tous une famille
            $family = null;
            if ($type === 'famille') {
                // Créer une nouvelle famille avec Eloquent
                $familyName = $inscription->data['famille']['nom'] ?? $inscription->nom ?? 'Famille';
                $family = Family::create([
                    'nom' => $familyName,
                    'classe_id' => $inscription->classe_id,
                    'adresse' => $inscription->adresse,
                    'quartier' => $inscription->data['famille']['quartier'] ?? null,
                    'ville_id' => $inscription->ville_id,
                    'telephone' => $inscription->telephone,
                    'telephone2' => $inscription->telephone2,
                    'email' => $inscription->email,
                ]);
            } elseif ($type === 'conducteur') {
                // Conducteur: créer une famille
                $familyName = $inscription->data['famille']['nom'] ?? $inscription->responsable_nom ?? 'Famille';
                $family = Family::create([
                    'nom' => $familyName,
                    'classe_id' => $inscription->classe_id,
                    'adresse' => $inscription->adresse,
                    'quartier' => $inscription->data['famille']['quartier'] ?? null,
                    'ville_id' => $inscription->ville_id,
                    'telephone' => $inscription->telephone,
                    'telephone2' => $inscription->telephone2,
                    'email' => $inscription->email,
                ]);
            }

            // Créer l'utilisateur avec Eloquent
            $name = trim(($inscription->nom ?? '') . ' ' . ($inscription->prenom ?? ''));

            // Récupérer les données du JSON (données additionnelles non dans les colonnes)
            $additionalData = $inscription->data['responsable'] ?? [];

            $user = User::create([
                'nom' => $inscription->nom,
                'prenom' => $inscription->prenom,
                'email' => $inscription->email ?? null,
                'password' => Hash::make($plainPassword),
                'role' => $role,
                'classe_id' => $inscription->classe_id,
                'family_id' => $family ? $family->id : null,
                'telephone' => $inscription->telephone,
                'telephone2' => $inscription->telephone2,
                'date_naissance' => $inscription->date_naissance,
                'genre' => $inscription->genre,
                // Les champs suivants sont maintenant dans les colonnes inscriptions
                'adresse' => $inscription->adresse ?? null,
                'profession' => $inscription->profession ?? null,
                'fonction' => $inscription->fonction ?? null,
                'fonction_professionnelle' => $inscription->fonction_professionnelle ?? null,
                'statut_marital' => $inscription->statut_marital,
                'ville_id' => $inscription->ville_id,
                // Champs de mariage civil
                'date_mariage' => $inscription->date_mariage,
                'lieu_mariage' => $inscription->lieu_mariage,
                'date_divorce' => $inscription->date_divorce,
                'lieu_divorce' => $inscription->lieu_divorce,
                'date_deces' => $inscription->date_deces,
                'lieu_deces' => $inscription->lieu_deces,
                // Champs religieux - baptême
                'baptise' => $inscription->baptise,
                'date_bapteme' => $inscription->date_bapteme,
                'lieu_bapteme' => $inscription->lieu_bapteme,
                // Champs religieux - première communion
                'premiere_communion' => $inscription->premiere_communion,
                'date_premiere_communion' => $inscription->date_premiere_communion,
                'lieu_premiere_communion' => $inscription->lieu_premiere_communion,
                // Champs religieux - mariage religieux
                'mariage_religieux' => $inscription->mariage_religieux,
                'date_mariage_religieux' => $inscription->date_mariage_religieux,
                'lieu_mariage_religieux' => $inscription->lieu_mariage_religieux,
            ]);

            // generate and save identifier
            $identifier = $this->generateIdentifier($inscription, $user);
            $user->identifier = $identifier;
            // Pas de forçage du changement de mot de passe - optionnel dans le profil
            $user->save();

            // Assigner la fonction d'église si présente
            if (isset($inscription->data['selectedRoles']) && is_array($inscription->data['selectedRoles']) && !empty($inscription->data['selectedRoles'])) {
                $roleIds = array_map(function ($role) {
                    return $role['id'] ?? $role;
                }, $inscription->data['selectedRoles']);
                // Utiliser la première fonction ou la première du tableau
                if (!empty($roleIds)) {
                    $user->fonction_id = $roleIds[0];
                    $user->save();
                }
            }

            // Attach family - tous les types (famille, conducteur) ont une famille
            if ($family) {
                // Set responsable_id pour les responsables de famille
                if ($type === 'famille') {
                    $family->responsable_id = $user->id;
                }
                $family->save();
                $user->update(['classe_id' => $family->classe_id]);
            }
        }

        if ($user->email) {
            // Envoyer l'email de manière asynchrone
            Mail::to($user->email)->queue(new AccountCreated($user, $plainPassword));
            Notification::create([
                'user_id' => $user->id,
                'channel' => 'email',
                'to' => $user->email,
                'subject' => 'Votre inscription a été acceptée',
                'body' => "Identifiant: {$identifier}\nMot de passe: {$plainPassword}",
                'sent_at' => now(),
            ]);
        }

        // Mettre à jour le statut de l'inscription à approuvé (seulement si elle a un ID = sauvegardée en BD)
        if ($inscription->id) {
            Log::info('=== BEFORE UPDATE ===', [
                'inscription_id' => $inscription->id,
                'current_status' => $inscription->status,
                'status_value_in_memory' => $inscription->getAttribute('status'),
            ]);

            $updateResult = $inscription->update(['status' => 'approuve']);

            Log::info('=== UPDATE RESULT ===', [
                'inscription_id' => $inscription->id,
                'update_returned' => $updateResult,
                'status_in_memory_after_update' => $inscription->getAttribute('status'),
            ]);

            $inscription->refresh();

            Log::info('=== AFTER REFRESH ===', [
                'inscription_id' => $inscription->id,
                'status_from_db' => $inscription->status,
                'status_attribute' => $inscription->getAttribute('status'),
                'full_record' => $inscription->toArray(),
            ]);
        } else {
            Log::warning('Inscription has no ID, cannot update status', [
                'inscription_email' => $inscription->email,
            ]);
        }

        return ['user' => $user, 'password' => $plainPassword, 'identifier' => $identifier];
    }


    protected function generatePassword(): string
    {
        // Mot de passe fixe pour le développement
        return '11111';
    }

    protected function generateIdentifier(Inscription $inscription, User $user): string
    {
        // Utiliser le trait GeneratesIdentifier du modèle User
        // Format: NNPPJJMMAARR (2 lettres nom + 2 lettres prenom + JJMMAA + random)
        return User::generateIdentifier(
            $inscription->nom,
            $inscription->prenom,
            $inscription->date_naissance?->format('Y-m-d') ?? date('Y-m-d')
        );
    }
}
