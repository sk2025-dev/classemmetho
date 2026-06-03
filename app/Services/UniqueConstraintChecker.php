<?php

namespace App\Services;

use App\Models\User;
use App\Models\Inscription;
use App\Models\Fonction;
use App\Models\Ville;
use App\Exceptions\UniqueConstraintViolationException;

/**
 * Service de vérification des contraintes UNIQUE
 * Détecte et rapporte les violations avant qu'elles ne causent une erreur DB
 */
class UniqueConstraintChecker
{
    /**
     * Vérifier si un email existe déjà dans users
     * Ignore les users soft-deleted
     *
     * @param string $email
     * @param int|null $excludeUserId ID du user courant (pour les mises à jour)
     * @throws UniqueConstraintViolationException
     */
    public function checkEmailUnique(string $email, ?int $excludeUserId = null): void
    {
        $query = User::withoutGlobalScopes()
            ->where('email', $email)
            ->whereNull('deleted_at');

        if ($excludeUserId) {
            $query->where('id', '!=', $excludeUserId);
        }

        if ($query->exists()) {
            throw new UniqueConstraintViolationException(
                field: 'email',
                value: $email,
                table: 'users',
                humanMessage: "Cet email est déjà utilisé. Merci d'utiliser une autre adresse email."
            );
        }
    }

    /**
     * Vérifier si un email existe dans une inscription approuvée (pas rejetée ou en attente)
     * Les inscriptions approuvées deviennent des users, on cherche dans users
     *
     * @param string $email
     * @param int|null $excludeUserId
     * @throws UniqueConstraintViolationException
     */
    public function checkInscriptionEmailUnique(string $email, ?int $excludeUserId = null): void
    {
        // Les inscriptions approuvées deviennent des users, donc chercher dans users
        $query = User::where('email', $email)
            ->whereNull('deleted_at');

        if ($excludeUserId) {
            $query->where('id', '!=', $excludeUserId);
        }

        if ($query->exists()) {
            throw new UniqueConstraintViolationException(
                field: 'email',
                value: $email,
                table: 'users',
                humanMessage: "Une inscription approuvée existe déjà avec cet email. Veuillez contacter l'administrateur."
            );
        }
    }

    /**
     * Vérifier si un email existe dans une même classe
     * (Pour déduplication familles)
     *
     * @param string $email
     * @param int $classeId
     * @throws UniqueConstraintViolationException
     */
    public function checkFamilyEmailInClass(string $email, int $classeId): void
    {
        $user = User::where('email', $email)
            ->where('classe_id', $classeId)
            ->whereNull('deleted_at')
            ->first();

        if ($user) {
            throw new UniqueConstraintViolationException(
                field: 'email',
                value: $email,
                table: 'users',
                humanMessage: "Une famille avec cet email existe déjà dans cette classe. Merci de vérifier si vous êtes déjà inscrit."
            );
        }
    }

    /**
     * Vérifier si un identifiant est unique
     *
     * @param string $identifier
     * @param int|null $excludeUserId
     * @throws UniqueConstraintViolationException
     */
    public function checkIdentifierUnique(string $identifier, ?int $excludeUserId = null): void
    {
        $query = User::where('identifier', $identifier)
            ->whereNull('deleted_at');

        if ($excludeUserId) {
            $query->where('id', '!=', $excludeUserId);
        }

        if ($query->exists()) {
            throw new UniqueConstraintViolationException(
                field: 'identifier',
                value: $identifier,
                table: 'users',
                humanMessage: "Cet identifiant est déjà utilisé. Un code unique vous sera assigné lors de la validation."
            );
        }
    }

    /**
     * Vérifier si un nom de fonction est unique
     *
     * @param string $nom
     * @param int|null $excludeFonctionId
     * @throws UniqueConstraintViolationException
     */
    public function checkFonctionNomUnique(string $nom, ?int $excludeFonctionId = null): void
    {
        $query = Fonction::where('nom', $nom);

        if ($excludeFonctionId) {
            $query->where('id', '!=', $excludeFonctionId);
        }

        if ($query->exists()) {
            throw new UniqueConstraintViolationException(
                field: 'nom',
                value: $nom,
                table: 'fonctions',
                humanMessage: "Cette fonction existe déjà. Merci de choisir un autre nom."
            );
        }
    }

    /**
     * Vérifier si un nom de ville est unique
     *
     * @param string $nom
     * @param int|null $excludeVilleId
     * @throws UniqueConstraintViolationException
     */
    public function checkVilleNomUnique(string $nom, ?int $excludeVilleId = null): void
    {
        $query = Ville::where('nom', $nom);

        if ($excludeVilleId) {
            $query->where('id', '!=', $excludeVilleId);
        }

        if ($query->exists()) {
            throw new UniqueConstraintViolationException(
                field: 'nom',
                value: $nom,
                table: 'villes',
                humanMessage: "Cette ville est déjà enregistrée dans la base de données."
            );
        }
    }

    /**
     * Vérifier si un code de ville est unique
     *
     * @param string $code
     * @param int|null $excludeVilleId
     * @throws UniqueConstraintViolationException
     */
    public function checkVilleCodeUnique(string $code, ?int $excludeVilleId = null): void
    {
        $query = Ville::where('code', $code);

        if ($excludeVilleId) {
            $query->where('id', '!=', $excludeVilleId);
        }

        if ($query->exists()) {
            throw new UniqueConstraintViolationException(
                field: 'code',
                value: $code,
                table: 'villes',
                humanMessage: "Ce code postal est déjà utilisé pour une autre ville."
            );
        }
    }

    /**
     * Vérifier multiple emails (pour inscriptions multiples)
     *
     * @param array $emails Format: ['responsable@email.com', 'membre1@email.com', ...]
     * @throws UniqueConstraintViolationException
     */
    public function checkMultipleEmailsUnique(array $emails): void
    {
        // Vérifier les doublons internes
        $unique = array_unique($emails);
        if (count($unique) !== count($emails)) {
            $duplicates = array_diff_assoc($emails, $unique);
            throw new UniqueConstraintViolationException(
                field: 'email',
                value: implode(', ', array_values($duplicates)),
                table: 'inscriptions',
                humanMessage: "Il y a des emails en doublon dans votre inscription. Chaque personne doit avoir une adresse email unique."
            );
        }

        // Vérifier dans la base de données
        foreach ($emails as $email) {
            if (empty($email)) continue; // emails optionnels
            $this->checkEmailUnique($email);
        }
    }
}
