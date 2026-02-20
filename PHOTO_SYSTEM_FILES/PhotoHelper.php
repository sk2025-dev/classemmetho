<?php

namespace App\Helpers;

/**
 * Helper pour gérer les URLs de photos
 * Centralise la logique de génération d'URLs et d'avatars
 */
class PhotoHelper
{
    /**
     * Générer l'URL complète d'une photo
     * Retourne soit la photo stockée, soit un avatar généré par UI-Avatars
     *
     * @param string|null $photoPath - Chemin relatif stocké en BDD (ex: "photos/users/2024/01/15/abc123.jpg")
     * @param string|null $firstName - Prénom (pour l'avatar par défaut)
     * @param string|null $lastName - Nom (pour l'avatar par défaut)
     * @return string|null URL complète de la photo ou URL d'avatar généré
     */
    public static function getPhotoUrl($photoPath, $firstName = null, $lastName = null)
    {
        // Si une photo existe en base de données
        if ($photoPath && !empty($photoPath)) {
            // Vérifier si c'est déjà une URL complète (commence par http)
            if (strpos($photoPath, 'http') === 0) {
                return $photoPath;
            }

            // Construire l'URL complète avec /storage/
            return '/storage/' . $photoPath;
        }

        // Pas de photo = retourner null (afficher placeholder)
        return null;
    }

    /**
     * Générer une URL d'avatar automatique (UI-Avatars)
     * Utilisé comme fallback quand aucune photo n'existe
     *
     * @param string|null $firstName
     * @param string|null $lastName
     * @param int $size - Taille en pixels (défaut: 200)
     * @return string URL complète de l'avatar généré
     */
    public static function getAvatarUrl($firstName = null, $lastName = null, $size = 200)
    {
        $name = trim(($firstName ?? '') . ' ' . ($lastName ?? ''));
        $name = !empty($name) ? $name : 'User';

        return 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=random&size=' . $size;
    }

    /**
     * Vérifier si une photo existe
     *
     * @param string|null $photoPath
     * @return bool
     */
    public static function hasPhoto($photoPath)
    {
        return !empty($photoPath) && strpos($photoPath, 'http') !== 0;
    }

    /**
     * Obtenir le chemin complet du fichier stocké
     * Utile pour les opérations de suppression
     *
     * @param string|null $photoPath
     * @return string|null Chemin dans storage/app/public/
     */
    public static function getStoragePath($photoPath)
    {
        if (!$photoPath) return null;

        // Si c'est déjà un chemin relatif storage
        if (strpos($photoPath, 'photos/') === 0 || strpos($photoPath, 'profiles/') === 0) {
            return $photoPath;
        }

        return null;
    }
}
