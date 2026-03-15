<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PhotoUploadController extends Controller
{
    /**
     * Upload une photo pour l'inscription (sans authentification requise)
     * Utilisé pendant le formulaire d'inscription
     */
    public function uploadInscriptionPhoto(Request $request)
    {
        try {
            $request->validate([
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            ]);

            $file = $request->file('photo');

            // Générer un nom unique SANS auth()->id() car l'utilisateur n'existe pas encore
            $filename = 'profile_' . Str::random(16) . '.' . $file->getClientOriginalExtension();

            // Stocker l'image dans storage/app/public/profiles
            $path = $file->storeAs('profiles', $filename, 'public');

            // Retourner l'URL relative (pas d'URL absolue pour éviter les problèmes de domaine)
            $photoUrl = '/storage/' . ltrim($path, '/');

            return response()->json([
                'success' => true,
                'photo_url' => $photoUrl,
                'relative_url' => $photoUrl,
                'path' => $path,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur upload photo inscription: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'upload de la photo',
            ], 500);
        }
    }

    /**
     * Upload une photo de profil (authentifié)
     */
    public function uploadProfilePhoto(Request $request)
    {
        try {
            $request->validate([
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            ]);

            $file = $request->file('photo');

            // Générer un nom unique
            $filename = 'profile_' . Auth::id() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();

            // Stocker l'image dans storage/app/public/profiles
            $path = $file->storeAs('profiles', $filename, 'public');

            // Retourner l'URL relative (pas d'URL absolue pour éviter les problèmes de domaine)
            $photoUrl = '/storage/' . ltrim($path, '/');

            return response()->json([
                'success' => true,
                'photo_url' => $photoUrl,
                'relative_url' => $photoUrl,
                'path' => $path,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur upload photo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'upload de la photo',
            ], 500);
        }
    }

    /**
     * Supprime la photo de profil
     */
    public function deleteProfilePhoto(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user && $user->profile_photo_url) {
                // Extraire le chemin du fichier depuis l'URL (gère URLs relatives et absolues)
                $rawUrl = $user->profile_photo_url;
                if (str_starts_with($rawUrl, '/storage/')) {
                    $path = ltrim(substr($rawUrl, strlen('/storage/')), '/');
                } elseif (str_contains($rawUrl, '/storage/')) {
                    $path = ltrim(substr($rawUrl, strpos($rawUrl, '/storage/') + strlen('/storage/')), '/');
                } else {
                    $path = ltrim(str_replace(asset('storage/'), '', $rawUrl), '/');
                }

                // Supprimer le fichier
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }

                // Supprimer l'URL de la base de données
                $user->update(['profile_photo_url' => null]);

                return response()->json([
                    'success' => true,
                    'message' => 'Photo supprimée avec succès',
                ], 200);
            }

            return response()->json([
                'success' => false,
                'error' => 'Aucune photo à supprimer',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur suppression photo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la suppression',
            ], 500);
        }
    }
}
