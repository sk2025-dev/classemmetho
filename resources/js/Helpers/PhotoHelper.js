/**
 * PhotoHelper - Centralized photo URL generation
 * Gère correctement les photos: utilise le chemin de la BD si le fichier existe,
 * sinon génère un avatar avec les initiales
 */

import { withBasePath } from "../Utils/urlHelper";

function toAppPath(path) {
    return withBasePath("", path);
}

// Couleurs pour les avatars
const AVATAR_COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8B88B",
    "#D7BDE2",
];

// Obtenir une couleur basée sur les initiales
function getColorFromInitials(initials) {
    if (!initials || initials.length === 0) return AVATAR_COLORS[0];
    const index = initials.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

// Obtenir les initiales
function getInitials(prenom, nom) {
    let initials = "";
    if (prenom && typeof prenom === "string") {
        initials += prenom.charAt(0).toUpperCase();
    }
    if (nom && typeof nom === "string") {
        initials += nom.charAt(0).toUpperCase();
    }
    return initials || "?";
}

/**
 * Génère l'URL de la photo
 * @param {string|null} photoPath - Le chemin de la photo dans la BD
 * @param {string} prenom - Prénom pour l'avatar
 * @param {string} nom - Nom pour l'avatar
 * @returns {string} URL de la photo ou avatar
 */
export function getPhotoUrl(photoPath, prenom = "", nom = "") {
    // Si pas de photo, générer un avatar avec les initiales
    if (!photoPath || photoPath === null || photoPath === "") {
        const initials = getInitials(prenom, nom);
        const bgColor = getColorFromInitials(initials);
        const name = `${prenom} ${nom}`.trim() || initials;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${encodeURIComponent(bgColor)}&color=fff&bold=true&size=128`;
    }

    // Si c'est déjà une URL externe (http/https)
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
        return photoPath;
    }

    // Si c'est déjà un chemin web complet
    if (photoPath.startsWith("/storage/") || photoPath.startsWith("/")) {
        return toAppPath(photoPath);
    }

    // Si chemin relatif avec "storage/" au début
    if (photoPath.startsWith("storage/")) {
        return toAppPath("/" + photoPath);
    }

    // Si chemin avec "public/" au début, le convertir
    if (photoPath.startsWith("public/")) {
        const relativePath = photoPath.substring(7);
        return toAppPath(`/storage/${relativePath}`);
    }

    // Par défaut, ajouter /storage/ devant
    return toAppPath(`/storage/${photoPath}`);
}

/**
 * Résout l'URL de la photo pour les données membre
 * Utilise plusieurs propriétés possibles: photo_path, photo, profile_photo_url
 * @param {object} member - Objet membre avec les données photo
 * @returns {string|null} URL de la photo ou null
 */
export function resolveMemberPhotoUrl(member) {
    if (!member) return null;

    // Priorité: profile_photo_url > photo > photo_path
    const photoPath =
        member.profile_photo_url || member.photo || member.photo_path || null;

    if (!photoPath) return null;

    // Si c'est une URL externe
    if (
        typeof photoPath === "string" &&
        (photoPath.startsWith("http://") || photoPath.startsWith("https://"))
    ) {
        return photoPath;
    }

    // Nettoyer le chemin
    let cleanedPath = photoPath;
    if (typeof cleanedPath === "string") {
        cleanedPath = cleanedPath.trim();
    }

    // Vérifier les différents formats de chemin
    if (!cleanedPath) return null;

    if (
        cleanedPath.startsWith("http://") ||
        cleanedPath.startsWith("https://")
    ) {
        return cleanedPath;
    }

    if (cleanedPath.startsWith("/storage/")) {
        return cleanedPath;
    }

    if (cleanedPath.startsWith("/")) {
        return toAppPath(cleanedPath);
    }

    if (cleanedPath.startsWith("storage/")) {
        return toAppPath("/" + cleanedPath);
    }

    if (cleanedPath.startsWith("public/")) {
        return toAppPath("/storage/" + cleanedPath.substring(7));
    }

    // Par défaut
    return toAppPath(`/storage/${cleanedPath}`);
}

/**
 * Version simple qui combine résolution et fallback avatar
 * @param {object|null} member - Objet membre
 * @returns {string} URL de la photo ou avatar
 */
export function getMemberPhotoUrl(member) {
    if (!member) {
        return getPhotoUrl(null, "", "");
    }

    const photoUrl = resolveMemberPhotoUrl(member);

    if (photoUrl) {
        return photoUrl;
    }

    // Fallback vers avatar avec les initiales
    return getPhotoUrl(null, member.prenom || "", member.nom || "");
}

export default {
    getPhotoUrl,
    resolveMemberPhotoUrl,
    getMemberPhotoUrl,
};
