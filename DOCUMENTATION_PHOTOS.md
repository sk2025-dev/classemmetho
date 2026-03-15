# 📸 DOCUMENTATION COMPLÈTE: GESTION DES PHOTOS

## 🎯 RÉSUMÉ EXÉCUTIF

Votre application gère les photos de manière simple et efficace:
- **Nom du système**: `PhotoHelper` + `PhotoController` + champs `photo_path` et `profile_photo_url`
- **Stockage**: Fichiers sur disque (`storage/app/public/`)
- **Accès**: Via URLs publiques (`/storage/...`)
- **Modèles concernés**: `User`, `Inscription`

---

## 📋 TABLE DES MATIÈRES

1. [Architecture générale](#architecture)
2. [Noms et concepts clés](#noms-et-concepts)
3. [Affichage des photos](#affichage)
4. [Envoi/Upload des photos](#envoi)
5. [Stockage en base de données](#base-de-donnees)
6. [Flux complet exemple](#flux-complet)
7. [Points d'accès (routes)](#routes)
8. [Sécurité](#sécurité)

---

## <a name="architecture"></a>🏗️ ARCHITECTURE GÉNÉRALE

```
┌─────────────────────────────────────────────────────┐
│           FRONTEND (Vue.js/React)                   │
│  - Form avec input type="file"                      │
│  - Affichage avec <img :src="photoUrl" />          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ├─ Upload: POST /api/photo/upload
                   │
                   └─ Affichage: GET /storage/path/photo.jpg
                   
┌──────────────────┴──────────────────────────────────┐
│           BACKEND (Laravel)                         │
│                                                     │
│  Controllers:                                       │
│   - PhotoController.php (upload/delete)            │
│   - RegistrationController.php (inscriptions)      │
│   - MemberController.php (membres)                 │
│   - ProfileController.php (profil)                 │
│                                                     │
│  Helpers:                                           │
│   - PhotoHelper::getPhotoUrl()                     │
│                                                     │
│  Models:                                            │
│   - User (photo_path, profile_photo_url)          │
│   - Inscription (photo_path, profile_photo_url)   │
└────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│      STOCKAGE (storage/app/public/)                  │
│                                                      │
│  inscriptions/                                       │
│  members/photos/                                     │
│  profiles/                                           │
│  photos/users/                                       │
└──────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│         BASE DE DONNÉES (MySQL/PostgreSQL)           │
│                                                      │
│  users                                               │
│  ├─ photo_path: VARCHAR (chemin fichier)            │
│  └─ profile_photo_url: VARCHAR (URL générée)       │
│                                                      │
│  inscriptions                                        │
│  ├─ photo_path: VARCHAR (chemin fichier)            │
│  └─ profile_photo_url: VARCHAR (URL générée)       │
└──────────────────────────────────────────────────────┘
```

---

## <a name="noms-et-concepts"></a>📚 NOMS ET CONCEPTS CLÉS

### Entités principales

| Concept | Location | Rôle |
|---------|----------|------|
| **PhotoHelper** | `app/Helpers/PhotoHelper.php` | Génère l'URL complète d'une photo |
| **PhotoController** | `app/Http/Controllers/PhotoController.php` | API upload/delete photos |
| **photo_path** | Base de données | Chemin RELATIF du fichier (ex: `inscriptions/file.jpg`) |
| **profile_photo_url** | Base de données | URL COMPLÈTE générée (ex: `/storage/inscriptions/file.jpg`) |

### Répertoires de stockage

```
storage/app/public/
├── inscriptions/          # Photos des inscriptions familiales
│   └── inscription_XXXX_timestamp.jpg
├── members/photos/        # Photos des membres (profil)
│   └── photo_XXXX_timestamp.jpg
├── profiles/              # Photos de profil génériques
│   └── filename_XXXX.jpg
└── photos/users/          # Photos dans formulaires de conducteur
    └── photo_XXXX.jpg
```

### Champs de stockage en BD

**Table `users`:**
```sql
- id: INT PRIMARY KEY
- nom: VARCHAR(100)
- prenom: VARCHAR(100)
- photo_path: VARCHAR(255) NULL    -- Chemin relatif
- profile_photo_url: VARCHAR(255) NULL -- URL complète
- created_at, updated_at: TIMESTAMP
```

**Table `inscriptions`:**
```sql
- id: INT PRIMARY KEY
- photo_path: VARCHAR(255) NULL    -- Chemin du responsable
- profile_photo_url: VARCHAR(255) NULL -- URL du responsable
- responsable_nom: VARCHAR(255)
- responsable_prenom: VARCHAR(255)
- data: JSON  -- Contient les photos_path des membres
- status: ENUM('en_attente', 'approuve', 'rejete')
- created_at, updated_at: TIMESTAMP
```

---

## <a name="affichage"></a>👁️ AFFICHAGE DES PHOTOS

### 1️⃣ Via `PhotoHelper::getPhotoUrl()`

**Fichier:** `app/Helpers/PhotoHelper.php`

```php
public static function getPhotoUrl($photoPath, $firstName = null, $lastName = null)
{
    // Si une photo existe en base de données
    if ($photoPath && !empty($photoPath)) {
        // Vérifier si c'est déjà une URL complète (commence par http)
        if (strpos($photoPath, 'http') === 0) {
            return $photoPath;
        }
        // Construire l'URL complète avec /storage/
        return '/storage/' . $photoPath;
    }
    
    // Pas de photo = retourner null (afficher placeholder)
    return null;
}
```

**Usage dans Modèles:**

**Model `User`:**
```php
class User extends Authenticatable {
    public function getProfilePhotoUrlAttribute()
    {
        return PhotoHelper::getPhotoUrl($this->photo_path, $this->prenom, $this->nom);
    }
}
```

**Model `Inscription`:**
```php
class Inscription extends Model {
    public function getProfilePhotoUrlAttribute()
    {
        if (!isset($this->attributes['photo_path'])) {
            return null;
        }
        return PhotoHelper::getPhotoUrl(
            $this->attributes['photo_path'], 
            $this->responsable_prenom, 
            $this->responsable_nom
        );
    }
}
```

### 2️⃣ Dans les Contrôleurs (transmission Frontend)

**Fichier:** `app/Http/Middleware/HandleInertiaRequests.php`

```php
// Lors du chargement d'une page, on envoie les données utilisateur au frontend
if ($request->user()) {
    return array_merge($props, [
        'auth' => [
            'user' => [
                'id' => $request->user()->id,
                'email' => $request->user()->email,
                'photo_path' => $request->user()->photo_path,
                'profile_photo_url' => PhotoHelper::getPhotoUrl(
                    $request->user()->photo_path, 
                    $request->user()->prenom, 
                    $request->user()->nom
                ),
                'photo' => $request->user()->photo ?? null,
            ],
        ],
    ]);
}
```

### 3️⃣ Affichage Frontend (Vue.js example)

```vue
<template>
  <!-- Si photo existe -->
  <img 
    v-if="user.profile_photo_url"
    :src="user.profile_photo_url"
    :alt="`${user.prenom} ${user.nom}`"
    class="w-10 h-10 rounded-full"
  />
  
  <!-- Si pas de photo, afficher avatar avec initiales -->
  <div 
    v-else
    class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center"
  >
    {{ user.prenom?.charAt(0) }}{{ user.nom?.charAt(0) }}
  </div>
</template>

<script>
export default {
  props: {
    user: {
      type: Object,
      required: true
    }
  }
}
</script>
```

---

## <a name="envoi"></a>📤 ENVOI/UPLOAD DES PHOTOS

### 1️⃣ Via `PhotoController`

**Fichier:** `app/Http/Controllers/PhotoController.php`

**Endpoint:** `POST /api/photo/upload`

```php
public function upload(Request $request)
{
    // Validation
    $validator = Validator::make($request->all(), [
        'photo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
        'type' => 'required|in:user,family,conducteur,inscription',
        'entity_id' => 'nullable|integer',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation échouée',
            'errors' => $validator->errors()
        ], 422);
    }

    $photo = $request->file('photo');
    $type = $request->input('type');
    
    // Générer chemin: photos/type/YYYY/MM/DD/filename
    $path = "photos/{$type}/" . date('Y/m/d');
    $filename = uniqid() . '_' . time() . '.' . $photo->getClientOriginalExtension();

    // Stocker le fichier
    $storagePath = Storage::disk('public')->putFileAs(
        $path,
        $photo,
        $filename
    );

    // Retourner chemin et URL
    $publicUrl = asset('storage/' . $storagePath);

    return response()->json([
        'success' => true,
        'data' => [
            'path' => $storagePath,        // ex: photos/user/2026/03/12/xyz123_123456789.jpg
            'url' => $publicUrl,           // ex: /storage/photos/user/2026/03/12/xyz123_123456789.jpg
            'filename' => $filename,
            'type' => $type,
        ]
    ], 200);
}
```

**Frontend Usage:**
```javascript
const formData = new FormData();
formData.append('photo', fileInput.files[0]);
formData.append('type', 'user');
formData.append('entity_id', userId);

const response = await fetch('/api/photo/upload', {
    method: 'POST',
    body: formData
});

const data = await response.json();
// data.success === true
// data.data.path -> stocké en BD
// data.data.url -> affiché au frontend
```

### 2️⃣ Via Formulaire d'Inscription (`RegistrationController`)

**Fichier:** `app/Http/Controllers/RegistrationController.php`

**Méthode:** `storePhotoAsFile($file)`

```php
private function storePhotoAsFile($file)
{
    try {
        if (!$file || !$file->isValid()) {
            return null;
        }

        // Créer un nom unique
        $extension = $file->getClientOriginalExtension();
        $filename = 'inscription_' . uniqid() . '_' . time() . '.' . $extension;

        // Stocker dans storage/app/public/inscriptions/
        $path = Storage::disk('public')->putFileAs(
            'inscriptions',
            $file,
            $filename
        );

        // Retourner chemin et URL
        $photoUrl = asset('storage/' . $path);

        return [
            'path' => $path,           // ex: inscriptions/inscription_xyz123_123456789.jpg
            'url' => $photoUrl,        // ex: /storage/inscriptions/inscription_xyz123_123456789.jpg
        ];
    } catch (\Exception $e) {
        Log::error('Erreur lors du stockage de la photo', [
            'error' => $e->getMessage()
        ]);
        return null;
    }
}
```

**Utilisation dans `store()` :**

```php
public function store(Request $request)
{
    // ... validation ...
    
    $inscriptions = DB::transaction(function () use ($data) {
        // RESPONSABLE - Stocker la photo
        if (!empty($data['responsable']['photo'])) {
            $photoData = $this->storePhotoAsFile($data['responsable']['photo']);
            $photoPath = $photoData['path'] ?? null;      // inscriptions/inscription_xyz.jpg
            $photoUrl = $photoData['url'] ?? null;        // /storage/inscriptions/inscription_xyz.jpg
        }

        // MEMBRES - Stocker les photos individuelles
        foreach ($data['membres'] as $i => $membre) {
            if (!empty($membre['photo'])) {
                $memberPhotoData = $this->storePhotoAsFile($membre['photo']);
                $data['membres'][$i]['photo_path'] = $memberPhotoData['path'] ?? null;
            }
        }

        // Créer l'inscription avec les chemins
        $inscription = Inscription::create([
            'photo_path' => $photoPath,           // Chemin du responsable
            'profile_photo_url' => $photoUrl,     // URL du responsable
            'data' => [
                'membres' => $data['membres'],    // Contient photo_path de chaque membre
                // ...
            ]
        ]);

        return [$inscription];
    });
}
```

### 3️⃣ Validation des fichiers

**Règles Laravel (dans Requests):**

```php
// app/Http/Requests/Admin/UpdateMembreRequest.php
public function rules(): array
{
    return [
        'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
    ];
}

public function messages(): array
{
    return [
        'photo.image' => 'La photo doit être une image.',
        'photo.mimes' => 'La photo doit être un fichier JPEG, PNG, JPG ou GIF.',
        'photo.max' => 'La photo ne doit pas dépasser 2 MB.',
    ];
}
```

**Validations côté Frontend (avant envoi):**

```javascript
// Taille: max 5 MB = 5242880 bytes
// Formats: JPEG, JPG, PNG
if (file.size > 5242880) {
    errors.push('La photo dépasse 5 MB');
}

const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
if (!allowedMimes.includes(file.type)) {
    errors.push('Format non autorisé');
}
```

---

## <a name="base-de-donnees"></a>💾 STOCKAGE EN BASE DE DONNÉES

### Migration: `2026_02_16_optimize_photo_storage.php`

```php
// Ajouter colonne photo_path
if (!in_array('photo_path', $columns)) {
    $table->string('photo_path')->nullable()->after('photo_data');
}

// Supprimer colonnes inutiles
if (in_array('photo_data', $columns)) {
    $table->dropColumn('photo_data');  // Plus de base64!
}
if (in_array('photo_url', $columns)) {
    $table->dropColumn('photo_url');
}
```

### Structure finale des tables

**Users Table:**
```
+------------------------+---------------+------+-----+---------+
| Field                  | Type          | Null | Key | Default |
+------------------------+---------------+------+-----+---------+
| id                     | unsigned big  | NO   | PRI | NULL    |
| photo_path             | varchar(255)  | YES  |     | NULL    |
| created_at             | timestamp     | YES  |     | NULL    |
| updated_at             | timestamp     | YES  |     | NULL    |
+------------------------+---------------+------+-----+---------+
```

**Inscriptions Table:**
```
+------------------------+---------------+------+-----+---------+
| Field                  | Type          | Null | Key | Default |
+------------------------+---------------+------+-----+---------+
| id                     | unsigned big  | NO   | PRI | NULL    |
| photo_path             | varchar(255)  | YES  |     | NULL    |
| profile_photo_url      | varchar(255)  | YES  |     | NULL    |
| data                   | json          | YES  |     | NULL    |
| responsable_nom        | varchar(255)  | YES  |     | NULL    |
| responsable_prenom     | varchar(255)  | YES  |     | NULL    |
| created_at             | timestamp     | YES  |     | NULL    |
+------------------------+---------------+------+-----+---------+
```

### Sauvegarde en BD

```php
// Responsable d'une inscription
$inscription = Inscription::create([
    'photo_path' => 'inscriptions/inscription_xyz123_123456789.jpg',
    'profile_photo_url' => '/storage/inscriptions/inscription_xyz123_123456789.jpg',
]);

// Membres (dans la colonne JSON `data`)
$inscription->data = [
    'membres' => [
        [
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'photo_path' => 'inscriptions/inscription_abc789_987654321.jpg',
        ],
        [
            'nom' => 'Dupont',
            'prenom' => 'Marie',
            'photo_path' => null,  // Pas de photo
        ],
    ]
];
```

### Récupération en BD

```php
// Récupérer un utilisateur avec sa photo
$user = User::find(1);
echo $user->photo_path;           // inscriptions/inscription_xyz.jpg
echo $user->profile_photo_url;    // null (recalculée via PhotoHelper)

// Utiliser le helper pour obtenir l'URL
$photoUrl = PhotoHelper::getPhotoUrl($user->photo_path, $user->prenom, $user->nom);
// /storage/inscriptions/inscription_xyz.jpg

// Ou directement via accessor du modèle
$photoUrl = $user->profile_photo_url;  // Génère l'URL automatiquement
```

---

## <a name="flux-complet"></a>🔄 FLUX COMPLET EXEMPLE

### Scénario: Inscription d'une famille avec photo

```
1. FORMULAIRE (Frontend - Vue.js)
   ├─ User remplit le formulaire
   ├─ Sélectionne une photo (input type="file")
   └─ Soumis avec FormData incluant la photo

2. TRANSMISSION (Frontend → Backend)
   POST /api/register/family
   Content-Type: multipart/form-data
   ├─ responsable[nom]: "Dupont"
   ├─ responsable[prenom]: "Jean"
   ├─ responsable[email]: "jean@example.com"
   ├─ responsable[photo]: <File object>
   ├─ membres[0][nom]: "Marie"
   ├─ membres[0][prenom]: "Dupont"
   ├─ membres[0][photo]: <File object>
   └─ ...autres champs...

3. VALIDATION (RegistrationController)
   ├─ Valider le formulaire (règles Laravel)
   ├─ Vérifier le format MIME: JPEG, PNG, JPG
   ├─ Vérifier la taille: max 5 MB
   └─ Retourner 422 si erreurs

4. STOCKAGE DES FICHIERS (RegistrationController)
   ├─ storePhotoAsFile($responsable['photo'])
   │  ├─ Créer nom: inscription_uniqid_timestamp.jpg
   │  ├─ Stocker: storage/app/public/inscriptions/
   │  ├─ Retourner: 
   │  │  ├─ path: "inscriptions/inscription_xyz.jpg"
   │  │  └─ url: "/storage/inscriptions/inscription_xyz.jpg"
   │  └─ Log: Photo stockée avec succès
   │
   └─ storePhotoAsFile($membres[0]['photo'])
      ├─ Créer nom: inscription_abc123_timestamp.jpg
      ├─ Stocker: storage/app/public/inscriptions/
      └─ Retourner path & url

5. CRÉATION EN BD (DB::transaction)
   ├─ Inscription::create([
   │  ├─ 'photo_path' => 'inscriptions/inscription_xyz.jpg'
   │  ├─ 'profile_photo_url' => '/storage/inscriptions/inscription_xyz.jpg'
   │  ├─ 'responsable_nom' => 'Dupont'
   │  ├─ 'responsable_prenom' => 'Jean'
   │  └─ 'data' => [
   │     'membres' => [
   │        'photo_path' => 'inscriptions/inscription_abc.jpg',
   │        ...
   │     ]
   │  ]
   │)
   └─ Transaction réussie → Commit

6. AFFICHAGE (Admin Panel Frontend)
   ├─ Admin va voir l'inscription
   ├─ Récupère l'URL depuis BD
   │  ├─ DB.inscriptions.profile_photo_url
   │  └─ → /storage/inscriptions/inscription_xyz.jpg
   │
   └─ Affiche dans template:
      <img :src="inscription.profile_photo_url" />
      ├─ Charge depuis /storage/inscriptions/inscription_xyz.jpg
      └─ Affiche la photo du responsable

7. APPROBATION (InscriptionApprovalService)
   ├─ When approving:
   │  ├─ Créer un User à partir de l'Inscription
   │  ├─ Copier photo_path → User.photo_path
   │  ├─ Générer URL via PhotoHelper
   │  └─ Copier dans User.profile_photo_url
   │
   └─ User créé avec sa photo!

8. SUPPRESSION (Optionnel)
   ├─ Inscription::delete()
   ├─ Model boot() event:
   │  ├─ if (Storage::disk('public')->exists($photo_path))
   │  │  └─ Storage::disk('public')->delete($photo_path)
   │  └─ Fichier supprimé du disque!
   │
   └─ Inscription supprimée de BD + fichier physique deleted
```

---

## <a name="routes"></a>🛣️ POINTS D'ACCÈS (Routes)

### Upload Photo

```php
// routes/api.php
POST /api/photo/upload
  Controller: PhotoController::upload()
  Middlewares: auth:sanctum
  Body: multipart/form-data
    - photo: File (required, image, max:5120)
    - type: String (user|family|conducteur|inscription)
    - entity_id: Integer (optional)
  Response: { success, data: { path, url, filename } }
```

### Delete Photo

```php
// routes/api.php
DELETE /api/photo/delete
  Controller: PhotoController::delete()
  Middlewares: auth:sanctum
  Body: JSON
    - path: String (required)
  Response: { success, message }
```

### Register Family (Inscription)

```php
// routes/web.php
POST /register/family
  Controller: RegistrationController::register()
  Body: multipart/form-data
    - responsable[photo]: File
    - membres[*][photo]: File
    - ...autres champs...
  Response: { success, inscription_ids, reference }
```

### Update Profile Photo

```php
// routes/web.php (Authenticated)
POST /profile/update
  Controllers:
    - ProfileController::updatePhoto()
    - MemberController::updatePhoto()
  Body: multipart/form-data
    - photo: File (required)
  Response: { success, photo_path, photo_url }
```

---

## <a name="sécurité"></a>🔒 SÉCURITÉ

### Validations côté Backend

```php
// Formats autorisés
$allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

// Tailles limites
- PhotoController: max 5120 KB (5 MB)
- UpdateMembreRequest: max 2048 KB (2 MB)
- RegistrationController: max 5242880 bytes (5 MB)

// Vérifications
- $file->isValid()
- $file->getMimeType()
- $file->getSize()
- Storage::disk('public')->exists()
```

### Protection des fichiers

```php
// Stockage public (accessible via web)
storage/app/public/  → /storage/ (symlink public/storage)

// Accès direct
<img src="/storage/inscriptions/file.jpg" />
// = /public/storage/inscriptions/file.jpg

// Convention de nommage sécurisée
inscription_uniqid()_time().jpg
// = inscription_507a6f04e5f67_1614556800.jpg
// Impossible de deviner les noms de fichiers
```

### Suppression sécurisée

```php
// Auto-delete lors de suppression du modèle
Model::deleting(function ($model) {
    if ($model->photo_path && 
        Storage::disk('public')->exists($model->photo_path)) {
        Storage::disk('public')->delete($model->photo_path);
    }
});
```

### Logging/Audit

```php
// Enregistrement de tous les uploads
Log::info('Photo stockée avec succès', [
    'path' => $path,
    'url' => $photoUrl,
    'filename' => $filename,
    'user_id' => Auth::id(),
    'timestamp' => now()
]);

// Audit des suppressions via TrackModifications trait
User::create([...])
// Auto-enregistre: created_by, created_at, updated_by, updated_at
```

---

## 🎓 CHECKLISTE D'INTÉGRATION

Pour ajouter les photos à une nouvelle entité:

```
☐ 1. Ajouter colonnes en migration:
      ├─ photo_path VARCHAR(255) NULL
      └─ profile_photo_url VARCHAR(255) NULL

☐ 2. Dans le Model:
      ├─ Ajouter dans $fillable
      ├─ Ajouter accessor getProfilePhotoUrlAttribute()
      └─ Ajouter dans booted() pour auto-delete

☐ 3. Dans le Controller:
      ├─ Valider 'photo' => 'nullable|image|mimes:...|max:...'
      ├─ Appeler storePhotoAsFile() ou $request->file('photo')->store()
      ├─ Stocker le path en BD
      └─ Log les opérations

☐ 4. Au Frontend:
      ├─ Input type="file" accept="image/*"
      ├─ Afficher avec <img :src="photoUrl" />
      ├─ Utiliser profile_photo_url si disponible
      └─ Fallback sur placeholder/initiales

☐ 5. Testing:
      ├─ Upload petit fichier (< 100KB)
      ├─ Upload grand fichier (test limite)
      ├─ Format invalide
      ├─ Affichage après upload
      ├─ Suppression du modèle
      └─ Vérifier fichier supprimé du disque
```

---

## 📞 FAQ / TROUBLESHOOTING

### Q: Où sont stockées les photos?
**R:** Dans `storage/app/public/` avec antités suivantes:
- `inscriptions/` - Photos d'inscriptions
- `members/photos/` - Photos de profils membres
- `profiles/` - Photos de profils génériques
- `photos/users/` - Photos dans conducteurs

### Q: Pourquoi deux champs `photo_path` et `profile_photo_url`?
**R:** 
- `photo_path`: Le chemin RÉEL du fichier (ce qu'on save en BD depuis le formulaire)
- `profile_photo_url`: L'URL COMPLÈTE générée (recalculée via PhotoHelper ou cURL)

### Q: Comment afficher une photo?
**R:** Trois options:
1. Directement: `<img :src="user.photo_path" />` → `/storage/...` auto-ajouté
2. Via helper: `PhotoHelper::getPhotoUrl($user->photo_path)` → `/storage/...`
3. Accessor: `$user->profile_photo_url` → `/storage/...` (généré auto)

### Q: Peut-on changer une photo?
**R:** Oui! Uploadez une nouvelle, elle sera sauvée avec un nouveau nom, l'ancienne restera.
Pour delete l'ancienne: itérez via `Model::update(['photo_path' => null])`.

### Q: Limites de taille?
**R:** 
- PhotoController: 5 MB max
- UpdateMembreRequest: 2 MB max
- RegistrationController: 5 MB max

### Q: Formats autorisés?
**R:** JPEG, JPG, PNG, GIF, WebP (selon le endpoint)

### Q: Quand les fichiers sont supprimés?
**R:** Automatiquement via `Model::deleting()` quand vous appelez `$model->delete()`

### Q: Comment tester l'upload?
**R:**
```javascript
const formData = new FormData();
formData.append('photo', inputElement.files[0]);
formData.append('type', 'user');

const res = await fetch('/api/photo/upload', {
    method: 'POST',
    body: formData
});
```

---

## 📖 RÉFÉRENCES FICHIERS

| Fichier | Ligne | Fonction |
|---------|-------|----------|
| [PhotoHelper.php](app/Helpers/PhotoHelper.php) | - | Generatephoto URLs |
| [PhotoController.php](app/Http/Controllers/PhotoController.php) | - | Upload/Delete API |
| [RegistrationController.php](app/Http/Controllers/RegistrationController.php) | 1025-1100 | storePhotoAsFile() |
| [User.php](app/Models/User.php) | 36, 257 | photo_path, accessor |
| [Inscription.php](app/Models/Inscription.php) | 22, 135, 147 | photo_path, accessor, delete |
| [HandleInertiaRequests.php](app/Http/Middleware/HandleInertiaRequests.php) | 49-51 | Send photo to frontend |
| [2026_02_16_optimize_photo_storage.php](database/migrations/2026_02_16_optimize_photo_storage.php) | - | Schema setup |

---

**VERSION:** 1.0  
**DATE:** 2026-03-12  
**AUTHOR:** Documentation Complète du Système de Gestion des Photos  
**STATUS:** ✅ Production Ready
