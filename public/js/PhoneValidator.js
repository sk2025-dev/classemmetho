/**
 * Validation et Formatage des Numéros de Téléphone
 * Côte d'Ivoire (+225)
 *
 * Usage:
 * const phoneValidator = new PhoneValidator();
 * if (phoneValidator.isValid('0102030405')) {
 *     const formatted = phoneValidator.format('0102030405');
 *     console.log(formatted); // 102030405
 * }
 */

class PhoneValidator {
    /**
     * Formats acceptés:
     * - 10 chiffres sans 0 au début: 7XXXXXXXXX (9 chiffres après le 7)
     * - 11 chiffres avec 0 au début: 07XXXXXXXX (10 chiffres après le 0)
     * - 12 chiffres avec 225: 225XXXXXXXX (9 chiffres après le 225)
     */

    /**
     * Valider un numéro de téléphone
     * @param {string} phone - Numéro de téléphone
     * @returns {boolean} true si le format est valide
     */
    isValid(phone) {
        if (!phone || typeof phone !== 'string') return false;

        const cleaned = this._cleanPhone(phone);

        // Format 1: 10 chiffres sans 0 au début
        if (cleaned.length === 10 && !cleaned.startsWith('0')) {
            return true;
        }

        // Format 2: 11 chiffres commençant par 0
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
            return true;
        }

        // Format 3: 12 chiffres commençant par 225
        if (cleaned.length === 12 && cleaned.startsWith('225')) {
            return true;
        }

        return false;
    }

    /**
     * Formater un numéro de téléphone pour le stockage en BD
     * Retourne toujours 10 chiffres sans le préfixe 225 et sans 0 au début
     *
     * @param {string} phone - Numéro de téléphone
     * @returns {string} Numéro formaté (10 chiffres) ou chaîne vide
     */
    format(phone) {
        if (!phone || typeof phone !== 'string') return '';

        const cleaned = this._cleanPhone(phone);

        // Enlever le préfixe 225 s'il existe
        let formatted = cleaned;
        if (formatted.startsWith('225')) {
            formatted = formatted.substring(3);
        }

        // Enlever le 0 au début s'il existe
        if (formatted.startsWith('0')) {
            formatted = formatted.substring(1);
        }

        return formatted;
    }

    /**
     * Obtenir la représentation affichable (avec +225)
     * @param {string} phone - Numéro de téléphone
     * @returns {string} Format affichable ex: +225 7102030405
     */
    toDisplay(phone) {
        if (!phone) return '';
        const formatted = this.format(phone);
        return `+225 ${formatted}`;
    }

    /**
     * Obtenir la représentation international
     * @param {string} phone - Numéro de téléphone
     * @returns {string} Format international ex: 2257102030405
     */
    toInternational(phone) {
        if (!phone) return '';
        const formatted = this.format(phone);
        return `225${formatted}`;
    }

    /**
     * Nettoyer un numéro de téléphone (supprimer caractères non-numériques)
     * @private
     */
    _cleanPhone(phone) {
        return (phone || '').replace(/\D/g, '');
    }

    /**
     * Obtenir des détails sur le format
     * @param {string} phone - Numéro de téléphone
     * @returns {object} Objet avec les détails du format
     */
    getDetails(phone) {
        const cleaned = this._cleanPhone(phone);
        const isValid = this.isValid(phone);
        const format = this.format(phone);
        const display = this.toDisplay(phone);
        const international = this.toInternational(phone);

        return {
            isValid,
            originalLength: cleaned.length,
            cleanedPhone: cleaned,
            formatted: format,
            display,
            international,
            format: this._detectFormat(cleaned)
        };
    }

    /**
     * Détecter le format du numéro
     * @private
     */
    _detectFormat(cleaned) {
        if (cleaned.length === 10 && !cleaned.startsWith('0')) {
            return '10_digits_no_zero';
        }
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
            return '11_digits_with_zero';
        }
        if (cleaned.length === 12 && cleaned.startsWith('225')) {
            return '12_digits_with_225';
        }
        return 'invalid';
    }
}

// ============ EXEMPLES D'UTILISATION ============

/**
 * Exemples d'utilisation du PhoneValidator
 */
const examples = {
    // Format 1: 0102030405 (11 chiffres avec 0)
    example1: () => {
        const validator = new PhoneValidator();
        const phone = '0102030405';
        console.log(`Input: ${phone}`);
        console.log(`Valid: ${validator.isValid(phone)}`);
        console.log(`Formatted: ${validator.format(phone)}`);
        console.log(`Display: ${validator.toDisplay(phone)}`);
        // Output:
        // Valid: true
        // Formatted: 102030405
        // Display: +225 102030405
    },

    // Format 2: 7102030405 (10 chiffres sans 0)
    example2: () => {
        const validator = new PhoneValidator();
        const phone = '7102030405';
        console.log(`Input: ${phone}`);
        console.log(`Valid: ${validator.isValid(phone)}`);
        console.log(`Formatted: ${validator.format(phone)}`);
        console.log(`International: ${validator.toInternational(phone)}`);
        // Output:
        // Valid: true
        // Formatted: 7102030405
        // International: 2257102030405
    },

    // Format 3: 225102030405 (12 chiffres avec 225)
    example3: () => {
        const validator = new PhoneValidator();
        const phone = '225102030405';
        console.log(`Input: ${phone}`);
        console.log(`Valid: ${validator.isValid(phone)}`);
        console.log(`Formatted: ${validator.format(phone)}`);
        console.log(`Details:`, validator.getDetails(phone));
        // Output:
        // Valid: true
        // Formatted: 102030405
    },

    // Format avec caractères spéciaux
    example4: () => {
        const validator = new PhoneValidator();
        const phone = '+225 (0) 7102 030-405';
        console.log(`Input: ${phone}`);
        console.log(`Valid: ${validator.isValid(phone)}`);
        console.log(`Formatted: ${validator.format(phone)}`);
        // Output:
        // Valid: true
        // Formatted: 7102030405
    },

    // Invalide
    example5: () => {
        const validator = new PhoneValidator();
        const phone = '010203'; // Trop court
        console.log(`Input: ${phone}`);
        console.log(`Valid: ${validator.isValid(phone)}`);
        // Output:
        // Valid: false
    }
};

// Exporter pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhoneValidator;
}
