import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, AlertCircle } from 'lucide-react';

/**
 * Composant pour uploader une photo de profil
 * Composant réutilisable avec validation, aperçu et gestion d'erreurs
 *
 * @param {function} onPhotoSelected - Callback(photoUrl) quand une photo est uploadée
 * @param {string} initialPhotoUrl - URL initiale de la photo si elle existe
 * @param {string} size - Taille de l'aperçu: 'sm' (20), 'md' (24), 'lg' (32)
 * @param {boolean} disabled - Désactiver l'upload
 * @param {string} uploadEndpoint - Point d'entrée API pour l'upload (défaut: /api/profile/photo/upload)
 * @param {function} onError - Callback(message) en cas d'erreur
 *
 * Exemple d'utilisation:
 * <PhotoUploadInput
 *   onPhotoSelected={(url) => setPhotoUrl(url)}
 *   initialPhotoUrl={user.photo_path}
 *   size="lg"
 * />
 */
export default function PhotoUploadInput({
    onPhotoSelected,
    initialPhotoUrl = null,
    size = 'md',
    disabled = false,
    uploadEndpoint = '/api/profile/photo/upload',
    onError = null
}) {
    const [preview, setPreview] = useState(initialPhotoUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const objectUrlRef = useRef(null);

    // Map des tailles (Tailwind classes)
    const sizeMap = {
        sm: 'w-20 h-20',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
        xl: 'w-40 h-40',
    };

    const sizeClass = sizeMap[size] || sizeMap.md;

    /**
     * Gère la sélection du fichier
     * Valide, crée un aperçu et upload la photo
     */
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation locale
        if (!file.type.startsWith('image/')) {
            const msg = 'Veuillez sélectionner une image';
            setError(msg);
            onError?.(msg);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            const msg = 'La photo ne doit pas dépasser 5MB';
            setError(msg);
            onError?.(msg);
            return;
        }

        // Révoquer l'URL précédente si elle existe
        if (objectUrlRef.current && objectUrlRef.current.startsWith('blob:')) {
            URL.revokeObjectURL(objectUrlRef.current);
        }

        // Créer un aperçu local
        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;
        setPreview(objectUrl);
        setError('');

        // Uploader la photo
        await uploadPhoto(file, objectUrl);
    };

    /**
     * Uploade la photo au serveur
     */
    const uploadPhoto = async (file, previewUrl) => {
        setIsLoading(true);

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await fetch(uploadEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    // CSRF token sera ajouté automatiquement par Inertia pour les routes web
                    // Pour les API routes sans middleware web, peut être nécessaire d'ajouter le token
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'upload');
            }

            // Callback avec l'URL de la photo uploadée
            if (onPhotoSelected && data.photo_url) {
                onPhotoSelected(data.photo_url);
            }

            setPreview(previewUrl);

        } catch (err) {
            const errorMsg = err.message;
            setError(errorMsg);
            onError?.(errorMsg);

            // Restaurer l'aperçu précédent
            if (objectUrlRef.current && objectUrlRef.current.startsWith('blob:')) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
            setPreview(initialPhotoUrl);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Supprime la photo sélectionnée
     */
    const handleRemove = async () => {
        // Révoquer l'URL blob
        if (objectUrlRef.current && objectUrlRef.current.startsWith('blob:')) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        setPreview(null);
        setError('');
        setIsLoading(false);

        // Réinitialiser l'input file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Notifier le parent
        if (onPhotoSelected) {
            onPhotoSelected(null);
        }

        // Optionnel: appeler l'endpoint de suppression
        if (initialPhotoUrl) {
            await deletePhoto();
        }
    };

    /**
     * Appelle l'endpoint de suppression du serveur
     */
    const deletePhoto = async () => {
        try {
            const response = await fetch('/api/profile/photo/delete', {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Erreur suppression photo');
            }
        } catch (err) {
            console.error('Erreur:', err);
        }
    };

    /**
     * Cleanup: révoquer les URLs blob au démontage
     */
    useEffect(() => {
        return () => {
            if (objectUrlRef.current && objectUrlRef.current.startsWith('blob:')) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Aperçu */}
            {preview ? (
                <div className={`${sizeClass} rounded-xl overflow-hidden border-2 border-blue-300 shadow-lg relative group cursor-pointer transition-transform hover:scale-105`}>
                    <img
                        src={preview}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            console.error('Erreur chargement image');
                            e.target.src = `https://ui-avatars.com/api/?name=Photo&background=random&size=200`;
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isLoading}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 shadow-md"
                        title="Supprimer la photo"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ) : (
                <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-dashed border-blue-300 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors hover:border-blue-400`}>
                    <Upload size={32} className="text-blue-400" />
                </div>
            )}

            {/* Input file caché */}
            <label className="cursor-pointer w-full">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isLoading || disabled}
                    className="hidden"
                />
                <span className={`inline-block w-full px-4 py-2.5 rounded-lg font-semibold text-center transition-all ${
                    isLoading || disabled
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                }`}>
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Chargement...
                        </span>
                    ) : (
                        'Choisir une photo'
                    )}
                </span>
            </label>

            {/* Message d'erreur */}
            {error && (
                <div className="w-full bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* Info */}
            <p className="text-xs text-gray-500 text-center">
                PNG, JPG, GIF, WebP • Max 5MB
            </p>
        </div>
    );
}
