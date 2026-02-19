/**
 * Hook personnalisé pour les appels API avec gestion d'erreur
 * Utilisé pour charger les données côté frontend de manière sécurisée
 */
import { useState, useEffect, useRef } from 'react'

export function useFetch(url, options = {}) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const abortControllerRef = useRef(null)
    const cacheRef = useRef({})

    useEffect(() => {
        // Vérifier le cache
        if (cacheRef.current[url]) {
            setData(cacheRef.current[url])
            setLoading(false)
            return
        }

        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Créer un nouvel AbortController pour chaque fetch
                abortControllerRef.current = new AbortController()

                const response = await fetch(url, {
                    ...options,
                    signal: abortControllerRef.current.signal,
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const result = await response.json()
                cacheRef.current[url] = result
                setData(result)
            } catch (err) {
                // Ne pas afficher l'erreur si la requête a été annulée
                if (err.name !== 'AbortError') {
                    console.error('Erreur fetch:', err)
                    setError(err.message)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        // Cleanup
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [url])

    return { data, loading, error }
}

/**
 * Hook pour soumettre des formulaires avec gestion d'erreur
 */
export function useSubmit() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)

    const submit = async (url, formData, options = {}) => {
        try {
            setIsSubmitting(true)
            setError(null)

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formData),
                ...options,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || `Erreur HTTP: ${response.status}`)
            }

            return await response.json()
        } catch (err) {
            console.error('Erreur submission:', err)
            setError(err.message)
            throw err
        } finally {
            setIsSubmitting(false)
        }
    }

    return { submit, isSubmitting, error }
}

/**
 * Fonction utilitaire pour débouncer les appels API
 */
export function debounce(func, delay = 300) {
    let timeoutId
    return (...args) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            func(...args)
        }, delay)
    }
}

/**
 * Fonction pour gérer les erreurs API globalement
 */
export function handleApiError(error) {
    if (error.response) {
        // Le serveur a répondu avec un statut d'erreur
        const { status, data } = error.response
        console.error(`Erreur API ${status}:`, data)

        if (status === 401) {
            // Non authentifié - rediriger vers login
            window.location.href = '/login'
        } else if (status === 403) {
            // Accès refusé
            return 'Vous n\'avez pas la permission d\'accéder à cette ressource'
        } else if (status === 422) {
            // Erreur de validation
            return data.message || 'Les données fournies sont invalides'
        } else if (status === 500) {
            // Erreur serveur
            return 'Une erreur serveur s\'est produite. Veuillez réessayer'
        }

        return data.message || 'Une erreur est survenue'
    } else if (error.request) {
        // La requête a été faite mais pas de réponse
        console.error('Pas de réponse du serveur:', error.request)
        return 'Impossible de contacter le serveur. Vérifiez votre connexion'
    } else {
        // Erreur lors de la configuration de la requête
        console.error('Erreur requête:', error.message)
        return error.message
    }
}
