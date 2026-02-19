import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour débouncer une valeur
 * @param {*} value - La valeur à débouncer
 * @param {number} delay - Le délai en millisecondes
 * @returns {*} La valeur debouncée
 */
export const useDebounce = (value, delay = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Créer un timer pour délay millisecondes
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Nettoyer le timer si la valeur change avant que le delay n'expire
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};

export default useDebounce;
