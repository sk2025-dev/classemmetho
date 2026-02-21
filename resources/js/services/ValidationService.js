/**
 * Service de validation des formulaires
 * Utilisé pour valider les données avant soumission
 */

export class ValidationService {
    /**
     * Valider un email
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    /**
     * Valider un numéro de téléphone (format ivoirien +225)
     */
    static isValidPhone(phone) {
        // Format: 10 chiffres ou +225XXXXXXXXX
        const phoneRegex = /^(?:\+225)?[0-9]{10}$/
        return phoneRegex.test(phone.replace(/[\s\-]/g, ''))
    }

    /**
     * Valider un mot de passe
     * Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
     */
    static isValidPassword(password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{8,}$/
        return passwordRegex.test(password)
    }

    /**
     * Valider une date
     */
    static isValidDate(dateString) {
        const date = new Date(dateString)
        return date instanceof Date && !isNaN(date)
    }

    /**
     * Valider l'age (>= 18 ans par défaut)
     */
    static isValidAge(dateString, minAge = 18) {
        const date = new Date(dateString)
        const today = new Date()
        const age = today.getFullYear() - date.getFullYear()
        const monthDiff = today.getMonth() - date.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
            return age - 1 >= minAge
        }
        return age >= minAge
    }

    /**
     * Valider un nom (au moins 2 caractères)
     */
    static isValidName(name) {
        return name && name.trim().length >= 2
    }

    /**
     * Valider un formulaire complet
     */
    static validateForm(data, rules) {
        const errors = {}

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field]

            // Champ requis
            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = 'Ce champ est requis'
                continue
            }

            // Validation spécifique
            if (rule.type === 'email' && value && !this.isValidEmail(value)) {
                errors[field] = 'Email invalide'
            } else if (rule.type === 'phone' && value && !this.isValidPhone(value)) {
                errors[field] = 'Numéro de téléphone invalide'
            } else if (rule.type === 'password' && value && !this.isValidPassword(value)) {
                errors[field] = 'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial'
            } else if (rule.type === 'date' && value && !this.isValidDate(value)) {
                errors[field] = 'Date invalide'
            } else if (rule.minLength && value && value.length < rule.minLength) {
                errors[field] = `Minimum ${rule.minLength} caractères`
            } else if (rule.maxLength && value && value.length > rule.maxLength) {
                errors[field] = `Maximum ${rule.maxLength} caractères`
            } else if (rule.custom && value && !rule.custom(value)) {
                errors[field] = rule.message || 'Valeur invalide'
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        }
    }
}

/**
 * Créer des règles de validation courantes
 */
export const validationRules = {
    email: { required: true, type: 'email' },
    password: { required: true, type: 'password' },
    name: { required: true, minLength: 2 },
    phone: { required: true, type: 'phone' },
    date: { required: true, type: 'date' },
}
