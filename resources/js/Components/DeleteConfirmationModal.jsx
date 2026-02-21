import React, { useEffect } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";

/**
 * Composant Modal de Confirmation de Suppression réutilisable
 *
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {string} title - Titre du modal (ex: "Supprimer le membre")
 * @param {string} message - Message de confirmation (ex: "Êtes-vous sûr de vouloir supprimer ce membre ?")
 * @param {string} confirmText - Texte du bouton de confirmation (défaut: "Supprimer")
 * @param {string} cancelText - Texte du bouton d'annulation (défaut: "Annuler")
 * @param {function} onConfirm - Fonction appelée lors de la confirmation
 * @param {function} onCancel - Fonction appelée lors de l'annulation
 * @param {boolean} loading - État de chargement (désactive le bouton de confirmation)
 * @param {string} itemName - Nom de l'élément à supprimer (pour affichage)
 */
const DeleteConfirmationModal = ({
    isOpen = false,
    title = "Confirmer la suppression",
    message = "Êtes-vous sûr de vouloir supprimer cet élément ?",
    confirmText = "Supprimer",
    cancelText = "Annuler",
    onConfirm,
    onCancel,
    loading = false,
    itemName = "",
}) => {
    // Fermer le modal avec la touche Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isOpen && onCancel) {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onCancel]);

    // Bloquer le scroll quand le modal est ouvert
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Overlay avec animation */}
            <div
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
                aria-hidden="true"
            ></div>

            {/* Modal Container */}
            <div className="relative z-50 w-full max-w-md mx-4 transform transition-all">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-red-100 bg-gradient-to-r from-red-50 to-red-100/50">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3
                                    id="modal-title"
                                    className="text-lg font-bold text-gray-900"
                                >
                                    {title}
                                </h3>
                                {itemName && (
                                    <p className="text-sm text-red-600 font-medium truncate">
                                        {itemName}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onCancel}
                                className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                                aria-label="Fermer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mt-0.5">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {message}
                                </p>
                                <p className="text-gray-500 text-xs mt-2">
                                    Cette action est irréversible. Toutes les données associées seront définitivement perdues.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="px-5 py-2.5 text-gray-700 font-semibold rounded-xl bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="px-5 py-2.5 text-white font-semibold rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-500/30 hover:shadow-red-500/40"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Suppression...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    {confirmText}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
