/**
 * PhotoHelper - Centralized photo URL generation (JavaScript)
 * Mirrors the PHP PhotoHelper for consistent logic across frontend
 *
 * Usage:
 * import { getPhotoUrl, getAvatarUrl } from '@/Helpers/PhotoHelper';
 */

/**
 * Génère l'URL complète d'une photo
 * Retourne soit la photo stockée, soit un avatar par défaut
 *
 * @param {string|null} photoPath - Chemin relatif (ex: "photos/users/2024/01/15/abc.jpg")
 * @param {string} prenom - Prénom pour l'avatar de secours
 * @param {string} nom - Nom pour l'avatar de secours
 * @returns {string} URL complète de la photo ou avatar automatique
 */
export function getPhotoUrl(photoPath, prenom = '', nom = '') {
    // Si pas de photo
    if (!photoPath) {
        return getAvatarUrl(prenom, nom);
    }

    // Si photo est une URL externe (commence par http)
    if (typeof photoPath === 'string' && photoPath.includes('http')) {
        return photoPath;
    }

    // Si chemin relatif, ajouter /storage/
    return `/storage/${photoPath}`;
}

/**
 * Génère une URL d'avatar automatique via UI-Avatars
 * Utilisé comme fallback
 *
 * @param {string} prenom
 * @param {string} nom
 * @param {number} size - Taille en pixels (défaut: 200)
 * @returns {string} URL de l'avatar généré
 */
export function getAvatarUrl(prenom = '', nom = '', size = 200) {
    const name = `${prenom} ${nom}`.trim();
    const displayName = name || 'User';

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=${size}`;
}

/**
 * Vérifie si une photo existe (vs avatar par défaut)
 *
 * @param {string|null} photoPath
 * @returns {boolean}
 */
export function hasPhoto(photoPath) {
    return !!photoPath && !photoPath.includes('http');
}

/**
 * Extrait le chemin simple d'une photo (sans /storage/)
 *
 * @param {string} photoPath - Chemin avec ou sans /storage/
 * @returns {string|null} Chemin relatif
 */
export function getPhotoPath(photoPath) {
    if (!photoPath) return null;

    if (photoPath.includes('/storage/')) {
        return photoPath.split('/storage/')[1];
    }

    return photoPath;
}

/**
 * Génère une classe CSS pour un conteneur photo
 * Utile pour un affichage cohérent
 *
 * @param {string} size - 'sm', 'md', 'lg', 'xl'
 * @returns {string} Classes Tailwind
 */
export function getPhotoContainerClass(size = 'md') {
    const sizes = {
        sm: 'w-12 h-12',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
        xl: 'w-40 h-40',
    };

    const baseClass = sizes[size] || sizes.md;
    return `${baseClass} rounded-full bg-white overflow-hidden border-2 border-blue-300 shadow-md flex items-center justify-center`;
}

/**
 * Valide un fichier image avant upload
 *
 * @param {File} file - Fichier sélectionné
 * @param {number} maxSizeMB - Taille max en MB (défaut: 5)
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validatePhotoFile(file, maxSizeMB = 5) {
    if (!file) {
        return { valid: false, error: 'Veuillez sélectionner une image' };
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'Format non accepté (JPEG, PNG, GIF, WebP)' };
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
        return { valid: false, error: `La photo ne doit pas dépasser ${maxSizeMB}MB` };
    }

    return { valid: true, error: null };
}

/**
 * Crée un objet URL local pour l'aperçu avant upload
 * IMPORTANT: À utiliser avec revokeObjectURL après usage
 *
 * @param {File} file
 * @returns {string} URL blob locale (URL.createObjectURL)
 */
export function createPhotoPreview(file) {
    if (!file) return null;
    return URL.createObjectURL(file);
}

/**
 * Libère la mémoire utilisée par une URL blob
 * À appeler après chaque aperçu
 *
 * @param {string} blobUrl - URL créée par createPhotoPreview
 */
export function revokePhotoPreview(blobUrl) {
    if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
    }
}
