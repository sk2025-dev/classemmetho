// ============================================================================
// EXEMPLES D'INTÉGRATION - Utilisation du système de photos
// ============================================================================

// ============================================================================
// 1. AFFICHER UNE PHOTO DANS UN COMPOSANT REACT
// ============================================================================

import { getPhotoUrl, getAvatarUrl } from '@/Helpers/PhotoHelper';

function UserProfile({ user }) {
    return (
        <div>
            <img
                src={getPhotoUrl(user.photo_path, user.prenom, user.nom)}
                alt={`${user.prenom} ${user.nom}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-400"
            />
            <h2>{user.prenom} {user.nom}</h2>
        </div>
    );
}

// ============================================================================
// 2. UTILISER LE COMPOSANT PHOTOuploadinput
// ============================================================================

import PhotoUploadInput from '@/Components/PhotoUploadInput';
import { useState } from 'react';

function EditProfile({ user }) {
    const [photoPath, setPhotoPath] = useState(user.photo_path);

    const handlePhotoSelected = (photoUrl) => {
        // photoUrl est l'URL complète retournée par l'API
        // Vous pouvez l'utiliser immédiatement ou la sauvegarder
        setPhotoPath(photoUrl);

        // Optionnel: sauvegarder dans la base de données
        // updateUser({ photo_path: photoPath });
    };

    return (
        <div>
            <PhotoUploadInput
                onPhotoSelected={handlePhotoSelected}
                initialPhotoUrl={photoPath}
                size="lg"
            />
            <button onClick={() => saveUser({ photo_path: photoPath })}>
                Enregistrer
            </button>
        </div>
    );
}

// ============================================================================
// 3. UPLOAD MANUEL AVEC FORMDATA
// ============================================================================

function UserForm({ user }) {
    const [formData, setFormData] = useState({
        nom: user.nom,
        prenom: user.prenom,
        photo: null,
    });
    const [photoPreview, setPhotoPreview] = useState(user.photo_path);

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, photo: file });

            // Créer un aperçu
            const preview = URL.createObjectURL(file);
            setPhotoPreview(preview);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Créer FormData pour l'upload
        const form = new FormData();
        form.append('nom', formData.nom);
        form.append('prenom', formData.prenom);
        if (formData.photo) {
            form.append('photo', formData.photo);
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                body: form,
            });

            if (response.ok) {
                alert('Utilisateur créé avec succès');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
                placeholder="Nom"
            />

            <input
                type="text"
                value={formData.prenom}
                onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                placeholder="Prénom"
            />

            {photoPreview && (
                <img src={photoPreview} alt="Aperçu" className="w-24 h-24 rounded object-cover" />
            )}

            <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
            />

            <button type="submit">Créer l'utilisateur</button>
        </form>
    );
}

// ============================================================================
// 4. AVEC INERTIA ET useForm
// ============================================================================

import { useForm } from '@inertiajs/react';
import PhotoUploadInput from '@/Components/PhotoUploadInput';

function RegisterUser() {
    const { data, setData, post, processing, errors } = useForm({
        nom: '',
        prenom: '',
        email: '',
        photo: null,
    });

    const handlePhotoChange = (photoUrl) => {
        // photoUrl vient du composant PhotoUploadInput
        // L'API retourne l'URL, à stocker dans la BD après
        setData('photo_url', photoUrl);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Inertia gère automatiquement l'upload avec forceFormData
        post('/users', {
            forceFormData: true
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label>Nom</label>
                <input
                    type="text"
                    value={data.nom}
                    onChange={(e) => setData('nom', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.nom && <span className="text-red-600">{errors.nom}</span>}
            </div>

            <div>
                <label>Prénom</label>
                <input
                    type="text"
                    value={data.prenom}
                    onChange={(e) => setData('prenom', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.prenom && <span className="text-red-600">{errors.prenom}</span>}
            </div>

            <div>
                <label>Email</label>
                <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.email && <span className="text-red-600">{errors.email}</span>}
            </div>

            <div>
                <label>Photo de profil</label>
                <PhotoUploadInput
                    onPhotoSelected={handlePhotoChange}
                    size="lg"
                />
            </div>

            <button
                type="submit"
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
                {processing ? 'Enregistrement...' : 'Créer l\'utilisateur'}
            </button>
        </form>
    );
}

// ============================================================================
// 5. CÔTÉ BACKEND (PHP) - Utiliser PhotoHelper
// ============================================================================

/*

use App\Helpers\PhotoHelper;

class UserController extends Controller {

    // Afficher un utilisateur avec sa photo
    public function show($userId)
    {
        $user = User::findOrFail($userId);

        return response()->json([
            'id' => $user->id,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'photo_url' => PhotoHelper::getPhotoUrl($user->photo_path, $user->prenom, $user->nom),
            'has_photo' => PhotoHelper::hasPhoto($user->photo_path),
        ]);
    }

    // Créer un utilisateur avec photo
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'required|email|unique:users',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        // Sauvegarder la photo si fournie
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('photos/users', 'public');
        }

        $user = User::create([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'],
            'photo_path' => $photoPath,
        ]);

        return response()->json([
            'id' => $user->id,
            'photo_url' => PhotoHelper::getPhotoUrl($user->photo_path, $user->prenom, $user->nom),
        ]);
    }

    // Mettre à jour la photo d'un utilisateur
    public function updatePhoto(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        // Supprimer l'ancienne photo si elle existe
        if ($user->photo_path && Storage::exists('public/' . $user->photo_path)) {
            Storage::delete('public/' . $user->photo_path);
        }

        // Sauvegarder la nouvelle photo
        $user->photo_path = $request->file('photo')->store('photos/users', 'public');
        $user->save();

        return response()->json([
            'photo_url' => PhotoHelper::getPhotoUrl($user->photo_path, $user->prenom, $user->nom),
            'message' => 'Photo mise à jour avec succès',
        ]);
    }

    // Supprimer la photo d'un utilisateur
    public function deletePhoto($userId)
    {
        $user = User::findOrFail($userId);

        if ($user->photo_path && Storage::exists('public/' . $user->photo_path)) {
            Storage::delete('public/' . $user->photo_path);
        }

        $user->photo_path = null;
        $user->save();

        return response()->json([
            'message' => 'Photo supprimée avec succès',
        ]);
    }
}

*/

// ============================================================================
// 6. EXEMPLE COMPLET - PAGE D'ENREGISTREMENT
// ============================================================================

/*

// resources/js/Pages/Admin/Inscriptions/RegisterUser.jsx

import React, { useState } from 'react';
import PhotoUploadInput from '@/Components/PhotoUploadInput';
import { useForm } from '@inertiajs/react';

export default function RegisterUser() {
    const { data, setData, post, processing, errors } = useForm({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        photo_path: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        post('/users/store', {
            forceFormData: true,
            onSuccess: () => {
                alert('Utilisateur créé avec succès');
            },
        });
    };

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-8">Créer un nouvel utilisateur</h1>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Photo */}
                <div>
                    <label className="block text-lg font-semibold mb-4">Photo de profil</label>
                    <PhotoUploadInput
                        onPhotoSelected={(url) => setData('photo_path', url)}
                        size="lg"
                    />
                </div>

                {/* Nom */}
                <div>
                    <label className="block font-semibold mb-2">Nom</label>
                    <input
                        type="text"
                        value={data.nom}
                        onChange={(e) => setData('nom', e.target.value)}
                        className="w-full border border-gray-300 rounded px-4 py-2"
                        required
                    />
                    {errors.nom && <span className="text-red-600 text-sm">{errors.nom}</span>}
                </div>

                {/* Prénom */}
                <div>
                    <label className="block font-semibold mb-2">Prénom</label>
                    <input
                        type="text"
                        value={data.prenom}
                        onChange={(e) => setData('prenom', e.target.value)}
                        className="w-full border border-gray-300 rounded px-4 py-2"
                        required
                    />
                    {errors.prenom && <span className="text-red-600 text-sm">{errors.prenom}</span>}
                </div>

                {/* Email */}
                <div>
                    <label className="block font-semibold mb-2">Email</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="w-full border border-gray-300 rounded px-4 py-2"
                        required
                    />
                    {errors.email && <span className="text-red-600 text-sm">{errors.email}</span>}
                </div>

                {/* Téléphone */}
                <div>
                    <label className="block font-semibold mb-2">Téléphone</label>
                    <input
                        type="tel"
                        value={data.telephone}
                        onChange={(e) => setData('telephone', e.target.value)}
                        className="w-full border border-gray-300 rounded px-4 py-2"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded"
                >
                    {processing ? 'Enregistrement...' : 'Créer l\'utilisateur'}
                </button>

            </form>
        </div>
    );
}

*/
