<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Helpers\PhotoHelper;

/**
 * Contrôleur API pour la gestion des photos de profil
 * Gère l'upload et la suppression des photos utilisateur
 */
class PhotoUploadController extends Controller
{
    /**
     * Upload une photo de profil
     *
     * @param Request $request - Doit contenir le fichier 'photo'
     * @return \Illuminate\Http\JsonResponse
     *
     * Exemple d'utilisation:
     * POST /api/profile/photo/upload
     * Content-Type: multipart/form-data
     * photo: <fichier image>
     */
    public function uploadProfilePhoto(Request $request)
    {
        try {
            // Valider la photo
            $request->validate([
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            ]);

            $file = $request->file('photo');
            $userId = auth()->id();

            // Générer un nom unique pour éviter les collisions
            $filename = 'profile_' . $userId . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();

            // Créer un dossier unique par utilisateur et date
            $path = 'profiles/' . date('Y/m/d') . '/' . $filename;

            // Stocker l'image dans storage/app/public/profiles
            $storagePath = Storage::disk('public')->putFileAs(
                'profiles/' . date('Y/m/d'),
                $file,
                $filename
            );

            if (!$storagePath) {
                return response()->json([
                    'success' => false,
                    'error' => 'Erreur lors du stockage de la photo',
                ], 500);
            }

            // Retourner l'URL publique
            $photoUrl = asset('storage/' . $storagePath);

            return response()->json([
                'success' => true,
                'photo_url' => $photoUrl,
                'path' => $storagePath,
                'message' => 'Photo uploadée avec succès',
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation échouée',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            \Log::error('Erreur upload photo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'upload de la photo',
            ], 500);
        }
    }

    /**
     * Supprime la photo de profil de l'utilisateur authentifié
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     *
     * Exemple d'utilisation:
     * DELETE /api/profile/photo/delete
     */
    public function deleteProfilePhoto(Request $request)
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => 'Utilisateur non authentifié',
                ], 401);
            }

            // Vérifier si l'utilisateur a une photo
            $photoPath = $user->photo_path ?? $user->profile_photo_url;

            if (!$photoPath) {
                return response()->json([
                    'success' => false,
                    'error' => 'Aucune photo à supprimer',
                ], 404);
            }

            // Extraire le chemin du fichier
            if (strpos($photoPath, 'storage/') !== false) {
                $path = str_replace(asset('storage/'), '', $photoPath);
            } else {
                $path = $photoPath;
            }

            // Supprimer le fichier du disque public
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }

            // Mettre à jour l'utilisateur
            if (isset($user->photo_path)) {
                $user->update(['photo_path' => null]);
            } else {
                $user->update(['profile_photo_url' => null]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Photo supprimée avec succès',
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur suppression photo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la suppression',
            ], 500);
        }
    }

    /**
     * Upload une photo avec type et entity_id optionnels
     * Pour un usage plus flexible (templates, organisations, etc.)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadWithType(Request $request)
    {
        try {
            $request->validate([
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'type' => 'nullable|string|in:family,organization,event',
                'entity_id' => 'nullable|integer',
            ]);

            $file = $request->file('photo');
            $type = $request->input('type', 'general');
            $entityId = $request->input('entity_id', 'default');

            // Générer un nom unique
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();

            // Créer un dossier par type
            $directory = 'photos/' . $type . '/' . date('Y/m/d');

            // Stocker le fichier
            $storagePath = Storage::disk('public')->putFileAs($directory, $file, $filename);

            if (!$storagePath) {
                return response()->json([
                    'success' => false,
                    'error' => 'Erreur lors du stockage',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'photo_url' => asset('storage/' . $storagePath),
                'path' => $storagePath,
                'type' => $type,
                'entity_id' => $entityId,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur upload avec type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'upload',
            ], 500);
        }
    }
}
