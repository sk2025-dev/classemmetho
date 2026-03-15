# 🎨 EXEMPLES DE CODE - GESTION DES PHOTOS

Ce fichier contient des exemples VUE.JS, JAVASCRIPT ET PHP réels pour implémenter les photos.

---

## 📌 TABLE DES MATIÈRES

1. [Composants Vue.js](#vue-components)
2. [Formulaires avec upload](#forms)
3. [Appels API JavaScript](#api-calls)
4. [Contrôleurs Laravel](#controllers)
5. [Modèles et Migrations](#models)

---

## <a name="vue-components"></a>🎨 COMPOSANTS VUE.JS

### 1. Avatar avec Photo ou Initiales

**Composant: `AvatarComponent.vue`**

```vue
<template>
  <div class="avatar-container">
    <!-- Si photo existe -->
    <div v-if="photoUrl" class="avatar-with-photo">
      <img 
        :src="photoUrl"
        :alt="`${prenom} ${nom}`"
        class="avatar-img"
        @error="onImageError"
      />
    </div>
    
    <!-- Si pas de photo, afficher avatar avec couleur + initiales -->
    <div 
      v-else
      class="avatar-initials"
      :style="{ backgroundColor: backgroundColor }"
    >
      <span class="initials">{{ initials }}</span>
    </div>
    
    <!-- Badge optionnel pour modification -->
    <div v-if="showEditBadge" class="edit-badge">
      <i class="icon-pencil"></i>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    // Photo URL ou chemin
    photoUrl: {
      type: String,
      default: null
    },
    // Données de la personne
    prenom: {
      type: String,
      required: true
    },
    nom: {
      type: String,
      required: true
    },
    // Paramètres d'affichage
    size: {
      type: String,
      default: 'md',  // sm, md, lg, xl
      validator: val => ['sm', 'md', 'lg', 'xl'].includes(val)
    },
    showEditBadge: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      imageLoadError: false
    }
  },
  
  computed: {
    initials() {
      const p = this.prenom?.charAt(0).toUpperCase() || '?';
      const n = this.nom?.charAt(0).toUpperCase() || '?';
      return `${p}${n}`;
    },
    
    backgroundColor() {
      // Couleur déterministe basée sur le nom
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#95E1D3'
      ];
      const hash = this.nom.charCodeAt(0) + this.prenom.charCodeAt(0);
      return colors[hash % colors.length];
    }
  },
  
  methods: {
    onImageError() {
      // Si la photo n'est pas trouvée, afficher les initiales
      this.imageLoadError = true;
    }
  }
}
</script>

<style scoped>
.avatar-container {
  position: relative;
  display: inline-block;
  width: var(--avatar-size, 40px);
  height: var(--avatar-size, 40px);
}

/* Tailles */
.avatar-container :deep([class*='md']) { --avatar-size: 40px; }
.avatar-container :deep([class*='sm']) { --avatar-size: 24px; }
.avatar-container :deep([class*='lg']) { --avatar-size: 64px; }
.avatar-container :deep([class*='xl']) { --avatar-size: 96px; }

.avatar-with-photo,
.avatar-initials {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 0.875rem;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: #3B82F6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  cursor: pointer;
}
</style>
```

**Usage:**
```vue
<template>
  <!-- Avec photo -->
  <AvatarComponent 
    :photo-url="user.profile_photo_url"
    :prenom="user.prenom"
    :nom="user.nom"
    size="md"
    :show-edit-badge="isEditing"
  />
  
  <!-- Sans photo (affichera initiales) -->
  <AvatarComponent 
    :prenom="user.prenom"
    :nom="user.nom"
    size="lg"
  />
</template>
```

---

### 2. Photo Upload avec Preview

**Composant: `PhotoUploadComponent.vue`**

```vue
<template>
  <div class="photo-upload">
    <!-- Zone de drag-drop -->
    <div 
      class="drop-zone"
      :class="{ 'is-dragging': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onFileDrop"
    >
      <!-- Preview actuel -->
      <div v-if="preview || currentPhotoUrl" class="preview-container">
        <img 
          :src="preview || currentPhotoUrl"
          alt="Preview"
          class="preview-img"
        />
        <button 
          type="button"
          class="btn-remove"
          @click="removePhoto"
        >
          ✕
        </button>
      </div>
      
      <!-- Zone d'upload -->
      <div v-else class="upload-area">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-7" />
        </svg>
        <p class="upload-text">Déposez votre photo ici</p>
        <p class="upload-hint">ou cliquez pour sélectionner</p>
        <input 
          ref="fileInput"
          type="file"
          accept="image/*"
          class="file-input"
          @change="onFileSelect"
        />
      </div>
    </div>
    
    <!-- Erreurs -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <!-- Info fichier -->
    <div v-if="selectedFile" class="file-info">
      <span class="file-name">{{ selectedFile.name }}</span>
      <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    currentPhotoUrl: {
      type: String,
      default: null
    },
    maxFileSize: {
      type: Number,
      default: 5 * 1024 * 1024  // 5 MB
    }
  },
  
  emits: ['photo-selected', 'photo-removed'],
  
  data() {
    return {
      isDragging: false,
      preview: null,
      selectedFile: null,
      error: null
    }
  },
  
  methods: {
    onFileDrop(e) {
      this.isDragging = false;
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    },
    
    onFileSelect(e) {
      const files = e.target.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    },
    
    handleFile(file) {
      // Réinitialiser les erreurs
      this.error = null;
      
      // Validation MIME
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(file.type)) {
        this.error = 'Format non autorisé. Utilisez JPEG, PNG, GIF ou WebP';
        return;
      }
      
      // Validation taille
      if (file.size > this.maxFileSize) {
        this.error = `Le fichier dépasse ${this.maxFileSize / (1024 * 1024)} MB`;
        return;
      }
      
      // Lecture et préview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.preview = e.target.result;
      };
      reader.readAsDataURL(file);
      
      this.selectedFile = file;
      this.$emit('photo-selected', file);
    },
    
    removePhoto() {
      this.preview = null;
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
      this.$emit('photo-removed');
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
  }
}
</script>

<style scoped>
.photo-upload {
  width: 100%;
}

.drop-zone {
  border: 2px dashed #CBD5E0;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
}

.drop-zone.is-dragging {
  border-color: #3B82F6;
  background-color: #EFF6FF;
}

.preview-container {
  position: relative;
  display: inline-block;
}

.preview-img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.btn-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #EF4444;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.upload-area {
  padding: 20px;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #9CA3AF;
  margin-bottom: 12px;
}

.upload-text {
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.upload-hint {
  font-size: 0.875rem;
  color: #9CA3AF;
  margin: 4px 0 0 0;
}

.file-input {
  display: none;
}

.error-message {
  color: #DC2626;
  font-size: 0.875rem;
  margin-top: 8px;
  padding: 8px;
  background-color: #FEE2E2;
  border-radius: 4px;
}

.file-info {
  margin-top: 12px;
  font-size: 0.875rem;
  color: #6B7280;
  display: flex;
  justify-content: space-between;
}
</style>
```

**Usage:**
```vue
<template>
  <PhotoUploadComponent 
    :current-photo-url="user.profile_photo_url"
    @photo-selected="onPhotoSelected"
    @photo-removed="onPhotoRemoved"
  />
</template>

<script>
export default {
  methods: {
    onPhotoSelected(file) {
      // Le fichier est sélectionné
      // Vous pouvez l'envoyer immédiatement ou le garder pour submit
      console.log('Photo sélectionnée:', file);
      this.formData.photo = file;
    },
    
    onPhotoRemoved() {
      console.log('Photo supprimée');
      this.formData.photo = null;
    }
  }
}
</script>
```

---

## <a name="forms"></a>📝 FORMULAIRES AVEC UPLOAD

### Formulaire d'Inscription Familiale

**Composant: `FamilyRegistrationForm.vue`**

```vue
<template>
  <form @submit.prevent="submitForm" class="registration-form">
    <!-- Responsable Section -->
    <div class="form-section">
      <h2>Informations du Responsable</h2>
      
      <!-- Photo -->
      <div class="form-group">
        <label>Photo du Responsable</label>
        <PhotoUploadComponent 
          @photo-selected="formData.responsable.photo = $event"
          @photo-removed="formData.responsable.photo = null"
        />
      </div>
      
      <!-- Nom & Prénom -->
      <div class="form-row">
        <div class="form-group">
          <label>Nom *</label>
          <input 
            v-model="formData.responsable.nom"
            type="text"
            required
          />
          <span v-if="errors['responsable.nom']" class="error">
            {{ errors['responsable.nom'][0] }}
          </span>
        </div>
        
        <div class="form-group">
          <label>Prénom *</label>
          <input 
            v-model="formData.responsable.prenom"
            type="text"
            required
          />
          <span v-if="errors['responsable.prenom']" class="error">
            {{ errors['responsable.prenom'][0] }}
          </span>
        </div>
      </div>
      
      <!-- Email & Téléphone -->
      <div class="form-row">
        <div class="form-group">
          <label>Email *</label>
          <input 
            v-model="formData.responsable.email"
            type="email"
            required
          />
          <span v-if="errors['responsable.email']" class="error">
            {{ errors['responsable.email'][0] }}
          </span>
        </div>
        
        <div class="form-group">
          <label>Téléphone *</label>
          <input 
            v-model="formData.responsable.tel"
            type="tel"
            required
          />
          <span v-if="errors['responsable.tel']" class="error">
            {{ errors['responsable.tel'][0] }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Membres Section -->
    <div class="form-section">
      <h2>Membres de la Famille</h2>
      
      <div 
        v-for="(membre, index) in formData.membres"
        :key="index"
        class="membre-card"
      >
        <h3>Membre #{{ index + 1 }}</h3>
        
        <!-- Photo du membre -->
        <div class="form-group">
          <label>Photo</label>
          <PhotoUploadComponent 
            @photo-selected="membre.photo = $event"
            @photo-removed="membre.photo = null"
          />
        </div>
        
        <!-- Nom & Prénom -->
        <div class="form-row">
          <div class="form-group">
            <label>Nom *</label>
            <input 
              v-model="membre.nom"
              type="text"
              required
            />
          </div>
          <div class="form-group">
            <label>Prénom *</label>
            <input 
              v-model="membre.prenom"
              type="text"
              required
            />
          </div>
        </div>
        
        <!-- Bouton supprimer membre -->
        <button 
          type="button"
          class="btn btn-danger"
          @click="removeMembre(index)"
        >
          Supprimer ce membre
        </button>
      </div>
      
      <!-- Ajouter un membre -->
      <button 
        type="button"
        class="btn btn-secondary"
        @click="addMembre"
      >
        + Ajouter un membre
      </button>
    </div>
    
    <!-- Submit -->
    <div class="form-actions">
      <button 
        type="submit"
        class="btn btn-primary"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Envoi en cours...' : 'Soumettre l\'inscription' }}
      </button>
    </div>
    
    <!-- Messages -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
    <div v-if="generalError" class="error-message">
      {{ generalError }}
    </div>
  </form>
</template>

<script>
import PhotoUploadComponent from './PhotoUploadComponent.vue';

export default {
  components: {
    PhotoUploadComponent
  },
  
  data() {
    return {
      formData: {
        responsable: {
          nom: '',
          prenom: '',
          email: '',
          tel: '',
          photo: null
        },
        membres: [
          { nom: '', prenom: '', photo: null }
        ],
        famille: {
          nom: '',
          quartier: '',
          adresse: ''
        }
      },
      errors: {},
      isSubmitting: false,
      successMessage: '',
      generalError: ''
    }
  },
  
  methods: {
    addMembre() {
      this.formData.membres.push({ 
        nom: '', 
        prenom: '', 
        photo: null 
      });
    },
    
    removeMembre(index) {
      this.formData.membres.splice(index, 1);
    },
    
    async submitForm() {
      this.isSubmitting = true;
      this.errors = {};
      this.generalError = '';
      
      try {
        // Créer FormData (supporte les fichiers)
        const formData = new FormData();
        
        // Responsable
        formData.append('responsable[nom]', this.formData.responsable.nom);
        formData.append('responsable[prenom]', this.formData.responsable.prenom);
        formData.append('responsable[email]', this.formData.responsable.email);
        formData.append('responsable[tel]', this.formData.responsable.tel);
        if (this.formData.responsable.photo) {
          formData.append('responsable[photo]', this.formData.responsable.photo);
        }
        
        // Famille
        formData.append('famille[nom]', this.formData.famille.nom);
        formData.append('famille[quartier]', this.formData.famille.quartier);
        
        // Membres
        this.formData.membres.forEach((membre, index) => {
          formData.append(`membres[${index}][nom]`, membre.nom);
          formData.append(`membres[${index}][prenom]`, membre.prenom);
          if (membre.photo) {
            formData.append(`membres[${index}][photo]`, membre.photo);
          }
        });
        
        // Envoyer au serveur
        const response = await fetch('/api/register/family', {
          method: 'POST',
          body: formData,
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          if (data.errors) {
            this.errors = data.errors;
          } else {
            this.generalError = data.message || 'Une erreur est survenue';
          }
          return;
        }
        
        // Succès!
        this.successMessage = data.message;
        console.log('Inscription créée:', data);
        
        // Redirection après 2 secondes
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        
      } catch (error) {
        console.error('Erreur d\'envoi:', error);
        this.generalError = 'Erreur de connexion. Veuillez réessayer.';
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}
</script>

<style scoped>
.registration-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #E5E7EB;
}

.form-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5rem;
  color: #111827;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group .error {
  color: #DC2626;
  font-size: 0.875rem;
  margin-top: 4px;
}

.membre-card {
  background: #F9FAFB;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.membre-card h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1rem;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #3B82F6;
  color: white;
}

.btn-primary:hover {
  background: #2563EB;
}

.btn-primary:disabled {
  background: #D1D5DB;
  cursor: not-allowed;
}

.btn-secondary {
  background: #E5E7EB;
  color: #374151;
}

.btn-secondary:hover {
  background: #D1D5DB;
}

.btn-danger {
  background: #EF4444;
  color: white;
}

.form-actions {
  margin-top: 32px;
  display: flex;
  gap: 12px;
}

.success-message {
  margin-top: 16px;
  padding: 12px;
  background-color: #DCFCE7;
  border: 1px solid #86EFAC;
  color: #166534;
  border-radius: 4px;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background-color: #FEE2E2;
  border: 1px solid #FECACA;
  color: #991B1B;
  border-radius: 4px;
}
</style>
```

---

## <a name="api-calls"></a>🔗 APPELS API JAVASCRIPT

### Upload Simple de Photo

```javascript
// Avec fetch()
async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('type', 'user');
  formData.append('entity_id', userId);

  const response = await fetch('/api/photo/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
    }
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Photo uploadée:', data.data.url);
    return data.data;
  } else {
    throw new Error(data.errors);
  }
}

// Utilisation
document.getElementById('photoInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  try {
    const result = await uploadPhoto(file);
    console.log('Chemin sauvegardé:', result.path);
    console.log('URL à afficher:', result.url);
  } catch (error) {
    console.error('Erreur upload:', error);
  }
});
```

### Upload Avec Progress Bar

```javascript
async function uploadPhotoWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('type', 'user');

    // Progress event
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(percent);
      }
    });

    // Completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data);
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload error')));

    xhr.open('POST', '/api/photo/upload');
    xhr.setRequestHeader('X-CSRF-TOKEN', 
      document.querySelector('meta[name="csrf-token"]').content);
    xhr.send(formData);
  });
}

// Utilisation
const file = document.getElementById('photoInput').files[0];
uploadPhotoWithProgress(file, (percent) => {
  console.log(`Upload: ${percent.toFixed(0)}%`);
  document.getElementById('progressBar').style.width = percent + '%';
});
```

### Supprimer une Photo

```javascript
async function deletePhoto(path) {
  const response = await fetch('/api/photo/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
    },
    body: JSON.stringify({ path })
  });

  const data = await response.json();
  if (data.success) {
    console.log('Photo supprimée');
  }
  return data;
}

// Utilisation
deletePhoto('inscriptions/inscription_xyz.jpg');
```

---

## <a name="controllers"></a>🎮 CONTRÔLEURS LARAVEL

### PhotoController Complet

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PhotoController extends Controller
{
    /**
     * Upload une photo et retourne le chemin + URL
     */
    public function upload(Request $request)
    {
        try {
            // Validation
            $validator = Validator::make($request->all(), [
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
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

            // Créer chemin avec date
            $path = "photos/{$type}/" . date('Y/m/d');
            $filename = uniqid() . '_' . time() . '.' . $photo->getClientOriginalExtension();

            // Stocker le fichier
            $storagePath = Storage::disk('public')->putFileAs(
                $path,
                $photo,
                $filename
            );

            if (!$storagePath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors du stockage'
                ], 500);
            }

            // Retourner chemin et URL complète
            $publicUrl = asset('storage/' . $storagePath);

            \Log::info('Photo uploadée', [
                'path' => $storagePath,
                'url' => $publicUrl,
                'user_id' => \Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Photo uploadée avec succès',
                'data' => [
                    'path' => $storagePath,
                    'url' => $publicUrl,
                    'filename' => $filename,
                    'type' => $type
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Photo upload error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload'
            ], 500);
        }
    }

    /**
     * Supprime une photo
     */
    public function delete(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'path' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $path = $request->input('path');

            // Vérifier que le chemin n'accède pas à d'autres répertoires
            if (strpos($path, '..') !== false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }

            // Supprimer le fichier
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);

                \Log::info('Photo supprimée', [
                    'path' => $path,
                    'user_id' => \Auth::id()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Photo supprimée avec succès'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Fichier non trouvé'
            ], 404);

        } catch (\Exception $e) {
            \Log::error('Photo delete error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression'
            ], 500);
        }
    }
}
```

---

### RegistrationController - Stockage de Photos

```php
<?php

namespace App\Http\Controllers;

use App\Models\Inscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RegistrationController extends Controller
{
    /**
     * Stocker une photo dans storage/app/public/
     * Retourne ['path' => ..., 'url' => ...]
     */
    private function storePhotoAsFile($file)
    {
        try {
            if (!$file || !$file->isValid()) {
                return null;
            }

            // Créer un nom unique: inscription_uniqid_timestamp.ext
            $extension = $file->getClientOriginalExtension();
            $filename = 'inscription_' . uniqid() . '_' . time() . '.' . $extension;

            // Stocker dans storage/app/public/inscriptions/
            $path = Storage::disk('public')->putFileAs(
                'inscriptions',
                $file,
                $filename
            );

            if (!$path) {
                Log::error('Erreur stockage photo');
                return null;
            }

            // Générer l'URL complète
            $photoUrl = asset('storage/' . $path);

            Log::info('Photo stockée', [
                'path' => $path,
                'url' => $photoUrl,
                'size' => $file->getSize(),
                'mime' => $file->getMimeType()
            ]);

            return [
                'path' => $path,           // inscriptions/inscription_xyz.jpg
                'url' => $photoUrl,        // /storage/inscriptions/inscription_xyz.jpg
            ];

        } catch (\Exception $e) {
            Log::error('Erreur storePhotoAsFile', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Enregistrer une inscription avec photos
     */
    public function registerFamily(Request $request)
    {
        // Validation
        $validated = $request->validate([
            'responsable.nom' => 'required|string|max:100',
            'responsable.prenom' => 'required|string|max:100',
            'responsable.email' => 'required|email',
            'responsable.tel' => 'required|string',
            'responsable.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            
            'membres.*.nom' => 'required|string|max:100',
            'membres.*.prenom' => 'required|string|max:100',
            'membres.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        // Créer avec transaction
        $inscription = DB::transaction(function () use ($request, $validated) {
            // Stocker la photo du responsable
            $photoPath = null;
            $photoUrl = null;

            if ($request->hasFile('responsable.photo')) {
                $photoData = $this->storePhotoAsFile($request->file('responsable.photo'));
                $photoPath = $photoData['path'] ?? null;
                $photoUrl = $photoData['url'] ?? null;
            }

            // Traiter les photos des membres
            $membresData = [];
            foreach ($validated['membres'] as $index => $membre) {
                $memberPhotoPath = null;

                if ($request->hasFile("membres.{$index}.photo")) {
                    $memberPhotoData = $this->storePhotoAsFile(
                        $request->file("membres.{$index}.photo")
                    );
                    $memberPhotoPath = $memberPhotoData['path'] ?? null;
                }

                $membresData[$index] = array_merge($membre, [
                    'photo_path' => $memberPhotoPath
                ]);
            }

            // Créer l'inscription
            $inscription = Inscription::create([
                'type' => 'famille',
                'status' => 'en_attente',
                'photo_path' => $photoPath,
                'profile_photo_url' => $photoUrl,
                'responsable_nom' => $validated['responsable']['nom'],
                'responsable_prenom' => $validated['responsable']['prenom'],
                'responsable_email' => $validated['responsable']['email'],
                'data' => [
                    'responsable' => $validated['responsable'],
                    'membres' => $membresData
                ]
            ]);

            Log::info('Inscription créée', [
                'id' => $inscription->id,
                'responsable_photo' => $photoPath,
                'membres_count' => count($membresData)
            ]);

            return $inscription;
        });

        return response()->json([
            'success' => true,
            'message' => 'Inscription créée avec succès',
            'data' => [
                'inscription_id' => $inscription->id,
                'reference' => 'FAM-' . $inscription->id
            ]
        ]);
    }
}
```

---

## <a name="models"></a>📊 MODÈLES ET MIGRATIONS

### Migration: Ajouter les colonnes photos

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // === USERS: Ajouter photo_path ===
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = Schema::getColumnListing('users');
                
                if (!in_array('photo_path', $columns)) {
                    $table->string('photo_path')
                        ->nullable()
                        ->comment('Chemin du fichier photo');
                }
            });
        }

        // === INSCRIPTIONS: Ajouter photo_path ===
        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');
                
                if (!in_array('photo_path', $columns)) {
                    $table->string('photo_path')
                        ->nullable()
                        ->comment('Chemin photo du responsable');
                }
                
                if (!in_array('profile_photo_url', $columns)) {
                    $table->string('profile_photo_url')
                        ->nullable()
                        ->comment('URL complète de la photo');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = Schema::getColumnListing('users');
                if (in_array('photo_path', $columns)) {
                    $table->dropColumn('photo_path');
                }
            });
        }

        if (Schema::hasTable('inscriptions')) {
            Schema::table('inscriptions', function (Blueprint $table) {
                $columns = Schema::getColumnListing('inscriptions');
                if (in_array('photo_path', $columns)) {
                    $table->dropColumn('photo_path');
                }
                if (in_array('profile_photo_url', $columns)) {
                    $table->dropColumn('profile_photo_url');
                }
            });
        }
    }
};
```

### Model: User avec Photos

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Helpers\PhotoHelper;

class User extends Model
{
    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'photo_path',
        // ... autres champs
    ];

    /**
     * Accessor: Générer l'URL de la photo
     */
    public function getProfilePhotoUrlAttribute()
    {
        return PhotoHelper::getPhotoUrl(
            $this->photo_path,
            $this->prenom,
            $this->nom
        );
    }

    /**
     * Événement: Auto-supprimer la photo lors de suppression du modèle
     */
    protected static function booted()
    {
        static::deleting(function ($user) {
            if ($user->photo_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($user->photo_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->photo_path);
            }
        });
    }
}
```

### Model: Inscription avec Photos

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Helpers\PhotoHelper;

class Inscription extends Model
{
    protected $fillable = [
        'type',
        'status',
        'photo_path',
        'profile_photo_url',
        'responsable_nom',
        'responsable_prenom',
        'data',
        // ... autres champs
    ];

    protected $casts = [
        'data' => 'array'
    ];

    /**
     * Accessor: Générer l'URL de la photo du responsable
     */
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

    /**
     * Événement: Supprimer toutes les photos (responsable + membres)
     */
    protected static function booted()
    {
        static::deleting(function ($inscription) {
            $disk = \Illuminate\Support\Facades\Storage::disk('public');

            // Supprimer photo du responsable
            if ($inscription->photo_path && $disk->exists($inscription->photo_path)) {
                $disk->delete($inscription->photo_path);
            }

            // Supprimer photos des membres (depuis JSON)
            if (!empty($inscription->data['membres']) && is_array($inscription->data['membres'])) {
                foreach ($inscription->data['membres'] as $membre) {
                    if (isset($membre['photo_path']) && $disk->exists($membre['photo_path'])) {
                        $disk->delete($membre['photo_path']);
                    }
                }
            }
        });
    }
}
```

---

**FIN DES EXEMPLES**  
Vous avez maintenant des exemples concrets pour:
- Afficher les photos (Avatar, Preview)
- Uploader les photos (Forms, Input)
- Appeler l'API (Fetch, XHR)
- Traiter au backend (Controllers, Storage)
- Modéliser les données (Models, Migrations)
