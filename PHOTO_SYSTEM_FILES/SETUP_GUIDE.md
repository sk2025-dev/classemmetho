# 📋 GUIDE D'INTÉGRATION - Étapes Complètes

## ✅ Je veux intégrer le système de photos dans un nouveau projet

### **ÉTAPE 1: Préparer la Base de Données**

```bash
# Créer une migration pour ajouter les colonnes de photo
php artisan make:migration add_photo_columns_to_users_table
```

**Dans le fichier de migration (database/migrations/...):**
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('photo_path')->nullable()->after('email');
    $table->string('profile_photo_url')->nullable()->after('photo_path');
});
```

**Exécuter la migration:**
```bash
php artisan migrate
```

### **ÉTAPE 2: Créer les Fichiers Backend**

1. **Copier `PhotoHelper.php` vers:**
   ```
   app/Helpers/PhotoHelper.php
   ```

2. **Copier `PhotoUploadController.php` vers:**
   ```
   app/Http/Controllers/Api/PhotoUploadController.php
   ```

3. **Vérifier que le dossier `Api` existe:**
   ```bash
   mkdir -p app/Http/Controllers/Api
   ```

### **ÉTAPE 3: Configurer les Routes**

Ajouter dans `routes/api.php`:

```php
// En haut du fichier, ajouter l'import:
use App\Http\Controllers\Api\PhotoUploadController;

// Dans le groupe middleware auth:web:
Route::post('/profile/photo/upload', [PhotoUploadController::class, 'uploadProfilePhoto']);
Route::delete('/profile/photo/delete', [PhotoUploadController::class, 'deleteProfilePhoto']);
```

### **ÉTAPE 4: Créer les Fichiers Frontend**

1. **Copier `PhotoHelper.js` vers:**
   ```
   resources/js/Helpers/PhotoHelper.js
   ```

2. **Copier `PhotoUploadInput.jsx` vers:**
   ```
   resources/js/Components/PhotoUploadInput.jsx
   ```

3. **Vérifier la structure des dossiers:**
   ```
   resources/
   ├── js/
   │   ├── Helpers/
   │   │   └── PhotoHelper.js
   │   └── Components/
   │       └── PhotoUploadInput.jsx
   ```

### **ÉTAPE 5: Lien Symbolique de Stockage**

```bash
# Créer le lien symbolique pour accéder au dossier storage/app/public
php artisan storage:link

# Vérifier que le lien a été créé (doit afficher un lien)
ls -la public/storage
```

### **ÉTAPE 6: Permissions**

```bash
# Donner les permissions en écriture au dossier storage
chmod -R 775 storage/app/public
chmod -R 775 bootstrap/cache
```

### **ÉTAPE 7: Utiliser dans une Page React**

**Exemple simple:**
```jsx
import PhotoUploadInput from '@/Components/PhotoUploadInput';
import { getPhotoUrl } from '@/Helpers/PhotoHelper';

export default function MyPage({ user }) {
    const [photoUrl, setPhotoUrl] = useState(user?.photo_path);

    return (
        <div>
            <img src={getPhotoUrl(photoUrl, user?.prenom, user?.nom)} alt="Photo" />
            <PhotoUploadInput onPhotoSelected={setPhotoUrl} size="lg" />
        </div>
    );
}
```

### **ÉTAPE 8: Tester**

1. Aller à la page
2. Cliquer sur "Choisir une photo"
3. Sélectionner une image (< 5MB, format: JPEG/PNG/GIF/WebP)
4. Vérifier que la photo s'affiche
5. Vérifier dans la base de données que le chemin a été sauvegardé

---

## 🔄 Cas d'Usage Communs

### **Afficher la photo d'un utilisateur**

```jsx
import { getPhotoUrl } from '@/Helpers/PhotoHelper';

<img 
  src={getPhotoUrl(user.photo_path, user.prenom, user.nom)}
  alt={user.nom}
  className="w-12 h-12 rounded-full object-cover"
/>
```

### **Uploader une photo avec un formulaire**

```jsx
import PhotoUploadInput from '@/Components/PhotoUploadInput';
import { useForm } from '@inertiajs/react';

const { data, setData, post } = useForm({ photo_path: null });

<PhotoUploadInput onPhotoSelected={(url) => setData('photo_path', url)} />
<button onClick={() => post('/api/users')}>Enregistrer</button>
```

### **Récupérer une liste d'utilisateurs avec leurs photos (backend)**

```php
use App\Helpers\PhotoHelper;

$users = User::all();

return $users->map(fn($user) => [
    'id' => $user->id,
    'nom' => $user->nom,
    'photo_url' => PhotoHelper::getPhotoUrl($user->photo_path, $user->prenom, $user->nom),
]);
```

### **Supprimer une photo**

```php
use Illuminate\Support\Facades\Storage;

