# 🔐 Contraintes d'Unicité et Blocage des Doublons - Documentation Complète

## 📊 Vue d'ensemble du système

Le projet utilise un système multicouche pour éviter les doublons :
1. **Contraintes DB** (migrations) - Niveau base de données
2. **Validations applicatives** (Form Requests) - Niveau contrôleur
3. **Service de déduplication** (FamilyDeduplicationService) - Logique métier
4. **Vérifications en cache** (CacheService) - Performance

---

## 🗄️ CONTRAINTES AU NIVEAU BASE DE DONNÉES

### Table `users`

#### Colonne `email`
```sql
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`)
```
- **Type**: UNIQUE INDEX
- **Colonnes**: `email`
- **Création**: Migration de base (0001_01_01_000000)
- **Effet**: Empêche l'insertion de deux users avec le même email
- **Erreur DB**: `Duplicate entry 'email@domain.com' for key 'users.users_email_unique'`

#### Colonne `identifier`
```sql
CREATE UNIQUE INDEX `users_identifier_unique` ON `users` (`identifier`)
```
- **Type**: UNIQUE INDEX
- **Colonnes**: `identifier` (généré automatiquement)
- **Création**: Migration 2026_01_15_000010
- **Format**: `{NOM}_{PRENOM}_{JJMMAAAA}_{HASH}`
- **Exemple**: `KOUADIO_JEAN_150190_a3c5f9`
- **Effet**: Chaque user a un identifiant unique permanent

#### Autres colonnes
- `name` - pas de contrainte UNIQUE
- `telephone` - pas de contrainte UNIQUE
- `telephone2` - pas de contrainte UNIQUE
- `profession` - pas de contrainte UNIQUE

---

### Table `inscriptions`

#### ⚠️ IMPORTANT: Pas de contrainte UNIQUE directe

```sql
-- La table inscriptions n'a PAS de contrainte UNIQUE sur:
-- - email
-- - telephone
-- - nom + prenom
-- - famille_temp_key (nullable, peut être NULL plusieurs fois)
```

**Raison**: Les inscriptions sont archivées et peuvent rester en attente indefiniment.
Le blocage se fait par **validation applicative**, pas par contrainte DB.

#### Colonne `family_temp_key` (partielle)
```sql
CREATE UNIQUE INDEX `inscriptions_family_temp_key_unique` ON `inscriptions` (`family_temp_key`)
WHERE `family_temp_key` IS NOT NULL
```
- **Type**: UNIQUE PARTIAL INDEX
- **Colonnes**: `family_temp_key`
- **Condition**: `WHERE family_temp_key IS NOT NULL`
- **Création**: Migration 2026_02_10_refactor_inscriptions_table
- **Effet**: Une clé temporaire peut être utilisée une seule fois pour regrouper les membres d'une famille en inscription
- **Exemple Flow**:
  1. User commence l'inscription famille
  2. `family_temp_key = 'fam_abc123def456'` généré
  3. Membres ajoutés avec cette clé
  4. Une seule inscription peut avoir cette clé
  5. Après approbation, clé supprimée ou ignorée

---

### Table `fonctions`

#### Colonne `nom`
```sql
CREATE UNIQUE INDEX `fonctions_nom_unique` ON `fonctions` (`nom`)
```
- **Type**: UNIQUE INDEX
- **Colonnes**: `nom`
- **Effet**: Une fonction ne peut avoir qu'un seul nom unique

---

### Table `villes`

#### Colonne `nom`
```sql
CREATE UNIQUE INDEX `villes_nom_unique` ON `villes` (`nom`)
```
- **Type**: UNIQUE INDEX
- **Colonnes**: `nom`

#### Colonne `code`
```sql
CREATE UNIQUE INDEX `villes_code_unique` ON `villes` (`code`)
```
- **Type**: UNIQUE INDEX
- **Colonnes**: `code`

---

### Table `user_sacrements`

#### Colonne `user_id`
```sql
CREATE UNIQUE INDEX `user_sacrements_user_id_unique` ON `user_sacrements` (`user_id`)
```
- **Type**: UNIQUE INDEX
- **Colonnes**: `user_id`
- **Effet**: Un user n'a qu'un seul dossier de sacrements
- **Migration**: 2026_02_05_restructure_user_sacrements_table

---

### Table `family_members` (ARCHIVÉE)

#### Index composite
```sql
CREATE UNIQUE INDEX `unique_user_family_approved` 
ON `family_members` (`user_id`, `family_id`, `deleted_at`)
```
- **Status**: ❌ ARCHIVÉE (table supprimée en 2026_02_14)
- **Note**: Relations maintenant dans colonne JSON `data` des inscriptions

---

## ✅ VALIDATIONS APPLICATIVES

### Form Request: `InscriptionRequest.php`

```php
// Validation au niveau du formulaire d'inscription publique
[
    'email' => ['required_if:type,famille', 'email', 'max:255', 'unique:users,email'],
    // Bloque une nouvelle inscription si l'email existe dans users
    
    'responsable.email' => 'required|email|unique:users,email',
    'membres.*.email' => 'nullable|email|unique:users,email',
]
```

**Messages d'erreur personnalisés**:
```php
'email.unique' => 'Cet email est déjà utilisé.'
```

---

### Contrôleur: `RegistrationController.php`

**Classe publique - Inscription Famille/Conducteur**:
```php
$validated = $request->validate([
    'email' => 'required|email|unique:users,email',
    'telephone' => 'nullable|string',
    'nom' => 'required|string',
    'prenom' => 'required|string',
]);
// ✅ Bloque si email existe dans users
// ❌ N'empêche PAS les doublons dans inscriptions
```

---

### Contrôleur: `AdminInscriptionsController.php`

**Flux Admin - Inscription Pasteur**:
```php
// Validation stricte de l'email responsable
$validated = $request->validateWithBag('pasteur', [
    'responsable.email' => 'required|email|unique:users,email',
    'membres.*.email' => 'nullable|email|unique:users,email',
]);
// ✅ Bloque si email existe dans users
// ✅ Bloque les doublons dans membres de la même inscription
```

---

### Contrôleur: `Conducteur/InscriptionsController.php`

```php
$validated = $request->validate([
    'responsable.email' => 'required|email|unique:users,email',
    'membres.*.email' => 'required|email|unique:users,email',
]);
```

---

### Modèle: `User.php`

**Validation côté modèle** (si utilisé):
```php
protected $fillable = [
    'email',
    'identifier', // Unique - généré automatiquement
    'telephone',
    'nom',
    'prenom',
    // ...
];
```

---

## 🔄 PROCESSUS DE BLOCAGE - DIAGRAMME DE FLUX

### Scénario 1: Email existe dans `users`

```
User tente une nouvelle inscription
    ↓
