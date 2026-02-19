import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour synchroniser les données d'administration en temps réel
 * @param {string} endpoint - L'endpoint API à appeler (ex: '/api/admin/classes')
 * @param {array} initialData - Les données initiales
 * @returns {object} { data, isLoading, error, refresh }
 */
export function useSyncAdminData(endpoint, initialData = []) {
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fonction de synchronisation
    const refresh = useCallback(async () => {
        if (!endpoint) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(endpoint, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Adapter selon la structure de réponse
                const newData = result.classes || result.fonctions || result.data || [];
                setData(Array.isArray(newData) ? newData : [newData]);
            } else {
                setError(result.message || 'Erreur de synchronisation');
            }
        } catch (err) {
            console.error('Erreur de synchronisation:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [endpoint]);

    // Synchronisation initiale
    useEffect(() => {
        if (endpoint && initialData.length === 0) {
            refresh();
        }
    }, [endpoint, refresh, initialData.length]);

    return {
        data,
        isLoading,
        error,
        refresh,
        setData, // Pour les mises à jour locales optimistes
    };
}

/**
 * Hook pour gérer les opérations CRUD sur une ressource admin
 */
export function useAdminCRUD(resourceName) {
    const endpoint = `/api/admin/${resourceName}`;
    const { data, isLoading, error, refresh, setData } = useSyncAdminData(endpoint);

    const create = useCallback(async (itemData) => {
        try {
            setData(prev => [...prev, { ...itemData, id: 'temp-' + Date.now() }]); // Optimistic update

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'include',
                body: JSON.stringify(itemData),
            });

            if (!response.ok) throw new Error('Erreur création');

            const result = await response.json();
            if (result.success) {
                await refresh();
                return result;
            }
        } catch (err) {
            await refresh(); // Rollback
            throw err;
        }
    }, [endpoint, refresh, setData]);

    const update = useCallback(async (id, itemData) => {
        try {
            const oldData = data;
            setData(prev => prev.map(item => item.id === id ? { ...item, ...itemData } : item)); // Optimistic update

            const response = await fetch(`${endpoint}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'include',
                body: JSON.stringify(itemData),
            });

            if (!response.ok) throw new Error('Erreur mise à jour');

            const result = await response.json();
            if (result.success) {
                await refresh();
                return result;
            }
        } catch (err) {
            setData(oldData); // Rollback
            throw err;
        }
    }, [endpoint, data, refresh, setData]);

    const delete_ = useCallback(async (id) => {
        try {
            const oldData = data;
            setData(prev => prev.filter(item => item.id !== id)); // Optimistic update

            const response = await fetch(`${endpoint}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Erreur suppression');

            const result = await response.json();
            if (result.success) {
                await refresh();
                return result;
            }
        } catch (err) {
            setData(oldData); // Rollback
            throw err;
        }
    }, [endpoint, data, refresh, setData]);

    return {
        data,
        isLoading,
        error,
        refresh,
        create,
        update,
        delete: delete_,
    };
}

export default useSyncAdminData;
