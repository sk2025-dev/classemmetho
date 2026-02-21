import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Composant pour afficher les erreurs de validation de manière lisible
 * @param {string} message - Message d'erreur global
 * @param {function} onClose - Callback pour fermer le message
 */
export default function ErrorNotification({ message, onClose }) {
    if (!message) return null;

    return (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 font-medium flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    {message}
                </div>
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-shrink-0 text-red-600 hover:text-red-800 font-semibold text-sm"
                >
                    ✕ Fermer
                </button>
            )}
        </div>
    );
}
