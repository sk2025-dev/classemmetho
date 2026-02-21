#!/bin/bash
# Script d'exécution de la migration de refactoring

echo "========================================"
echo "Migration de Refactoring - Suppression du Type 'Individuel'"
echo "========================================"
echo ""
echo "Cette migration:"
echo "  1. Supprime le type 'individuel' de l'enum inscriptions.type"
echo "  2. Supprime les enregistrements inscriptions de type 'individuel'"
echo "  3. Supprime le champ 'adresse' de la table users"
echo "  4. Ajoute les champs spirituels manquants"
echo "  5. Ajoute les index de performance"
echo ""
echo "========================================"
echo ""

# Exécuter la migration
echo "Exécution de la migration..."
php artisan migrate

echo ""
echo "========================================"
echo "Vérification du statut des migrations..."
php artisan migrate:status

echo ""
echo "========================================"
echo "✅ Migration terminée !"
echo ""
echo "Prochaines étapes:"
echo "  1. Tester le formulaire Responsable de Famille"
echo "  2. Tester le formulaire Pasteur"
echo "  3. Tester le formulaire Conducteur"
echo "  4. Vérifier que les données spirituelles sont complètes"
echo ""
