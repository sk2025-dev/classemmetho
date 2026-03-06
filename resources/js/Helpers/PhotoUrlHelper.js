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
    if (!photoPath || typeof photoPath !== 'string') {
        return null;
    }

    const trimmed = photoPath.trim();

    // Déjà une URL complète (http:// ou https://)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    // Déjà un chemin web absolu
    if (trimmed.startsWith('/storage/')) {
        return trimmed;
    }

    // Chemin avec "storage/" au début sans le slash
    if (trimmed.startsWith('storage/')) {
        return `/${trimmed}`;
    }

    // Nettoyer le préfixe "public/" et convertir en chemin web
    if (trimmed.startsWith('public/')) {
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

/**
 * Générer une URL d'avatar (photo ou initiales générées)
 * Utilise le service UI Avatars si pas de photo
 * @param {object|null} member - Objet membre/utilisateur avec prenom, nom, photo
 * @param {object} options - Options: size (défaut 128), background (défaut random)
 * @returns {string} URL de la photo ou avatar généré
 */
export function getAvatarUrl(member, options = {}) {
    if (!member) {
        return getDefaultAvatar('?', options);
    }

    // Essayer d'obtenir la photo
    const photoUrl = getMemberPhotoUrl(member);
    if (photoUrl) return photoUrl;

    // Générer avatar avec initiales
    const prenom = member.prenom || member.name || '';
    const nom = member.nom || '';
    
    const prenomPart = prenom.trim().split(' ')[0] || '';
    const nomPart = nom.trim().split(' ')[0] || '';
    
    const initials = (prenomPart[0] || '') + (nomPart[0] || '');
    
    return getDefaultAvatar(initials || '?', options);
}

/**
 * Générer URL d'avatar par défaut avec initiales
 * @param {string} initials - Initiales (1-2 caractères)
 * @param {object} options - Options de personnalisation
 * @returns {string} URL du service UI Avatars
 */
function getDefaultAvatar(initials, options = {}) {
    const size = options.size || 128;
    const background = options.background || getColorFromInitials(initials);
    const color = options.color || 'fff';

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(background)}&color=${color}&bold=true&size=${size}`;
}

/**
 * Obtenir une couleur déterministe basée sur les initiales
 * @param {string} initials - Initiales
 * @returns {string} Code couleur hex sans le #
 */
function getColorFromInitials(initials) {
    const colors = [
        'FF6B6B', // Rouge
        '4ECDC4', // Teal
        '45B7D1', // Bleu
        'FFA07A', // Saumon
        '98D8C8', // Menthe
        'F7DC6F', // Or
        'BB8FCE', // Violet
        '85C1E2', // Bleu ciel
        'F8B88B', // Pêche
        'D7BDE2', // Lavande
    ];

    if (!initials || initials.length === 0) {
        return colors[0];
    }

    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
}

/**
 * Vérifier si une URL de photo est valide (pas vide, pas "null" string)
 * @param {string|null} photoUrl - URL à vérifier
 * @returns {boolean} true si l'URL est valide
 */
export function isValidPhotoUrl(photoUrl) {
    if (!photoUrl || typeof photoUrl !== 'string') {
        return false;
    }

    const trimmed = photoUrl.trim().toLowerCase();
    
    // Invalide si c'est "null" ou "undefined" en string
    if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '') {
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
