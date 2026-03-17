/**
 * Helper pour normaliser et gérer les URLs de photos
 * Utilise dans tout le frontend pour afficher les photos correctement
 */

/**
 * Normalise l'URL d'une photo depuis n'importe quel format
 * @param {string|null} photoPath - Chemin de la photo (peut être: URL complète, /storage/..., storage/..., public/..., ou chemin brut)
 * @returns {string|null} URL normalisée ou null
 */
export function normalizePhotoUrl(photoPath) {
    if (!photoPath || typeof photoPath !== "string") {
        return null;
    }

    const trimmed = photoPath.trim();
    const lowered = trimmed.toLowerCase();

    if (!trimmed || lowered === "null" || lowered === "undefined") {
        return null;
    }

    // Déjà une URL complète (http:// ou https://)
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }

    // Déjà un chemin web absolu
    if (trimmed.startsWith("/storage/")) {
        return trimmed;
    }

    // Tout autre chemin absolu web est déjà exploitable (/images/..., /assets/...)
    if (trimmed.startsWith("/")) {
        return trimmed;
    }

    // Chemin avec "storage/" au début sans le slash
    if (trimmed.startsWith("storage/")) {
        return `/${trimmed}`;
    }

    // Nettoyer le préfixe "public/" et convertir en chemin web
    if (trimmed.startsWith("public/")) {
        return `/storage/${trimmed.substring(7)}`;
    }

    // Chemin brut de fichier (ex: "profiles/photo.jpg") -> ajouter /storage/
    return `/storage/${trimmed}`;
}

/**
 * Obtenir l'URL de photo d'un utilisateur/membre
 * Gère les différentes propriétés: profile_photo_url, photo, photo_path
 * @param {object|null} member - Objet membre/utilisateur
 * @returns {string|null} URL de la photo normalisée ou null
 */
export function getMemberPhotoUrl(member) {
    if (!member) return null;

    // Priorité 1: profile_photo_url (devrait déjà être normalisé par le backend)
    if (member.profile_photo_url) {
        return normalizePhotoUrl(member.profile_photo_url);
    }

    // Priorité 2: photo
    if (member.photo) {
        return normalizePhotoUrl(member.photo);
    }

    // Priorité 3: photo_path
    if (member.photo_path) {
        return normalizePhotoUrl(member.photo_path);
    }

    return null;
}

export function getAvatarUrl(member) {
    if (!member) {
        return null;
    }

    return getMemberPhotoUrl(member);
}

/**
 * Vérifier si une URL de photo est valide (pas vide, pas "null" string)
 * @param {string|null} photoUrl - URL à vérifier
 * @returns {boolean} true si l'URL est valide
 */
export function isValidPhotoUrl(photoUrl) {
    if (!photoUrl || typeof photoUrl !== "string") {
        return false;
    }

    const trimmed = photoUrl.trim().toLowerCase();

    // Invalide si c'est "null" ou "undefined" en string
    if (trimmed === "null" || trimmed === "undefined" || trimmed === "") {
        return false;
    }

    return true;
}

export default {
    normalizePhotoUrl,
    getMemberPhotoUrl,
    getAvatarUrl,
    isValidPhotoUrl,
};