Email soumis: "jean@example.com"
    ↓
Validation: 'unique:users,email'
    ↓
SELECT COUNT(*) FROM users WHERE email = 'jean@example.com' AND deleted_at IS NULL
    ↓
Résultat: 1 (trouvé) 
    ↓
❌ ERREUR: "Cet email est déjà utilisé."
    ↓
Inscription BLOQUÉE
    ↓
Formulaire retourné avec erreur
```

---

### Scénario 2: Email n'existe pas, première inscription

```
User tente une nouvelle inscription
    ↓
Email soumis: "nouveau@example.com"
    ↓
Validation: 'unique:users,email'
    ↓
SELECT COUNT(*) FROM users WHERE email = 'nouveau@example.com' AND deleted_at IS NULL
    ↓
Résultat: 0 (pas trouvé)
    ↓
✅ VALIDATION PASSÉE
    ↓
Inscription créée dans `inscriptions` avec status='en_attente'
    ↓
Email archivé dans inscriptions.data JSON
    ↓
En attente d'approbation
```

---

### Scénario 3: Approbation d'inscription

```
Admin approuve une inscription en attente
    ↓
SELECT * FROM inscriptions WHERE id = 1 AND status = 'en_attente'
    ↓
Service: InscriptionApprovalService::approve()
    ↓
Création User avec email de l'inscription
    ↓
INSERT INTO users (email, identifier, ...)
    ↓
Constraint check: users.email UNIQUE
    ↓
Email disponible? ✅ OUI
    ↓
User créé avec ID = 42
    ↓
UPDATE inscriptions SET user_id = 42, status = 'approuve'
    ↓
Inscription status = 'approuve' ✅
```

---

### Scénario 4: Email rejeté pendant approbation

```
Admin essaie d'approuver une inscription
    ↓
