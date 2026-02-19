<?php

namespace App\Helpers;

/**
 * Helper pour gérer les URLs de photos
 */
class PhotoHelper
{
    /**
     * Générer l'URL complète d'une photo
     *
     * @param string|null $photoPath - Chemin relatif stocké en BDD (ex: "members/photo.jpg")
     * @param string|null $firstName - Prénom (pour l'avatar par défaut)
     * @param string|null $lastName - Nom (pour l'avatar par défaut)
     * @return string URL complète de la photo ou avatar généré
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
     * Vérifier si une photo existe
     *
     * @param string|null $photoPath
     * @return bool
     */
    public static function hasPhoto($photoPath)
    {
        return !empty($photoPath) && strpos($photoPath, 'http') !== 0;
    }
}
