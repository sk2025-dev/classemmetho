import React, { useState } from "react";
import { resolveMemberPhotoUrl } from "../Helpers/PhotoHelper";

/**
 * Composant universel pour afficher une photo de profil ou avatar avec initiales
 * Utilise automatiquement le PhotoHelper pour normaliser les URLs
 *
 * @param {object} user - Objet utilisateur/membre avec photo_path, prenom, nom, etc.
 * @param {string} size - Taille: 'xs' (6), 'sm' (8), 'md' (10), 'lg' (12), 'xl' (16), '2xl' (20), '3xl' (24)
 * @param {string} className - Classes CSS additionnelles
 * @param {string} alt - Texte alternatif pour l'image
 * @param {boolean} rounded - Si true, applique rounded-full, sinon rounded-lg
 */
export default function ProfilePhoto({
    user,
    size = "md",
    className = "",
    alt = "Photo de profil",
    rounded = true,
}) {
    const [imageError, setImageError] = useState(false);

    if (!user) {
        return null;
    }

    // Tailles prédéfinies
    const sizeMap = {
        xs: "w-6 h-6 text-xs",
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
        xl: "w-16 h-16 text-lg",
        "2xl": "w-20 h-20 text-xl",
        "3xl": "w-24 h-24 text-2xl",
    };

    const sizeClass = sizeMap[size] || sizeMap["md"];
    const roundedClass = rounded ? "rounded-full" : "rounded-lg";

    // Résoudre la vraie photo; fallback local vers initiales en cas d'absence/erreur
    const photoUrl = resolveMemberPhotoUrl(user);
    const hasValidPhotoUrl =
        typeof photoUrl === "string" &&
        photoUrl.trim() !== "" &&
        photoUrl.trim().toLowerCase() !== "null" &&
        photoUrl.trim().toLowerCase() !== "undefined";

    return (
        <div
            className={`${sizeClass} ${roundedClass} overflow-hidden bg-gray-200 flex items-center justify-center shrink-0 ${className}`}
            title={alt}
        >
            {hasValidPhotoUrl && !imageError ? (
                <img
                    src={photoUrl}
                    alt={alt}
                    className={`w-full h-full object-cover ${roundedClass}`}
                    onError={() => setImageError(true)}
                    loading="lazy"
                />
            ) : (
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold ${roundedClass}`}>
                    {getInitials(user)}
                </div>
            )}
        </div>
    );
}

/**
 * Extraire les initiales du nom d'un utilisateur
 * @param {object} user - Objet avec prenom, nom ou name
 * @returns {string} Initiales (2 caractères max)
 */
function getInitials(user) {
    if (!user) return "?";

    const prenom = user.prenom || user.name || "";
    const nom = user.nom || "";

    const prenomPart = prenom.trim().split(" ")[0] || "";
    const nomPart = nom.trim().split(" ")[0] || "";

    const initials = (prenomPart[0] || "") + (nomPart[0] || "");

    return (initials || "?").toUpperCase();
}
