<?php

namespace App\Http\Controllers\Pasteur;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SpecialEvent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProgrammesPasteurController extends Controller
{
    /**
     * Afficher tous les conducteurs avec leur classe et leurs programmes
     * Accessible pour le pasteur et l'admin
     */
    public function index()
    {
        try {
            // Vérifier si l'utilisateur est admin ou pasteur
            $user = Auth::user();
            if (!$user || !in_array($user->role, ['admin', 'pasteur'])) {
                abort(403, 'Accès non autorisé');
            }
            
            // Récupérer tous les conducteurs avec leur classe (toutes les colonnes)
            $conducteurs = User::where('role', 'conducteur')
                ->with('classe')
                ->get()
                ->filter(function($conducteur) {
                    return $conducteur->classe !== null;
                });
            
            // Pour chaque conducteur, récupérer les programmes de sa classe
            foreach ($conducteurs as $conducteur) {
                $conducteur->classe->programmes = SpecialEvent::where('class_id', $conducteur->classe->id)
                    ->where('is_parish', false)
                    ->orderBy('date', 'desc')
                    ->orderBy('time', 'desc')
                    ->get();
            }
            
            // Debug
            Log::info('Conducteurs avec classe:', [
                'count' => $conducteurs->count(), 
                'role' => $user->role,
                'first_conducteur_telephone' => $conducteurs->first()?->telephone,
                'first_conducteur_photo' => $conducteurs->first()?->profile_photo_url
            ]);
            
            // Utiliser le même fichier pour les deux rôles
            return Inertia::render('Pasteur/Programmes', [
                'conducteurs' => $conducteurs,
                'userRole' => $user->role,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération conducteurs', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);
            
            return Inertia::render('Pasteur/Programmes', [
                'conducteurs' => [],
                'error' => 'Impossible de charger les données: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Récupérer les programmes d'une classe spécifique (API)
     * Accessible pour le pasteur et l'admin
     */
    public function getClassProgrammes($classeId)
    {
        try {
            $user = Auth::user();
            if (!$user || !in_array($user->role, ['admin', 'pasteur'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }
            
            $classe = \App\Models\Classe::with(['conducteurs' => function($query) {
                    $query->where('role', 'conducteur');
                }])->findOrFail($classeId);
            
            $programmes = SpecialEvent::where('class_id', $classeId)
                ->where('is_parish', false)
                ->orderBy('date', 'desc')
                ->orderBy('time', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'classe' => $classe,
                'programmes' => $programmes
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération programmes classe', [
                'error' => $e->getMessage(),
                'classe_id' => $classeId,
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des programmes: ' . $e->getMessage()
            ], 500);
        }
    }
}