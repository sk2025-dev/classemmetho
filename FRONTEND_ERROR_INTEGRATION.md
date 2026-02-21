# 🎨 Guide Frontend - Intégration des Erreurs de Contrainte UNIQUE

## 📱 Intégration avec le Hook useToast

### Structure complète

```javascript
// File: resources/js/Hooks/useToastWithErrorHandling.js
import { useToast } from '@/Hooks/useToast';

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

        const { showError, showWarning, showInfo } = toast;

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
                showError(
                    `🔐 ${result.message}`,
                    { duration: 5000 }
                );
                break;

            case 'ValidationError':
                const errorCount = Object.keys(result.errors || {}).length;
                showError(
                    `❌ ${errorCount} erreur(s) de validation\nMerci de corriger les champs marqués en rouge`,
                    { duration: 4000 }
                );
                break;

            case 'DatabaseConstraintViolation':
                showWarning(
                    `⚠️ ${result.message}`,
                    { duration: 5000 }
                );
                break;

            default:
                showError(
                    result.message || 'Une erreur s\'est produite',
                    { duration: 3000 }
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
```

---

## 🎯 Exemple: Formulaire d'Inscription Famille

```javascript
// File: resources/js/Pages/Inscriptions/RegisterFamille.jsx
import React, { useState } from 'react';
import { useToastWithErrorHandling } from '@/Hooks/useToastWithErrorHandling';

export default function RegisterFamille() {
    const { showSuccess, handleApiError, showInfo } = useToastWithErrorHandling();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        nom: '',
        prenom: '',
        // ...
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            // ✅ Succès
            if (result.success) {
                showSuccess('✨ Inscription créée avec succès!');
                // Rediriger après 2 secondes
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            }
            // ❌ Erreur
            else {
                handleApiError(result, {
                    showFieldHighlight: true,
                    scrollToFirst: true
                });
            }
        } catch (error) {
            handleApiError({
                type: 'NetworkError',
                message: 'Erreur de connexion. Veuillez vérifier votre connexion internet.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            {/* Email - Champ critique */}
            <div className="mb-6">
                <label className="block text-sm font-bold mb-2">
                    Email *
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="exemple@domain.com"
                    required
                    disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Si ce message apparaît: "Email déjà utilisé" → Utilisez une autre adresse
                </p>
            </div>

            {/* Bouton Submit */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre'}
            </button>
        </form>
    );
}
```

---

## 🎨 Styles Tailwind pour les champs en erreur

```javascript
// File: resources/css/error-states.css
/* État d'erreur pour les inputs */
input.border-red-500,
textarea.border-red-500,
select.border-red-500 {
    @apply border-2 border-red-500 bg-red-50 focus:ring-red-400 focus:border-red-500;
}

/* Classe pour afficher le message d'erreur */
.error-message {
    @apply text-red-600 text-sm mt-1 font-medium flex items-center gap-1;
}

.error-message::before {
    content: '⚠️';
    @apply text-lg;
}

/* Toast success */
.toast-success {
    @apply bg-green-100 border border-green-400 text-green-800;
}

/* Toast error */
.toast-error {
    @apply bg-red-100 border border-red-400 text-red-800;
}

/* Toast warning */
.toast-warning {
    @apply bg-yellow-100 border border-yellow-400 text-yellow-800;
}
```

---

## 🔄 Cas d'erreur spécifiques

### 1. Email déjà utilisé par un user

**Réponse backend:**
```json
{
    "success": false,
    "message": "Cet email est déjà utilisé. Merci d'utiliser une autre adresse email.",
    "field": "email",
    "type": "UniqueConstraintViolation"
}
```

**Toast à afficher:**
```javascript
showError(
    "🔐 Cet email est déjà utilisé\nVeuillez utiliser une autre adresse email",
    { icon: 'lock', duration: 5000 }
);
```

---

### 2. Inscription en attente avec cet email

