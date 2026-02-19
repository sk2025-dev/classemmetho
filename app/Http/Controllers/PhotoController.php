<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PhotoController extends Controller
{
    /**
     * Upload une photo et retourne le chemin
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        try {
            // Validation
            $validator = Validator::make($request->all(), [
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
                'type' => 'required|in:user,family,conducteur,inscription', // Type d'entité
                'entity_id' => 'nullable|integer', // ID de l'entité (optionnel)
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
            $entityId = $request->input('entity_id') ?? 'temp-' . time();

            // Créer un dossier unique par type
            $path = "photos/{$type}/" . date('Y/m/d');

            // Générer un nom de fichier unique
            $filename = uniqid() . '_' . time() . '.' . $photo->getClientOriginalExtension();

            // Stocker la photo
            $storagePath = Storage::disk('public')->putFileAs(
                $path,
                $photo,
                $filename
            );

            if (!$storagePath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors du stockage de la photo'
                ], 500);
            }

            // Retourner le chemin complet et l'URL
            $publicUrl = asset('storage/' . $storagePath);

            return response()->json([
                'success' => true,
                'message' => 'Photo uploadée avec succès',
                'data' => [
                    'path' => $storagePath,
                    'url' => $publicUrl,
                    'filename' => $filename,
                    'type' => $type,
                    'entity_id' => $entityId
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Photo upload error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprime une photo
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
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

            // Supprimer le fichier
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);

                return response()->json([
                    'success' => true,
                    'message' => 'Photo supprimée avec succès'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Photo introuvable'
            ], 404);

        } catch (\Exception $e) {
            \Log::error('Photo delete error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression'
            ], 500);
        }
    }

    /**
     * Récupère les initiales d'un nom
     * Utilise comme fallback si photo n'existe pas
     *
     * @param string $nom
     * @param string $prenom
     * @return string
     */
    public static function getInitials($nom = '', $prenom = '')
    {
        $initials = '';

        if (!empty($prenom)) {
            $initials .= strtoupper(substr($prenom, 0, 1));
        }

        if (!empty($nom)) {
            $initials .= strtoupper(substr($nom, 0, 1));
        }

        return substr($initials, 0, 2) ?: '?';
    }

    /**
     * Génère une couleur basée sur le nom
     * Pour les avatars avec initiales
     *
     * @param string $name
     * @return string
     */
    public static function getColorFromName($name = '')
    {
        $colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#95E1D3',
            '#C9ADA7', '#9A8C98', '#C9ADA7', '#F1FAEE', '#A8DADC'
        ];

        $hash = crc32($name);
        $index = abs($hash) % count($colors);

        return $colors[$index];
    }
}
