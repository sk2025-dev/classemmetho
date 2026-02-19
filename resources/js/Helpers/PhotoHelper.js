/**
 * PhotoHelper - Centralized photo URL generation
 * Mirrors the PHP PhotoHelper for consistent logic across frontend
 */

export function getPhotoUrl(photoPath, prenom = '', nom = '') {
    // Si pas de photo
    if (!photoPath) {
        const name = `${prenom} ${nom}`.trim();
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
    }

    // Si photo URL externe
    if (photoPath.includes('http')) {
        return photoPath;
    }

    // Si chemin relatif, ajouter /storage/
    return `/storage/${photoPath}`;
}