if ($user->photo_path && Storage::exists('public/' . $user->photo_path)) {
    Storage::delete('public/' . $user->photo_path);
}
$user->photo_path = null;
$user->save();
```

---

## 🚨 Dépannage

### **Erreur: "Lien symbolique non trouvé"**
```bash
php artisan storage:link
# Puis vérifier que public/storage pointe vers storage/app/public
```

### **Erreur: "Permission denied writing to storage"**
```bash
chmod -R 775 storage/
chmod -R 775 bootstrap/cache
```

### **Photos ne s'affichent pas**
1. Vérifier que le fichier existe: `ls storage/app/public/photos/...`
2. Vérifier que le lien existe: `ls -la public/storage`
3. Vérifier dans le navigateur: l'image doit être à `/storage/{chemin}`

### **Upload échoue silencieusement**
1. Vérifier la console du navigateur (F12 → Console)
2. Vérifier les logs: `tail -f storage/logs/laravel.log`
3. S'assurer que le fichier est < 5MB

### **Token CSRF invalide**
1. S'assurer que la route est dans `middleware(['auth:web'])`
2. Vérifier que vous utilisez Inertia (qui ajoute le token automatiquement)
3. Pour les requêtes fetch manuelles, inclure le token:

```javascript
// Récupérer le token depuis la page HTML
const token = document.querySelector('meta[name="csrf-token"]').content;

fetch('/api/photo/upload', {
  method: 'POST',
  headers: {
    'X-CSRF-TOKEN': token,
    'X-Requested-With': 'XMLHttpRequest',
  },
  body: formData
});
```

---

## 📦 Fichiers Inclus

```
PHOTO_SYSTEM_FILES/
├── PhotoHelper.php                 # Helper PHP
├── PhotoUploadController.php       # Contrôleur API
├── PhotoHelper.js                  # Helper JS
├── PhotoUploadInput.jsx            # Composant React
├── ROUTES_API.php                  # Configuration des routes
├── EXEMPLES_INTEGRATION.jsx        # Exemples d'utilisation
└── SETUP_GUIDE.md                  # Ce fichier
```

---

## 🎓 Structure Complète du Système

```
Utilisateur sélectionne une photo
    ↓
PhotoUploadInput (composant React)
    ↓ Validation (type, taille < 5MB)
    ↓
POST /api/profile/photo/upload
    ↓
PhotoUploadController (API)
    ↓ Validation serveur
    ↓
Storage::disk('public')->putFileAs()
    ↓ Sauvegarde dans storage/app/public/profiles/
    ↓
Retourne l'URL publique (/storage/...)
    ↓
Mise à jour React (Preview + State)
    ↓
L'application sauvegarde le chemin en BD
    ↓
À l'affichage:
    ↓
getPhotoUrl(photo_path) → /storage/{chemin}
    ↓
<img src={photoUrl} /> → Photo affichée
```

---

## 🔒 Sécurité

✅ **Validations côté client:**
- Type de fichier (uniquement images)
- Taille (max 5MB)

✅ **Validations côté serveur:**
- MIME type checked
- Extension vérifiée
- Taille vérifiée
- CSRF token requis

✅ **Stockage sécurisé:**
- Fichiers stockés en dehors de la racine web
- Noms aléatoires (pas d'énumération)
- Accessible via le disque 'public' configuré

---

## 📱 Formats Acceptés

- ✅ JPEG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ❌ BMP, SVG, EXE, PDF, etc.

**Taille maximale:** 5 MB

---

## 🎯 Checklist Finale

- [ ] Vérifier que les fichiers PHP existent
- [ ] Vérifier que les fichiers JS/React existent
- [ ] Vérifier que les routes sont configurées
- [ ] Exécuter `php artisan storage:link`
- [ ] Vérifier les permissions (775)
- [ ] Créer les colonnes en base de données
- [ ] Tester l'upload d'une photo
- [ ] Vérifier l'affichage
- [ ] Vérifier la base de données (chemin sauvegardé)
- [ ] Tester la suppression
- [ ] Tester avec des fichiers de grande taille (doit rejeter)
- [ ] Tester avec des fichiers non-image (doit rejeter)

---

## 💡 Tips & Astuces

### **Ajouter une validation personnalisée**
```php
// Dans PhotoUploadController
if (strpos($file->getMimeType(), 'image/') !== 0) {
    throw new \Exception('Fichier non-image détecté');
}
```

### **Optimiser les images uploadées**
```php
// Installer: composer require intervention/image
$image = Image::make($file)->resize(800, 800)->save();
Storage::disk('public')->put($path, $image);
```

### **Ajouter un versioning des photos**
```php
// Inclure un hash du fichier dans le nom
$filename = 'photo_' . md5_file($file) . '.jpg';
```

### **Nettoyer les anciennes photos**
```bash
# Supprimer les fichiers de plus de 30 jours
find storage/app/public/photos -type f -mtime +30 -delete
```

---

## 🤝 Support

Tous les fichiers sont documentés avec des commentaires.
Consultez le fichier `PHOTO_SYSTEM_DOCUMENTATION.md` pour plus de détails.

---

## 📝 Résumé Rapide

| Composant | Fichier | Destination |
|-----------|---------|-------------|
| Helper PHP | PhotoHelper.php | `app/Helpers/` |
| Contrôleur API | PhotoUploadController.php | `app/Http/Controllers/Api/` |
| Helper JS | PhotoHelper.js | `resources/js/Helpers/` |
| Composant Upload | PhotoUploadInput.jsx | `resources/js/Components/` |
| Routes | ROUTES_API.php | Ajouter à `routes/api.php` |

**Commandes principales:**
```bash
php artisan migrate                          # Créer les colonnes
php artisan storage:link                     # Créer le lien public
chmod -R 775 storage/app/public              # Permissions
npm run build                                # Builder les assets React
```

---

**Vous êtes prêt!** 🚀 Commencez par l'ÉTAPE 1 et suivez chaque étape dans l'ordre.
