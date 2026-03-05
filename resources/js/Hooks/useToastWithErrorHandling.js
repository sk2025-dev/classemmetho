import useToast from './useToast';

export const useToastWithErrorHandling = () => {
    const toast = useToast();

    /**
     * Traiter les réponses d'erreur API
     */
    const handleApiError = (result, options = {}) => {
        const {
            showFieldHighlight = true,
            scrollToFirst = true
        } = options;

        const { error, warning, info } = toast;

        if (!result || result.success) {
            return; // Pas d'erreur
        }

        // Mettre en surbrillance les champs en erreur
        if (showFieldHighlight && result.errors) {
            highlightErrorFields(result.errors);
        }

        // Scroller jusqu'au premier champ en erreur
        if (scrollToFirst && result.field) {
            scrollToErrorField(result.field);
        }

        // Afficher le toast selon le type d'erreur
        switch (result.type) {
            case 'UniqueConstraintViolation':
                error(
                    `🔐 ${result.message}`,
                    5000
                );
                break;

            case 'ValidationError':
                const errorMessages = Object.values(result.errors || {}).flat();
                error(
                    `❌ Erreurs de validation:\n${errorMessages.join('\n')}\n\nMerci de corriger les champs marqués en rouge`,
                    6000
                );
                break;

            case 'DatabaseConstraintViolation':
                warning(
                    `⚠️ ${result.message}`,
                    5000
                );
                break;

            default:
                const errorMessage = result.message || 'Une erreur s\'est produite';
                const fullError = result.error ? `${errorMessage}\n\nDétails: ${result.error}` : errorMessage;
                error(
                    fullError,
                    5000
                );
        }
    };

    return {
        ...toast,
        handleApiError
    };
};

/**
 * Mettre en surbrillance les champs en erreur
 */
const highlightErrorFields = (errors) => {
    Object.keys(errors || {}).forEach(fieldName => {
        const cleanFieldName = fieldName.replace(/\./g, '_');
        const field = document.querySelector(
            `[name="${fieldName}"], [name="${cleanFieldName}"]`
        );

        if (field) {
            field.classList.add(
                'border-red-500',
                'border-2',
                'bg-red-50',
                'focus:ring-red-400'
            );

            // Retirer les classes après correction
            field.addEventListener('change', () => {
                field.classList.remove(
                    'border-red-500',
                    'border-2',
                    'bg-red-50',
                    'focus:ring-red-400'
                );
            });
        }
    });
};

/**
 * Scroller jusqu'au premier champ en erreur
 */
const scrollToErrorField = (fieldName) => {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
        setTimeout(() => {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            field.focus();
        }, 100);
    }
};
