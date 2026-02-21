# 🚀 API Réponses d'Erreur - Système de Gestion des Contraintes UNIQUE

## 📋 Vue d'ensemble

Le système de gestion des erreurs UNIQUE a été conçu pour fournir des **messages clairs et exploitables à l'utilisateur** via des **Toast Notifications**.

---

## 🎯 Architecture

```
RegistrationController / AdminInscriptionsController
        ↓
UniqueConstraintChecker (Service)
        ↓
UniqueConstraintViolationException (Exception)
        ↓
Handler (Exception Handler Global)
        ↓
JSON Response → Frontend Toast
```

---

## 📤 FORMAT DES RÉPONSES

### ✅ Réponse de Succès

```json
{
    "success": true,
    "message": "Opération réussie",
    "data": {
        "inscription_id": 42,
        "type": "famille",
        "status": "en_attente"
    },
    "timestamp": "2026-02-09T17:31:30+00:00"
}
```

**Status HTTP**: `200` ou `201`

---

### ❌ Erreur Validation (Email)

```json
{
    "success": false,
    "message": "Cet email est déjà utilisé. Merci d'utiliser une autre adresse email.",
    "field": "email",
    "value": "jean@example.com",
    "type": "UniqueConstraintViolation",
    "errors": [
        {
            "field": "email",
            "value": "jean@example.com",
            "table": "users",
            "message": "Cet email est déjà utilisé. Merci d'utiliser une autre adresse email.",
            "type": "UniqueConstraintViolation"
        }
    ],
    "timestamp": "2026-02-09T17:31:30+00:00"
}
```

**Status HTTP**: `422` (Unprocessable Entity)

---

### ❌ Erreur Base de Données (Constraint violation)

```json
{
    "success": false,
    "message": "La valeur 'jean@example.com' existe déjà dans la base de données.",
    "field": "email",
    "value": "jean@example.com",
    "type": "DatabaseConstraintViolation",
    "timestamp": "2026-02-09T17:31:30+00:00"
}
```

**Status HTTP**: `422`

---

### ❌ Erreur Validation Formulaire (Multiple)

```json
{
    "success": false,
    "message": "Erreur de validation",
    "type": "ValidationError",
    "errors": {
        "responsable.email": [
            "Cet email est déjà utilisé."
        ],
        "responsable.nom": [
            "Le champ nom est requis."
        ],
        "membres.0.telephone": [
            "Le format du téléphone est invalide."
        ]
    },
    "timestamp": "2026-02-09T17:31:30+00:00"
}
```

**Status HTTP**: `422`

---

## 🎨 GESTION DANS LE FRONTEND

### Type Toast pour chaque erreur

#### Email duplicué

```javascript
showError(
    "🔐 Email déjà utilisé",
    "Cet email est déjà enregistré. Utilisez une autre adresse email."
);
```

#### Inscription en attente

```javascript
showWarning(
    "⏳ Inscription en cours",
    "Une inscription avec cet email est actuellement en attente de validation. Contactez l'administrateur si vous avez des questions."
);
```

#### Format invalide

```javascript
showError(
    "❌ Format invalide",
    "Veuillez corriger les champs en rouge avant de continuer."
);
```

---

## 📱 INTÉGRATION AVEC USETOAST HOOK

### Hook existant à utiliser

```javascript
// Fichier: resources/js/Hooks/useToast.js
const useToast = () => {
    return {
        showSuccess: (message) => { /* ... */ },
        showError: (message) => { /* ... */ },
        showWarning: (message) => { /* ... */ },
        showInfo: (message) => { /* ... */ },
    };
};
```

### Exemple dans un formulaire

```javascript
import { useToast } from '@/Hooks/useToast';

export default function RegisterForm() {
    const { showError, showWarning, showSuccess } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            // ✅ Succès
            if (result.success) {
                showSuccess(result.message);
                // Rediriger l'utilisateur...
            } 
            // ❌ Erreur
            else {
                // Traiter selon le type d'erreur
                if (result.type === 'UniqueConstraintViolation') {
                    showError(`🔐 ${result.message}`);
                    highlightField(result.field); // Mettre en rouge le champ
                } 
                else if (result.type === 'ValidationError') {
                    showError("❌ Veuillez corriger les erreurs du formulaire");
                    displayInlineErrors(result.errors); // Afficher les erreurs par champ
                }
                else if (result.type === 'DatabaseConstraintViolation') {
                    showWarning(`⚠️ Données en conflit: ${result.message}`);
                }
            }
        } catch (err) {
            showError("Une erreur système s'est produite. Veuillez réessayer.");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* ... */}
        </form>
    );
}
```

---

## 🎯 LOGIQUE DE TRAITEMENT DES ERREURS

### 1. Extraire le type d'erreur

