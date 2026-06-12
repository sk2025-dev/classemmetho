import React, { useState } from 'react';

/**
 * Composant pour afficher la photo de profil ou les initiales
 * @param {object} user - L'utilisateur avec name et profile_photo_url
 * @param {string} size - Taille: 'sm' (8), 'md' (10), 'lg' (12), 'xl' (16), '2xl' (20)
 * @param {string} className - Classes CSS additionnelles
 */
export default function ProfilePhotoDisplay({ user, size = 'md', className = '' }) {
    const [photoError, setPhotoError] = useState(false);

    if (!user) return null;

    const sizeMap = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
        '2xl': 'w-20 h-20 text-xl',
    };

    const sizeClass = sizeMap[size] || sizeMap.md;

    const getInitials = () => {
        const name = user.name || user.prenom || 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (user.profile_photo_url && !photoError) {
        return (
            <div className={`${sizeClass} rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 ${className}`}>
                <img
                    src={user.profile_photo_url}
                    alt={user.name || 'Profile'}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setPhotoError(true)}
                />
            </div>
        );
    }

    return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md shrink-0 ${className}`}>
            {getInitials()}
        </div>
    );
}