Service crée le User avec email archivé
    ↓
INSERT INTO users (email = 'jean@example.com', ...)
    ↓
Constraint: users_email_unique violation detected!
    ↓
❌ ERREUR DB: "Duplicate entry 'jean@example.com' for key 'users.users_email_unique'"
    ↓
Rollback de la transaction
    ↓
Inscription reste status = 'en_attente'
    ↓
Admin doit REJETER ou MODIFIER l'inscription
```

---

## 🎯 SERVICE DE DÉDUPLICA: `FamilyDeduplicationService.php`

### Logique de détection des doublons

```php
class FamilyDeduplicationService
{
    /**
     * Détecte si une famille est un doublon
     * Une famille est unique par (email, classe_id)
     */
    public function isDuplicate(string $email, int $classeId): bool
    {
        // 1️⃣ Vérifier dans les inscriptions approuvées
        $existingFamily = Family::with('responsable')
            ->where('classe_id', $classeId)
            ->whereHas('responsable', function ($query) use ($email) {
                $query->where('email', $email);
            })
            ->first();
        
        if ($existingFamily) {
            return true; // ❌ DOUBLON DÉTECTÉ
        }
        
        // 2️⃣ Vérifier dans les utilisateurs existants
        $existingUser = User::where('email', $email)
            ->where('famille_id', $classeId) // Supposé... dépend du schéma
            ->first();
        
        if ($existingUser) {
            return true; // ❌ DOUBLON DÉTECTÉ
        }
        
        return false; // ✅ PAS DE DOUBLON
    }
    
    /**
     * Obtenir les familles candidates de fusion
     */
    public function findDuplicateCandidates(string $email, int $classeId): Collection
    {
        return Family::with('responsable')
            ->where('classe_id', $classeId)
            ->whereHas('responsable', function ($query) use ($email) {
                // Recherche par similarité (même domaine email, etc)
                $query->where('email', 'LIKE', '%' . explode('@', $email)[0] . '%');
            })
            ->get();
    }
}
```

### Utilisation du service

```php
// Dans RegistrationController ou AdminInscriptionsController
$dedup = new FamilyDeduplicationService();

if ($dedup->isDuplicate($email, $classeId)) {
    return response()->json([
        'success' => false,
        'message' => 'Une famille avec cet email existe déjà dans cette classe.'
    ], 409); // Conflict
}

// Sinon, créer l'inscription
```

---

## 💾 CACHE ET OPTIMISATION

### Service: `CacheService.php`

```php
class CacheService
{
    /**
     * Mettre en cache les inscriptions existantes
     */
    public function cacheInscription(Inscription $inscription): void
    {
        Cache::remember(
            "inscription_{$inscription->id}",
            $ttl = 3600, // 1 heure
            fn() => $inscription->load(['family', 'responsable'])
        );
    }
    
    /**
     * Vérifier si un email est en cache d'inscription
     */
    public function isEmailInCache(string $email, int $classeId): bool
    {
        $cached = Cache::get('inscriptions_by_email')['user@domain.com'] ?? null;
        return $cached !== null;
    }
}
```

---

## 🛡️ SOFT DELETES ET UNICITÉ

### Impact des soft deletes sur les contraintes UNIQUE

**Problème**: Un user soft-deleted conserve son email unique. Impossible d'inscrire quelqu'un avec le même email.

**Solution**: Validations excludent les deleted_at IS NOT NULL

```php
// ❌ MAUVAIS
'email' => 'unique:users,email'

