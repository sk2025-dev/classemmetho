/**
 * Migrer et nettoyer les données localStorage corrompues
 * Appeler cette fonction au démarrage de l'application
 */
export function migrateCorruptedStorageData() {
    try {
        const keysToMigrate = [
            { key: 'registerFamille_classesSearchTerm', expectedType: 'string', initialValue: '' },
            { key: 'registerFamille_villesSearchTerm', expectedType: 'string', initialValue: '' },
            { key: 'registerFamille_adresseInputValue', expectedType: 'string', initialValue: '' },
            { key: 'registerFamille_membres', expectedType: 'array', initialValue: [] },
            { key: 'registerFamille_consentement', expectedType: 'boolean', initialValue: false },
            { key: 'registerConducteur_classesSearchTerm', expectedType: 'string', initialValue: '' },
            { key: 'registerConducteur_villesSearchTerm', expectedType: 'string', initialValue: '' },
        ];

        keysToMigrate.forEach(({ key, expectedType, initialValue }) => {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    const actualType = Array.isArray(parsed) ? 'array' : typeof parsed;

                    // Vérifier s'il y a une corruption (type ne correspond pas)
                    if (actualType !== expectedType) {
                        console.warn(
                            `[Migration] Donnée corrompue détectée: ${key}`,
                            `Expected: ${expectedType}, Got: ${actualType}`,
                            `Valeur: ${stored}`
                        );
                        // Remplacer par la valeur initiale
                        localStorage.setItem(key, JSON.stringify(initialValue));
                        console.log(`[Migration] ✓ ${key} réinitialisé à`, initialValue);
                    }
                } catch (parseError) {
                    console.warn(`[Migration] Erreur parsing ${key}:`, parseError.message);
                    localStorage.removeItem(key);
                }
            }
        });

        console.log('[Migration] Nettoyage du localStorage terminé');
    } catch (error) {
        console.error('[Migration] Erreur lors de la migration:', error);
    }
}
