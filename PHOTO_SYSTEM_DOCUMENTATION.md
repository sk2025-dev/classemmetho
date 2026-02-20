# 📸 Système de Gestion des Photos - Documentation Complète

## 🎯 Vue d'ensemble
Ce système permet l'upload, le stockage et l'affichage des photos de profil dans l'application. Il fonctionne avec Laravel (backend) et React (frontend).

---

## 📁 Fichiers Principaux du Système

### **Backend (PHP/Laravel)**

#### 1. **app/Helpers/PhotoHelper.php**
- Helper pour générer les URLs des photos
- Convertit les chemins relatifs en URLs complètes
- Fournit des avatars de secours via ui-avatars.com

#### 2. **app/Http/Controllers/PhotoController.php**
- Contrôleur principal pour l'upload de photos
- Gère l'organisation des fichiers par type
- Valide la taille et le format des fichiers

#### 3. **app/Http/Controllers/Api/PhotoUploadController.php**
- API pour uploader les photos de profil
- Gère la suppression des photos
- Retourne les URLs publiques

#### 4. **routes/api.php**
- Route POST: `/api/profile/photo/upload`
- Route DELETE: `/api/profile/photo/delete`

### **Frontend (React/JSX)**

#### 1. **resources/js/Helpers/PhotoHelper.js**
- Équivalent JavaScript du helper PHP
- Génère les URLs et avatars côté client

#### 2. **resources/js/Components/PhotoUploadInput.jsx**
- Composant réutilisable pour uploader des photos
- Gère l'aperçu local avant upload
- Valide la taille et le type de fichier

#### 3. **Pages utilisant les photos:**
- `resources/js/Pages/Admin/Inscriptions/RegisterFamille.jsx`
- `resources/js/Pages/Admin/Inscriptions/RegisterConducteur.jsx`
- `resources/js/Pages/Conducteur/Inscriptions.jsx`
- `resources/js/Pages/MembreFamille/Profile.jsx`
- `resources/js/Pages/ResponsableFamille/Members/EditMember.jsx`

---

## 🔄 Flux de Fonctionnement

### **Affichage des Photos:**
```
Database (photo_path: string) 
    ↓
PhotoHelper::getPhotoUrl() (PHP)
    ↓
API Response
    ↓
Frontend PhotoHelper.js
    ↓
<img src={photoUrl} />
```

### **Upload de Photos:**
```
File Selection in React
    ↓
Validation (type, size < 5MB)
    ↓
API /profile/photo/upload (POST)
    ↓
Storage::disk('public')->putFileAs()
    ↓
Return URL
    ↓
Update State in React
    ↓
Send with Form Data
    ↓
Save path in Database
```

---

## 🗂️ Structure de Stockage

```
storage/app/public/
├── photos/
│   ├── users/
│   ├── profiles/
│   ├── families/
│   └── conducteurs/
└── members/
```

Les fichiers sont accessibles via: `/storage/{chemin-du-fichier}`

---

## 📊 Modèles de Données

### **Colonnes de Base de Données:**
- `photo_path` (string|nullable): Chemin relatif stocké en BDD
- `profile_photo_url` (string|nullable): URL complète pour certains modèles

### **Formats Acceptés:**
- JPEG, PNG, JPG, GIF, WebP
- Taille maximale: 5MB (5120 KB)

---

## 🔧 Configuration Requise

### **1. Lien Symbolique**
Assurez-vous que le lien symbolique existe:
```bash
php artisan storage:link
```

### **2. Middleware CSRF**
Les routes d'upload utilisent la protection CSRF - c'est géré automatiquement par Inertia.

### **3. Permissions**
Le dossier `storage/app/public` doit être écrivable:
```bash
chmod -R 775 storage/app/public
```

---

## 💾 Base de Données

### **Migrations Requises:**
- La colonne `photo_path` dans la table `users`
- La colonne `profile_photo_url` dans la table `users`

Exemple de migration:
```sql
ALTER TABLE users ADD COLUMN photo_path VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR(255) NULL;
```

---

## 🎨 Utilisation dans Components React

