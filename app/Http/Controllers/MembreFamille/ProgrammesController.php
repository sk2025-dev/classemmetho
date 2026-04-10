<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Models\SpecialEvent;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProgrammesController extends Controller
{
    /**
     * Afficher les événements pour la classe du membre/responsable connecté (lecture seule)
     */
    public function index()
    {
        $user = Auth::user();
        
        // Récupérer la classe du membre/responsable connecté
        $classe = $user->classe;
        
        if (!$classe) {
            return redirect()->back()->with('error', 'Aucune classe associée à votre compte.');
        }
        
        // Récupérer les événements FUTURS de sa classe
        $evenementsActuels = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->where('date', '>=', now()->startOfDay())
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->get();

        // Récupérer l'HISTORIQUE des événements de sa classe (limité à 10)
        $evenementsHistorique = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->where('date', '<', now()->startOfDay())
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->limit(10)
            ->get();
        
        // Récupérer les médias de la classe pour la galerie
        $galleryMedia = Media::where('class_id', $classe->id)
            ->with('specialEvent')
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Déterminer le rôle pour le rendu de la vue
        $role = $user->role; // 'membre_famille' ou 'responsable_famille'
        $viewPath = $role === 'responsable_famille' ? 'ResponsableFamille/Programmes' : 'MembreFamille/Programmes';
        
        // Passer les données à la vue
        return Inertia::render($viewPath, [
            'initialClassList' => $evenementsActuels,
            'initialClassHistory' => $evenementsHistorique,
            'currentClass' => $classe,
            'galleryMedia' => $galleryMedia,
        ]);
    }
    
    /**
     * Afficher tous les programmes de l'année en cours (présents et futurs) - Lecture seule
     */
    public function allProgrammes()
    {
        $user = Auth::user();
        $classe = $user->classe;
        
        if (!$classe) {
            return redirect()->back()->with('error', 'Aucune classe associée à votre compte.');
        }
        
        // Récupérer tous les événements de l'année en cours (non paroissiaux)
        $allProgrammes = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->whereYear('date', now()->year)
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->get();
        
        // Déterminer le rôle pour le rendu de la vue
        $role = $user->role;
        $viewPath = $role === 'responsable_famille' ? 'ResponsableFamille/AllProgrammes' : 'MembreFamille/AllProgrammes';
        
        return Inertia::render($viewPath, [
            'allProgrammes' => $allProgrammes,
            'currentClass' => $classe,
        ]);
    }
    
    /**
     * Afficher tout l'historique des programmes (activités passées de l'année) - Lecture seule
     */
    public function historyProgrammes()
    {
        $user = Auth::user();
        $classe = $user->classe;
        
        if (!$classe) {
            return redirect()->back()->with('error', 'Aucune classe associée à votre compte.');
        }
        
        // Récupérer tous les événements PASSÉS de l'année en cours
        $historyProgrammes = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->where('date', '<', now()->startOfDay())
            ->whereYear('date', now()->year)
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();
        
        // Récupérer TOUS les médias de la classe pour l'historique
        $galleryMedia = Media::where('class_id', $classe->id)
            ->with('specialEvent')
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Déterminer le rôle pour le rendu de la vue
        $role = $user->role;
        $viewPath = $role === 'responsable_famille' ? 'ResponsableFamille/HistoryProgrammes' : 'MembreFamille/HistoryProgrammes';
        
        return Inertia::render($viewPath, [
            'historyProgrammes' => $historyProgrammes,
            'currentClass' => $classe,
            'galleryMedia' => $galleryMedia,
        ]);
    }
    
    /**
     * Récupérer tous les événements de la classe (pour le calendrier) - Lecture seule
     */
    public function getEventsByMonth(Request $request)
    {
        try {
            $user = Auth::user();
            $classe = $user->classe;
            
            if (!$classe) {
                return response()->json(['message' => 'Aucune classe associée'], 403);
            }
            
            $year = $request->get('year', now()->year);
            $month = $request->get('month', now()->month);
            
            // Validation des paramètres
            if (!is_numeric($year) || !is_numeric($month) || $month < 1 || $month > 12) {
                return response()->json([
                    'message' => 'Paramètres invalides'
                ], 422);
            }
            
            $events = SpecialEvent::where('class_id', $classe->id)
                ->where('is_parish', false)
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->orderBy('date', 'asc')
                ->orderBy('time', 'asc')
                ->get();
            
            return response()->json([
                'success' => true,
                'events' => $events
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération événements', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Erreur lors de la récupération des événements',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Récupérer tous les médias de la classe - Lecture seule
     */
    public function getGalleryMedia()
    {
        try {
            $user = Auth::user();
            $classe = $user->classe;
            
            if (!$classe) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune classe associée'
                ], 403);
            }
            
            $media = Media::where('class_id', $classe->id)
                ->with('specialEvent')
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'media' => $media
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération médias', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des médias'
            ], 500);
        }
    }
    
    /**
     * Récupérer un événement spécifique - Lecture seule
     */
    public function showEvent($id)
    {
        try {
            $user = Auth::user();
            $classe = $user->classe;
            
            if (!$classe) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune classe associée'
                ], 403);
            }
            
            $event = SpecialEvent::where('id', $id)
                ->where('class_id', $classe->id)
                ->where('is_parish', false)
                ->first();
            
            if (!$event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Événement non trouvé'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'event' => $event
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération événement', [
                'error' => $e->getMessage(),
                'event_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'événement'
            ], 500);
        }
    }
    
    /**
     * Récupérer un média spécifique - Lecture seule
     */
    public function showMedia($id)
    {
        try {
            $user = Auth::user();
            $classe = $user->classe;
            
            if (!$classe) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune classe associée'
                ], 403);
            }
            
            $media = Media::where('id', $id)
                ->where('class_id', $classe->id)
                ->with('specialEvent')
                ->first();
            
            if (!$media) {
                return response()->json([
                    'success' => false,
                    'message' => 'Média non trouvé'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'media' => $media
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération média', [
                'error' => $e->getMessage(),
                'media_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du média'
            ], 500);
        }
    }
    
    /**
     * Récupérer les médias par activité - Lecture seule
     */
    public function getMediaByEvent($eventId)
    {
        try {
            $user = Auth::user();
            $classe = $user->classe;
            
            if (!$classe) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune classe associée'
                ], 403);
            }
            
            // Vérifier que l'événement appartient à la classe
            $event = SpecialEvent::where('id', $eventId)
                ->where('class_id', $classe->id)
                ->first();
            
            if (!$event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Événement non trouvé'
                ], 404);
            }
            
            $media = Media::where('special_event_id', $eventId)
                ->where('class_id', $classe->id)
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'media' => $media,
                'event' => $event
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération médias par événement', [
                'error' => $e->getMessage(),
                'event_id' => $eventId
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des médias'
            ], 500);
        }
    }
}