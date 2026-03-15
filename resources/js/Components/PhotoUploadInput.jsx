import React, { useState, useEffect } from "react";
import { Upload, Trash2 } from "lucide-react";

/**
 * Composant pour uploader une photo de profil
 * @param {function} onPhotoSelected - Callback quand une photo est uploadée
 * @param {string} initialPhotoUrl - URL initiale de la photo si elle existe
 * @param {string} size - Taille de l'aperçu: 'sm' (20), 'md' (24), 'lg' (32)
 */
export default function PhotoUploadInput({
    onPhotoSelected,
    onUploadStateChange,
    initialPhotoUrl = null,
    size = "md",
}) {
    const [preview, setPreview] = useState(initialPhotoUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const sizeMap = {
        sm: "w-20 h-20",
        md: "w-24 h-24",
        lg: "w-32 h-32",
    };

    const sizeClass = sizeMap[size] || sizeMap.md;

    useEffect(() => {
        setPreview((currentPreview) => {
            if (
                currentPreview &&
                currentPreview.startsWith("blob:") &&
                currentPreview !== initialPhotoUrl
            ) {
                URL.revokeObjectURL(currentPreview);
            }

            return initialPhotoUrl;
        });
    }, [initialPhotoUrl]);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation locale
        if (!file.type.startsWith("image/")) {
            setError("Veuillez sélectionner une image");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("La photo ne doit pas dépasser 5MB");
            return;
        }

        // Revoke previous object URL to free memory
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        // Créer un aperçu local
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Uploader la photo
        setIsLoading(true);
        setError("");
        if (onUploadStateChange) {
            onUploadStateChange(true);
        }

        const formData = new FormData();
        formData.append("photo", file);

        const csrfToken =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content") ||
            window.axios?.defaults?.headers?.common?.["X-CSRF-TOKEN"];

        try {
            // Essayer d'abord la route publique pour l'inscription
            // Si l'utilisateur est authentifié, ce sera quand même accepté
            const response = await fetch("/api/photo/upload-inscription", {
                method: "POST",
                body: formData,
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de l'upload");
            }

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }

            const relativePhotoUrl = data.path
                ? `/storage/${String(data.path).replace(/^\/+/, "")}`
                : data.photo_url || null;

            setPreview(relativePhotoUrl);

            // Callback avec l'URL de la photo
            if (onPhotoSelected) {
                onPhotoSelected(relativePhotoUrl);
            }
        } catch (err) {
            setError(err.message);
            // Restore previous preview and revoke the new object URL
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            setPreview(initialPhotoUrl); // Restore previous preview
        } finally {
            setIsLoading(false);
            if (onUploadStateChange) {
                onUploadStateChange(false);
            }
        }
    };

    const handleRemove = () => {
        setPreview(null);
        setError("");
        if (onPhotoSelected) {
            onPhotoSelected(null);
        }
    };

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (preview && preview.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Aperçu */}
            {preview ? (
                <div
                    className={`${sizeClass} rounded-xl overflow-hidden border-2 border-blue-300 shadow-lg relative group`}
                >
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isLoading}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ) : (
                <div
                    className={`${sizeClass} rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-dashed border-blue-300 flex items-center justify-center`}
                >
                    <Upload size={32} className="text-blue-400" />
                </div>
            )}

            {/* Input file */}
            <label className="cursor-pointer">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isLoading}
                    className="hidden"
                />
                <span
                    className={`inline-block px-4 py-2 rounded-lg font-semibold transition-all ${
                        isLoading
                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    }`}
                >
                    {isLoading ? "Chargement..." : "Choisir une photo"}
                </span>
            </label>

            {/* Erreur */}
            {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* Info */}
            <p className="text-xs text-gray-500 text-center">
                PNG, JPG, GIF • Max 5MB
            </p>
        </div>
    );
}
