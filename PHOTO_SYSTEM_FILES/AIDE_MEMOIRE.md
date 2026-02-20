# ⚡ AIDE-MÉMOIRE RAPIDE

## 📦 4 Fichiers Code à Copier

```bash
PhotoHelper.php                     → app/Helpers/PhotoHelper.php
PhotoUploadController.php           → app/Http/Controllers/Api/PhotoUploadController.php
PhotoHelper.js                      → resources/js/Helpers/PhotoHelper.js
PhotoUploadInput.jsx                → resources/js/Components/PhotoUploadInput.jsx
```

## 🔧 Routes à Ajouter (dans routes/api.php)

```php
use App\Http\Controllers\Api\PhotoUploadController;

Route::middleware(['auth:web'])->group(function () {
    Route::post('/profile/photo/upload', [PhotoUploadController::class, 'uploadProfilePhoto']);
    Route::delete('/profile/photo/delete', [PhotoUploadController::class, 'deleteProfilePhoto']);
});
```

## 🏃 Commandes à Exécuter

```bash
php artisan storage:link                    # Créer lien public/storage
php artisan migrate                         # Migrer BD (si nouvelle)
chmod -R 775 storage/app/public             # Permissions
npm run build                               # Build assets React
```

## 🎨 Utilisation Basique

```jsx
// Afficher une photo
import { getPhotoUrl } from '@/Helpers/PhotoHelper';
<img src={getPhotoUrl(user.photo_path, user.prenom, user.nom)} />

// Uploader une photo
import PhotoUploadInput from '@/Components/PhotoUploadInput';
<PhotoUploadInput onPhotoSelected={(url) => setPhoto(url)} />
```

## ✅ Vérification Rapide

```bash
# Vérifier le lien
ls -la public/storage

# Vérifier les permissions
ls -la storage/app/public

# Vérifier les routes
php artisan route:list | grep photo

# Vérifier les colonnes BD
php artisan tinker
>>> User::first()->photo_path
```

## 🐛 Problèmes Courants

| Problème | Solution |
|----------|----------|
| Photos ne s'affichent pas | `php artisan storage:link` |
| Permission denied | `chmod -R 775 storage/` |
| Upload échoue | Vérifier taille < 5MB + format image |
| Routes non trouvées | Redémarrer le serveur |

---

**Besoin de plus de détails?** → Lire les documents dans `PHOTO_SYSTEM_FILES/`