### **Affichage Simple:**
```jsx
import { getPhotoUrl } from '@/Helpers/PhotoHelper';

<img 
  src={getPhotoUrl(user.photo_path, user.prenom, user.nom)}
  alt="Profil"
  className="w-12 h-12 rounded-full object-cover"
/>
```

### **Upload avec PhotoUploadInput:**
```jsx
import PhotoUploadInput from '@/Components/PhotoUploadInput';

<PhotoUploadInput 
  onPhotoSelected={(photoUrl) => {
    setData({...data, photo_path: photoUrl});
  }}
  initialPhotoUrl={user?.photo_path}
  size="lg"
/>
```

### **Upload Manuel (inline):**
```jsx
const handlePhotoChange = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setPhotoFile(file);
  }
};

<input
  type="file"
  accept="image/*"
  onChange={handlePhotoChange}
/>
```

---

## 🚀 Intégration dans un Formulaire

### **Avec FormData:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('nom', data.nom);
  formData.append('prenom', data.prenom);
  formData.append('photo', photoFile); // File object
  
  const response = await fetch('/api/users', {
    method: 'POST',
    body: formData,
  });
};
```

### **Avec Inertia + useForm:**
```jsx
import { useForm } from '@inertiajs/react';

const { data, setData, post, processing } = useForm({
  nom: '',
  prenom: '',
  photo: null,
});

const handlePhotoChange = (e) => {
  const file = e.target.files[0];
  setData('photo', file);
};

const handleSubmit = () => {
  post('/users', { forceFormData: true });
};
```

---

## 🐍 Utilisation Côté Backend

### **Sauvegarder une Photo:**
```php
if ($request->hasFile('photo')) {
  $photoPath = $request->file('photo')->store('photos/users', 'public');
  $user->photo_path = $photoPath;
  $user->save();
}
```

### **Afficher la Photo:**
```php
use App\Helpers\PhotoHelper;

$user = User::find(1);
$photoUrl = PhotoHelper::getPhotoUrl($user->photo_path, $user->prenom, $user->nom);
```

### **Supprimer une Photo:**
```php
if ($user->photo_path && Storage::exists('public/' . $user->photo_path)) {
  Storage::delete('public/' . $user->photo_path);
  $user->photo_path = null;
  $user->save();
}
```

---

## 🔒 Sécurité

### **Validation:**
- ✅ Vérification du type MIME
- ✅ Limite de taille (5MB)
- ✅ Extensions permises uniquement
- ✅ Protection CSRF

### **Stockage:**
- ✅ Les fichiers sont stockés en dehors de la racine web
- ✅ Accès via le disque 'public' configuré
- ✅ Noms de fichiers aléatoires pour éviter les collisions

---

## 🐛 Dépannage

### **Problème: Photos ne s'affichent pas**
1. Vérifier que `php artisan storage:link` est exécuté
2. Vérifier les permissions du dossier `storage/app/public`
3. Vérifier que la colonne existe en base de données

### **Problème: Upload échoue**
1. Vérifier la taille du fichier (< 5MB)
2. Vérifier le format (JPEG, PNG, GIF, WebP)
3. Vérifier les permissions en écriture

### **Problème: CSRF Token**
1. S'assurer que la route utilise `middleware(['web'])`
2. Vérifier que Inertia ajoute automatiquement le token

---

## 📋 Checklist d'Intégration

- [ ] Vérifier que `app/Helpers/PhotoHelper.php` existe
- [ ] Vérifier que `app/Http/Controllers/Api/PhotoUploadController.php` existe
- [ ] Vérifier que les routes sont définies dans `routes/api.php`
- [ ] Exécuter `php artisan storage:link`
- [ ] Vérifier que `resources/js/Helpers/PhotoHelper.js` existe
- [ ] Vérifier que `resources/js/Components/PhotoUploadInput.jsx` existe
- [ ] Importer les helpers dans les pages React
- [ ] Tester l'upload d'une photo
- [ ] Vérifier l'affichage de la photo
- [ ] Tester la suppression de la photo

---

## 📞 Besoin d'aide?

Tous les fichiers sont documentés et prêts à être intégrés. Chaque fonction a des commentaires expliquant son usage.