// ✅ BON
'email' => 'unique:users,email,NULL,id,deleted_at,NULL'
// Ignore les users soft-deleted
```

**Implémentation dans le code**:
```php
public function rules()
{
    return [
        'email' => 'required|email|unique:users,email,NULL,id,deleted_at,NULL',
        // exclude soft-deleted users from unique check
    ];
}
```

---

## 📋 TABLEAU RÉCAPITULATIF

| Table | Colonne(s) | Type | Effet | Soft Deletes |
|-------|-----------|------|-------|--------------|
| `users` | `email` | UNIQUE | Une seule inscription par email | ❌ Pas déduit du check |
| `users` | `identifier` | UNIQUE | ID permanent unique | N/A |
| `inscriptions` | `family_temp_key` | UNIQUE (partial) | Clé temp pour regrouper membres | ❌ Pas appliqué |
| `fonctions` | `nom` | UNIQUE | Noms de fonctions uniques | N/A |
| `villes` | `nom` | UNIQUE | Noms de villes uniques | N/A |
| `villes` | `code` | UNIQUE | Codes postaux uniques | N/A |
| `user_sacrements` | `user_id` | UNIQUE | Un dossier de sacrement par user | ❌ Pas déduit |

---

## 🚨 ERREURS COURANTES ET SOLUTIONS

### Erreur 1: "Duplicate entry" lors de l'approbation

```
SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry 'jean@example.com' for key 'users.users_email_unique'
```

**Cause**: L'email a déjà été approuvé et existe dans `users`

**Solution**:
1. Rejeter l'inscription actuelle
2. Vérifier si le user existe déjà
3. Si oui, fusionner les données ou rejeter l'inscription

```php
public function approve(Inscription $inscription)
{
    // Vérifier que l'email n'existe pas
    if (User::withoutGlobalScopes()->where('email', $inscription->email)->exists()) {
        abort(409, 'Cet email existe déjà dans la base de données.');
    }
    
    // Procéder à l'approbation...
}
```

---

### Erreur 2: Soft-deleted users bloquent les nouvelles inscriptions

```
Erreur: "Cet email est déjà utilisé" pour un user supprimé
```

**Cause**: La validation ne tient pas compte des soft deletes

**Solution**: Utiliser la règle de validation correcte
```php
'email' => 'unique:users,email,NULL,id,deleted_at,NULL'
```

---

### Erreur 3: Inscriptions dupliquées en attente

```
Deux inscriptions avec email='jean@example.com' et status='en_attente'
```

**Cause**: `inscriptions` n'a pas de contrainte UNIQUE sur email

**Prévention**:
1. Vérifier les inscriptions existantes avant de créer:
```php
$existing = Inscription::where('email', $email)
    ->where('status', 'en_attente')
    ->first();

if ($existing) {
    return response()->json([
        'message' => 'Une inscription est déjà en cours avec cet email'
    ], 422);
}
```

2. Ou ajouter une migration avec contrainte UNIQUE partial:
```php
// Dans une nouvelle migration
Schema::table('inscriptions', function (Blueprint $table) {
    $table->unique(['email', 'classe_id'], 'unique_inscription_per_class')
        ->where('status', '!=', 'rejected')
        ->where('deleted_at', null);
});
```

---

## 🔍 VÉRIFICATION DES CONTRAINTES EN BASE

### Lister toutes les contraintes UNIQUE d'une table

```sql
-- MySQL
SELECT CONSTRAINT_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'users' 
AND CONSTRAINT_NAME != 'PRIMARY'
AND CONSTRAINT_NAME LIKE '%unique%';

-- Résultat:
-- CONSTRAINT_NAME: users_email_unique, COLUMN_NAME: email
-- CONSTRAINT_NAME: users_identifier_unique, COLUMN_NAME: identifier
```

---

## ✅ CHECKLIST DE VALIDATION

- [ ] Email ne peut être inséré qu'une seule fois dans `users`
- [ ] Email soft-deleted ne bloque pas les nouvelles inscriptions
- [ ] Inscriptions dupliquées ne peuvent pas être approuvées au même moment
- [ ] `family_temp_key` regroupe correctement les membres temporaires
- [ ] `identifier` est unique et généré automatiquement
- [ ] Les erreurs UNIQUE sont catchées et rapportées à l'utilisateur
- [ ] Les services de déduplication fonctionnent correctement

---

## 📞 RÉFÉRENCES

- Migration de base: `0001_01_01_000000_create_users_table.php`
- Migrations utilisateurs: `2026_01_15_000010_consolidate_users_columns.php`
- Migrations inscriptions: `2026_02_10_refactor_inscriptions_table.php`
- Service déduplication: `app/Services/FamilyDeduplicationService.php`
- Validations: `app/Http/Requests/InscriptionRequest.php`
- Contrôleur registro: `app/Http/Controllers/RegistrationController.php`
- Contrôleur admin: `app/Http/Controllers/Admin/AdminInscriptionsController.php`