**Réponse backend:**
```json
{
    "success": false,
    "message": "Une inscription est déjà en cours avec cet email. Veuillez attendre l'approbation ou contacter l'administrateur.",
    "field": "email",
    "type": "UniqueConstraintViolation"
}
```

**Toast à afficher:**
```javascript
showWarning(
    "⏳ Inscription en attente\nUne inscription avec cet email est en attente de validation",
    { duration: 5000 }
);
```

---

### 3. Multiple erreurs de validation

**Réponse backend:**
```json
{
    "success": false,
    "message": "Erreur de validation",
    "type": "ValidationError",
    "errors": {
        "email": ["Le format de l'email est invalide"],
        "nom": ["Le nom est requis"],
        "membres.0.telephone": ["Le format du téléphone est invalide"]
    }
}
```

**Affichage:**
```javascript
// Toast principal
showError(
    "❌ 3 erreur(s) de validation\nMerci de corriger les champs marqués en rouge",
    { duration: 4000 }
);

// Détail pour chaque champ
Object.entries(errors).forEach(([field, messages]) => {
    const input = document.querySelector(`[name="${field}"]`);
    if (input) {
        // Ajouter visual indication
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = messages[0];
        input.parentElement.appendChild(errorElement);
    }
});
```

---

## 📝 Exemple complet: RegisterPasteur.jsx

```javascript
import React, { useState, useCallback } from 'react';
import { useToastWithErrorHandling } from '@/Hooks/useToastWithErrorHandling';

export default function RegisterPasteur() {
    const { showSuccess, showError, handleApiError } = useToastWithErrorHandling();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        type: 'pasteur',
        responsable: { email: '' },
        membres: [],
    });

    const validateEmailDuplicate = useCallback((emails) => {
        const seen = new Set();
        for (const email of emails) {
            if (!email) continue;
            if (seen.has(email)) {
                return `Email '${email}' est utilisé plusieurs fois`;
            }
            seen.add(email);
        }
        return null;
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validation côté client
        const allEmails = [
            formData.responsable.email,
            ...formData.membres.map(m => m.email).filter(Boolean)
        ];

        const duplicateError = validateEmailDuplicate(allEmails);
        if (duplicateError) {
            showError(`❌ ${duplicateError}`);
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/admin/inscriptions/pasteur', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                showSuccess('✨ Inscription pasteur créée avec succès!');
                setTimeout(() => {
                    window.location.href = '/admin/inscriptions';
                }, 2000);
            } else {
                handleApiError(result, {
                    showFieldHighlight: true,
                    scrollToFirst: true
                });
            }
        } catch (err) {
            showError('❌ Erreur de connexion. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Responsable */}
            <fieldset className="mb-8 p-6 border border-blue-200 rounded-lg">
                <legend className="text-lg font-bold text-blue-900 mb-4">
                    👤 Responsable (Pasteur)
                </legend>

                <input
                    type="email"
                    name="responsable.email"
                    placeholder="email@example.com"
                    value={formData.responsable.email}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            responsable: { ...formData.responsable, email: e.target.value }
                        })
                    }
                    disabled={isSubmitting}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                />
            </fieldset>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
                {isSubmitting ? '⏳ Envoi...' : '📤 Soumettre'}
            </button>
        </form>
    );
}
```

---

## ✅ Checklist d'implémentation

- [ ] Hook `useToastWithErrorHandling` créé et importé partout
- [ ] Fonction `handleApiError` appelée pour toutes les erreurs API
- [ ] Classes Tailwind pour champs en erreur appliquées
- [ ] Validation côté client des doublons d'email avant envoi
- [ ] Scroll to first error field implémenté
- [ ] Messages en français pour tous les types d'erreurs
- [ ] Toast success affiché après approbation
- [ ] Bouton submit désactivé pendant le traitement
- [ ] Gestion des erreurs réseau
- [ ] Tests avec données réelles

---

## 📞 Fichiers à consulter

- `resources/js/Hooks/useToastWithErrorHandling.js` (À créer)
- `resources/css/error-states.css` (À créer)
- `API_ERROR_RESPONSES.md` (Documentation API)
