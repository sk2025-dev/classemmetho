import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour persister les données d'un formulaire dans le localStorage
 * @param {string} storageKey - Clé unique pour le stockage local
 * @param {any} initialValue - Valeur initiale par défaut
 * @param {Object} options - Options supplémentaires
 * @param {string[]} options.excludeKeys - Clés à exclure de la sauvegarde (comme les fichiers)
 * @param {boolean} options.skipMerge - Si true, ne pas fusionner avec les données persistées, utiliser initialValue
 * @returns {[any, function]} - [valeur, setter]
 */
export function usePersistentState(storageKey, initialValue, options = {}) {
    const { excludeKeys = [], skipMerge = false } = options;

    // État local
    const [value, setValue] = useState(() => {
        try {
            // Essayer de récupérer depuis localStorage
            const item = window.localStorage.getItem(storageKey);
            if (item && !skipMerge) {
                const parsed = JSON.parse(item);

                // Déterminer le type attendu
                const expectedType = Array.isArray(initialValue)
                    ? 'array'
                    : initialValue === null
                    ? 'null'
                    : typeof initialValue;

                // Valider le type de la donnée parsée
                const parsedType = Array.isArray(parsed)
                    ? 'array'
                    : parsed === null
                    ? 'null'
                    : typeof parsed;

                // Si les types correspondent, utiliser la donnée parsée
                // OU si initialValue est null (accepte n'importe quel type)
                if (expectedType === parsedType || expectedType === 'null') {
                    if (expectedType === 'object' && initialValue !== null) {
                        // Pour les objets, faire un merge en gardant les valeurs non vides des données persistées
                        const merged = { ...initialValue };
                        for (const key in parsed) {
                            if (parsed[key] !== "" && parsed[key] !== null && parsed[key] !== undefined) {
                                merged[key] = parsed[key];
                            }
                        }
                        // console.log(`[PersistentState] Récupération de ${storageKey} (merged):`, merged);
                        return merged;
                    } else {
                        // Pour les primitives, tableaux et null
            // console.log(`[PersistentState] Récupération de ${storageKey}:`, parsed);
                        return parsed;
                    }
                } else {
                    // Si les types ne correspondent pas, utiliser la valeur initiale
                    console.warn(`[PersistentState] Type mismatch pour ${storageKey}: expected ${expectedType}, got ${parsedType}. Utilisation de la valeur initiale.`);
                    return initialValue;
                }
            }
            // console.log(`[PersistentState] Valeur initiale pour ${storageKey}:`, initialValue);
            return initialValue;
        } catch (error) {
            console.warn(`Erreur lors de la récupération de ${storageKey} depuis localStorage:`, error);
            return initialValue;
        }
    });

    // Sauvegarder dans localStorage à chaque changement
    useEffect(() => {
        try {
            let dataToSave = value;

            // Si c'est un objet, créer une copie et exclure les clés spécifiées
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                dataToSave = { ...value };
                excludeKeys.forEach(key => {
                    if (dataToSave.hasOwnProperty(key)) {
                        delete dataToSave[key];
                    }
                });
            }

            // Validation supplémentaire: vérifier que la donnée sauvegardée a le bon type
            const expectedType = Array.isArray(initialValue)
                ? 'array'
                : initialValue === null
                ? 'null'
                : typeof initialValue;
            const saveType = Array.isArray(dataToSave)
                ? 'array'
                : dataToSave === null
                ? 'null'
                : typeof dataToSave;

            if (expectedType !== saveType && expectedType !== 'null') {
                console.warn(`[PersistentState] Type mismatch lors de la sauvegarde de ${storageKey}: expected ${expectedType}, got ${saveType}. Utilisation de initialValue.`);
                window.localStorage.setItem(storageKey, JSON.stringify(initialValue));
            } else {
                window.localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            }
            // console.log(`[PersistentState] Sauvegarde de ${storageKey}:`, dataToSave);
        } catch (error) {
            console.warn(`Erreur lors de la sauvegarde de ${storageKey} dans localStorage:`, error);
        }
    }, [storageKey, value, excludeKeys]);

    return [value, setValue];
}

/**
 * Fonction utilitaire pour déboguer les données persistées
 */
export function debugPersistedData() {
    const keys = Object.keys(window.localStorage);
    const persistedKeys = keys.filter(key => key.startsWith('register'));

    // console.log('[DEBUG] Données persistées dans localStorage:');
    persistedKeys.forEach(key => {
        try {
            const value = JSON.parse(window.localStorage.getItem(key));
            // console.log(`${key}:`, value);
        } catch (e) {
            // console.log(`${key}: [ERREUR PARSING]`);
        }
    });
}

/**
 * Fonction pour nettoyer toutes les données persistées d'un formulaire spécifique
 */
export function clearFormPersistedData(formPrefix) {
    const keys = Object.keys(window.localStorage);
    const formKeys = keys.filter(key => key.startsWith(formPrefix));

    formKeys.forEach(key => {
        window.localStorage.removeItem(key);
        // console.log(`[DEBUG] Supprimé: ${key}`);
    });
}

/**
 * Fonction pour nettoyer les anciennes données persistées d'étapes
 */
export function clearOldStepData() {
    const keys = Object.keys(window.localStorage);
    const oldStepKeys = keys.filter(key => key.endsWith('_step'));

    oldStepKeys.forEach(key => {
        window.localStorage.removeItem(key);
        // console.log(`[DEBUG] Ancienne clé d'étape supprimée: ${key}`);
    });
}
