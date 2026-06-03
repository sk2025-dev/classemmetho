<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PhotoHelper
{
    private static function appBasePath(): string
    {
        $path = parse_url((string) config('app.url'), PHP_URL_PATH) ?: '';
        if ($path === '/' || $path === null) {
            return '';
        }

        return rtrim((string) $path, '/');
    }

    private static function toAppPath(string $path): string
    {
        $basePath = self::appBasePath();
        $cleanPath = '/' . ltrim($path, '/');

        return $basePath . $cleanPath;
    }

    /**
     * Obtenir l'URL de la photo d'un utilisateur
     * Si une photo existe, retourner son URL
     * Sinon, générer un avatar avec les initiales
     *
     * @param string|null $photoPath Le chemin du fichier photo stocké
     * @param string|null $prenom Le prénom de l'utilisateur
     * @param string|null $nom Le nom de l'utilisateur
     * @return string URL de la photo ou avatar généré
     */
    public static function getPhotoUrl(?string $photoPath, ?string $prenom = null, ?string $nom = null): string
    {
        // ✅ Si une photo existe, retourner son URL publique
        if (!empty($photoPath)) {
            $photoPath = trim($photoPath);

            // Vérifier si c'est déjà une URL complète
            if (str_starts_with($photoPath, 'http://') || str_starts_with($photoPath, 'https://')) {
                return $photoPath;
            }

            // Déjà un chemin web public
            if (str_starts_with($photoPath, '/storage/')) {
                return self::toAppPath($photoPath);
            }

            // Chemin relatif "storage/..."
            if (str_starts_with($photoPath, 'storage/')) {
                return self::toAppPath('/' . $photoPath);
            }

            // Nettoyer un éventuel préfixe "public/"
            $normalizedPath = str_starts_with($photoPath, 'public/')
                ? substr($photoPath, 7)
                : $photoPath;

            // Vérifier si le fichier existe dans le stockage public
            if (Storage::disk('public')->exists($normalizedPath)) {
                return self::toAppPath('/storage/' . ltrim($normalizedPath, '/'));
            }

            // Fallback si le chemin existe mais pas en storage
            return self::toAppPath('/storage/' . ltrim($normalizedPath, '/'));
        }

        // ✅ Générer un avatar avec initiales si pas de photo
        $initials = self::getInitials($prenom, $nom);
        $bgColor = self::getColorFromInitials($initials);

        // Utiliser un service d'avatar (UI Avatars - service gratuit)
        return "https://ui-avatars.com/api/?name=" . urlencode($initials) . "&background=" . urlencode($bgColor) . "&color=fff&bold=true&size=128";
    }

    /**
     * Générer les initiales à partir du prénom et du nom
     */
    private static function getInitials(?string $prenom, ?string $nom): string
    {
        $initials = '';

        if (!empty($prenom)) {
            $initials .= strtoupper(substr($prenom, 0, 1));
        }

        if (!empty($nom)) {
            $initials .= strtoupper(substr($nom, 0, 1));
        }

        return $initials ?: '?';
    }

    /**
     * Obtenir une couleur déterministe basée sur les initiales
     */
    private static function getColorFromInitials(?string $initials): string
    {
        $colors = [
            '#FF6B6B', // Rouge
            '#4ECDC4', // Teal
            '#45B7D1', // Bleu
            '#FFA07A', // Saumon
            '#98D8C8', // Menthe
            '#F7DC6F', // Or
            '#BB8FCE', // Violet
            '#85C1E2', // Bleu ciel
            '#F8B88B', // Pêche
            '#D7BDE2', // Lavande
        ];

        // Utiliser la première lettre pour sélectionner une couleur
        if (!empty($initials)) {
            $index = ord(strtoupper($initials[0])) % count($colors);
            return $colors[$index];
        }

        return $colors[0];
    }

    /**
     * Supprimer une photo du stockage
     */
    public static function deletePhoto(?string $photoPath): bool
    {
        if (empty($photoPath)) {
            return true;
        }

        try {
            if (Storage::disk('public')->exists($photoPath)) {
                return Storage::disk('public')->delete($photoPath);
            }
            return true;
        } catch (\Exception $e) {
            Log::warning('Erreur lors de la suppression de la photo', [
                'photo_path' => $photoPath,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Vérifier si une URL est une photo valide
     */
    public static function isValidPhotoPath(?string $photoPath): bool
    {
        if (empty($photoPath)) {
            return false;
        }

        // Vérifier si c'est une URL absolue
        if (str_starts_with($photoPath, 'http://') || str_starts_with($photoPath, 'https://')) {
            return true;
        }

        // Vérifier si le fichier existe dans le stockage public
        return Storage::disk('public')->exists($photoPath);
    }
}
