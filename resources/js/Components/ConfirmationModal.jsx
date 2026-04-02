import React, { useEffect } from "react";
import {
    X,
    AlertTriangle,
    Trash2,
    Lock,
    LockOpen,
    CheckCircle,
    ShieldCheck,
    ShieldX,
} from "lucide-react";

/**
 * Composant Modal de Confirmation générique et réutilisable
 * Supporte: suppression, désactivation, activation, approbation, rejet, action custom
 *
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {string} type - Type d'action: "delete" | "deactivate" | "activate" | "approve" | "reject" | "custom"
 * @param {string} title - Titre du modal
 * @param {string} message - Message de confirmation
 * @param {string} confirmText - Texte du bouton de confirmation
 * @param {string} cancelText - Texte du bouton d'annulation (défaut: "Annuler")
 * @param {function} onConfirm - Fonction appelée lors de la confirmation
 * @param {function} onCancel - Fonction appelée lors de l'annulation
 * @param {boolean} loading - État de chargement
 * @param {string} itemName - Nom de l'élément (pour affichage)
 */
const ConfirmationModal = ({
    isOpen = false,
    type = "delete", // delete, deactivate, activate, approve, reject, custom
    title = "Confirmer",
    message = "Êtes-vous sûr ?",
    confirmText = "Confirmer",
    cancelText = "Annuler",
    onConfirm,
    onCancel,
    loading = false,
    itemName = "",
}) => {
    // Fermer le modal avec Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isOpen && onCancel) {
                onCancel();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onCancel]);

    // Bloquer le scroll
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

    // Configuration par type d'action
    const config = {
        delete: {
            bgGradient: "from-red-50 to-red-100/50",
            borderColor: "border-red-100",
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            bodyIconColor: "text-red-500",
            confirmBg: "bg-red-600 hover:bg-red-700 active:bg-red-800",
            confirmShadow: "shadow-red-500/30 hover:shadow-red-500/40",
            alertIcon: AlertTriangle,
            actionIcon: Trash2,
            warningText: "Cette action est irréversible. Toutes les données associées seront définitivement perdues.",
        },
        deactivate: {
            bgGradient: "from-orange-50 to-orange-100/50",
            borderColor: "border-orange-100",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            bodyIconColor: "text-orange-500",
            confirmBg: "bg-orange-600 hover:bg-orange-700 active:bg-orange-800",
            confirmShadow: "shadow-orange-500/30 hover:shadow-orange-500/40",
            alertIcon: AlertTriangle,
            actionIcon: Lock,
            warningText: "Le membre sera désactivé et ne pourra plus accéder au système.",
        },
        activate: {
            bgGradient: "from-green-50 to-green-100/50",
            borderColor: "border-green-100",
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            bodyIconColor: "text-green-500",
            confirmBg: "bg-green-600 hover:bg-green-700 active:bg-green-800",
            confirmShadow: "shadow-green-500/30 hover:shadow-green-500/40",
            alertIcon: CheckCircle,
            actionIcon: LockOpen,
            warningText: "Le membre sera activé et pourra accéder au système.",
        },
        approve: {
            bgGradient: "from-emerald-50 to-green-100/70",
            borderColor: "border-emerald-100",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-700",
            bodyIconColor: "text-emerald-600",
            confirmBg:
                "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800",
            confirmShadow:
                "shadow-emerald-500/30 hover:shadow-emerald-500/40",
            alertIcon: ShieldCheck,
            actionIcon: CheckCircle,
            warningText:
                "Cette action valide l'inscription et déclenche la création des comptes associés.",
        },
        reject: {
            bgGradient: "from-rose-50 to-red-100/60",
            borderColor: "border-rose-100",
            iconBg: "bg-rose-100",
            iconColor: "text-rose-700",
            bodyIconColor: "text-rose-600",
            confirmBg: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800",
            confirmShadow: "shadow-rose-500/30 hover:shadow-rose-500/40",
            alertIcon: ShieldX,
            actionIcon: AlertTriangle,
            warningText:
                "L'inscription sera marquée comme rejetée et restera non validée.",
        },
        custom: {
            bgGradient: "from-blue-50 to-blue-100/50",
            borderColor: "border-blue-100",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            bodyIconColor: "text-blue-500",
            confirmBg: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
            confirmShadow: "shadow-blue-500/30 hover:shadow-blue-500/40",
            alertIcon: CheckCircle,
            actionIcon: CheckCircle,
            warningText: "",
        },
    };

    const currentConfig = config[type] || config.custom;
    const AlertIcon = currentConfig.alertIcon;
    const ActionIcon = currentConfig.actionIcon;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
                aria-hidden="true"
            ></div>

            {/* Modal */}
            <div className="relative z-50 w-full max-w-lg mx-4 transform transition-all">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/70">
                    {/* Header */}
                    <div
                        className={`px-6 py-5 border-b ${currentConfig.borderColor} bg-gradient-to-r ${currentConfig.bgGradient}`}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`flex-shrink-0 w-12 h-12 rounded-full ${currentConfig.iconBg} flex items-center justify-center`}
                            >
                                <AlertIcon
                                    className={`w-6 h-6 ${currentConfig.iconColor}`}
                                />
                            </div>
                            <div className="flex-1">
                                <h3
                                    id="modal-title"
                                    className="text-lg font-bold text-gray-900"
                                >
                                    {title}
                                </h3>
                                {itemName && (
                                    <p className={`text-sm font-medium truncate ${currentConfig.iconColor}`}>
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
                            <div
                                className={`flex-shrink-0 w-10 h-10 rounded-full ${currentConfig.iconBg} flex items-center justify-center mt-0.5`}
                            >
                                <ActionIcon
                                    className={`w-5 h-5 ${currentConfig.bodyIconColor}`}
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {message}
                                </p>
                                {currentConfig.warningText && (
                                    <p className="text-gray-500 text-xs mt-2">
                                        {currentConfig.warningText}
                                    </p>
                                )}
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
                            className={`px-5 py-2.5 text-white font-semibold rounded-xl ${currentConfig.confirmBg} transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg ${currentConfig.confirmShadow}`}
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin w-4 h-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Traitement...
                                </>
                            ) : (
                                <>
                                    <ActionIcon className="w-4 h-4" />
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

export default ConfirmationModal;