```javascript
const getErrorType = (response) => {
    if (response.type === 'UniqueConstraintViolation') {
        return 'DUPLICATE';
    } else if (response.type === 'ValidationError') {
        return 'VALIDATION';
    } else if (response.type === 'DatabaseConstraintViolation') {
        return 'DATABASE';
    }
    return 'UNKNOWN';
};
```

### 2. Afficher le toast approprié

```javascript
const handleApiError = (result) => {
    const { showError, showWarning, showInfo } = useToast();
    
    switch (result.type) {
        case 'UniqueConstraintViolation':
            showError(
                `🔐 Données déjà utilisées\n${result.message}`,
                { duration: 5000 }
            );
            break;
            
        case 'ValidationError':
            const errorCount = Object.keys(result.errors || {}).length;
            showError(
                `❌ ${errorCount} erreur(s) de validation\nMerci de corriger les champs en rouge`,
                { duration: 4000 }
            );
            break;
            
        case 'DatabaseConstraintViolation':
            showWarning(
                `⚠️ Conflit de données\n${result.message}`,
                { duration: 5000 }
            );
            break;
            
        default:
            showError('Une erreur s\'est produite');
    }
};
```

### 3. Mettre en surbrillance les champs en erreur

```javascript
const highlightErrorFields = (errors) => {
    const errorFields = document.querySelectorAll('input, textarea, select');
    
    errorFields.forEach(field => {
        field.classList.remove('border-red-500', 'bg-red-50');
        
        // Vérifier si ce champ est en erreur
        for (const [fieldName] of Object.entries(errors || {})) {
            if (fieldName.includes(field.name)) {
                field.classList.add('border-red-500', 'bg-red-50');
                break;
            }
        }
    });
};
```

---

## 📊 MESSAGES PRÉDÉFINIS

### Par champ

| Champ | Message de succes | Message d'erreur |
|-------|------------------|------------------|
| `email` | Email validé ✓ | Cet email est déjà utilisé |
| `telephone` | Numéro enregistré ✓ | Ce numéro est déjà utilisé |
| `nom` | Nom accepté ✓ | Ce nom existe déjà |
| `identifier` | ID généré ✓ | Cet identifiant est déjà pris |

### Par statut HTTP

| Code | Signification | Toast |
|------|--------------|-------|
| `200` | ✅ Succès | Vert - "Opération réussie" |
| `201` | ✅ Créé | Vert - "Inscription créée avec succès" |
| `400` | ❌ Mauvaise requête | Rouge - "Données invalides" |
| `409` | ⚠️ Conflit | Orange - "Données en conflit" |
| `422` | ❌ Non traitable | Rouge - Message spécifique |
| `500` | ❌ Erreur serveur | Rouge - "Erreur du serveur" |

---

## 🔧 UTILISATION DU SERVICE DANS LES CONTRÔLEURS

### Exemple: RegistrationController

```php
<?php

class RegistrationController extends Controller
{
    use HandlesUniqueConstraintViolations;

    public function store(Request $request)
    {
        try {
            $this->initializeUniqueChecker();
            $checker = app(UniqueConstraintChecker::class);

            // Vérifier l'email
            $checker->checkEmailUnique($request->email);

            // ✅ Si pas d'exception, créer l'inscription
            $inscription = Inscription::create([
                'email' => $request->email,
                // ...
            ]);

            return $this->successResponse(
                data: $inscription->toArray(),
                message: 'Inscription créée avec succès'
            );

        } catch (UniqueConstraintViolationException $e) {
            return $this->errorResponse(
                message: $e->getHumanMessage(),
                field: $e->getField(),
                value: $e->getValue(),
                statusCode: 422,
                errorData: $e->toArray()
            );
        }
    }
}
```

---

## ✅ CHECKLIST D'INTÉGRATION FRONTEND

- [ ] Hook `useToast` disponible dans toutes les pages
- [ ] Traitement des 4 types d'erreurs: UNIQUE, VALIDATION, DATABASE, UNKNOWN
- [ ] Affichage des toasts avec couleurs appropriées
- [ ] Mise en surbrillance des champs en erreur
- [ ] Messages utilisateur clairs et en français
- [ ] Durée de display appropriée pour chaque type
- [ ] Icones/emojis ajoutés pour meilleure UX
- [ ] Gestion du scroll to first error field
- [ ] Désactivation du bouton submit pendant le traitement
- [ ] Logging des erreurs critiques (500 error)

---

## 📞 RÉFÉRENCES

- Service: `app/Services/UniqueConstraintChecker.php`
- Exception: `app/Exceptions/UniqueConstraintViolationException.php`
- Trait: `app/Traits/HandlesUniqueConstraintViolations.php`
- Handler: `app/Exceptions/Handler.php`
- Hook: `resources/js/Hooks/useToast.js`
