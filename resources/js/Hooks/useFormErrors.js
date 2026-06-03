import { useEffect, useState } from 'react';
import { focusFirstErrorField } from "../Utils/formFeedback";

/**
 * Hook pour gérer les erreurs de validation (client + serveur)
 * @returns {object} - { errors, serverErrors, globalError, setServerErrors, setGlobalError, setErrors, getFieldError, clearErrors }
 */
export function useFormErrors() {
    const [errors, setErrors] = useState({});
    const [serverErrors, setServerErrors] = useState({});
    const [globalError, setGlobalError] = useState(null);

    useEffect(() => {
        const mergedErrors = {
            ...serverErrors,
            ...errors,
        };

        if (Object.keys(mergedErrors).length === 0) {
            return;
        }

        focusFirstErrorField(mergedErrors);
    }, [errors, serverErrors]);

    /**
     * Récupère l'erreur pour un champ (client ou serveur)
     * @param {string} fieldName - Nom du champ (ex: "responsable.email")
     * @returns {string|null} - Message d'erreur ou null
     */
    const getFieldError = (fieldName) => {
        // Vérifier les erreurs locales d'abord
        if (errors[fieldName]) {
            return errors[fieldName];
        }
        // Puis les erreurs du serveur
        if (serverErrors[fieldName]) {
            const serverError = serverErrors[fieldName];
            // Si c'est un tableau, prendre le premier message
            return Array.isArray(serverError) ? serverError[0] : serverError;
        }
        return null;
    };

    /**
     * Efface toutes les erreurs
     */
    const clearErrors = () => {
        setErrors({});
        setServerErrors({});
        setGlobalError(null);
    };

    /**
     * Traite les erreurs du serveur
     * @param {object} apiErrorsData - Les erreurs du serveur (format Laravel)
     * @param {string} customMessage - Message personnalisé (optionnel)
     */
    const handleServerErrors = (apiErrorsData, customMessage = "⚠️ Veuillez corriger les erreurs ci-dessous.") => {
        if (Object.keys(apiErrorsData).length > 0) {
            setServerErrors(apiErrorsData);
            setGlobalError(customMessage);
        }
    };

    /**
     * Affiche un message d'erreur global
     * @param {string} message - Message d'erreur
     */
    const showError = (message) => {
        setGlobalError(`❌ ${message}`);
    };

    return {
        errors,
        setErrors,
        serverErrors,
        setServerErrors,
        globalError,
        setGlobalError,
        getFieldError,
        clearErrors,
        handleServerErrors,
        showError,
    };
}
