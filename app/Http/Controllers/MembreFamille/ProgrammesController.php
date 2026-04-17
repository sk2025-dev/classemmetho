<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Models\SpecialEvent;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProgrammesController extends Controller
{
    /**
     * Afficher les événements pour la classe du membre/responsable connecté (lecture seule)
     */
    public function index()
    {
        $user = Auth::user();
        
        $classe = $user->classe;
        
        if (!$classe) {
            return redirect()->back()->with('error', 'Aucune classe associée à votre compte.');
        }
        
        // Récupérer les événements FUTURS de sa classe
        $evenementsActuels = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->where('start_date', '>=', now()->startOfDay())
            ->orderBy('start_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get()
            ->map(function($event) {
                // Ajouter les champs compatibles pour le frontend
                $event->date = $event->start_date;
                $event->time = $event->start_time;
                return $event;
            });

        // Récupérer l'HISTORIQUE des événements de sa classe
        $evenementsHistorique = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->where('start_date', '<', now()->startOfDay())
            ->orderBy('start_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get()
            ->map(function($event) {
                // Ajouter les champs compatibles pour le frontend
                $event->date = $event->start_date;
                $event->time = $event->start_time;
                return $event;
            });
        
        $galleryMedia = Media::where('class_id', $classe->id)
            ->with('specialEvent')
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Déterminer le rôle pour le rendu de la vue
        $role = $user->role;
        $viewPath = $role === 'responsable_famille' ? 'ResponsableFamille/Programmes' : 'MembreFamille/Programmes';
        
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
        
        $allProgrammes = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->whereYear('start_date', now()->year)
            ->orderBy('start_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get()
            ->map(function($event) {
                $event->date = $event->start_date;
                $event->time = $event->start_time;
                return $event;
            });
        
        $role = $user->role;
        $viewPath = $role === 'responsable_famille' ? 'ResponsableFamille/AllProgrammes' : 'MembreFamille/AllProgrammes';
        
        return Inertia::render($viewPath, [
            'allProgrammes' => $allProgrammes,
            'currentClass' => $classe,
        ]);
    }
    
    /**
     * Afficher tout l'historique des programmes (activités passées) - Lecture seule
     */
    public function historyProgrammes()
    {
        $user = Auth::user();
        $classe = $user->classe;
        
        if (!$classe) {
            return redirect()->back()->with('error', 'Aucune classe associée à votre compte.');
        }
        
        $historyProgrammes = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->where('start_date', '<', now()->startOfDay())
            ->whereYear('start_date', now()->year)
            ->orderBy('start_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get()
            ->map(function($event) {
                $event->date = $event->start_date;
                $event->time = $event->start_time;
                return $event;
            });
        
        $galleryMedia = Media::where('class_id', $classe->id)
            ->with('specialEvent')
            ->orderBy('created_at', 'desc')
            ->get();
        
        $role = $user->role;
        $viewPath = $role === 'responsable_famille' ? 'ResponsableFamille/HistoryProgrammes' : 'MembreFamille/HistoryProgrammes';
        
        return Inertia::render($viewPath, [
            'historyProgrammes' => $historyProgrammes,
            'currentClass' => $classe,
            'galleryMedia' => $galleryMedia,
        ]);
    }
    
    /**
     * Récupérer l'historique des programmes avec filtres (API) - Lecture seule
     */
    public function getHistoryProgrammes(Request $request)
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
            
            $query = SpecialEvent::where('is_parish', false)
                ->where('class_id', $classe->id)
                ->where('start_date', '<', now()->startOfDay());
            
            // Filtre par recherche (titre, orateur, moderateur, lieu, famille_reception)
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('orateur', 'like', "%{$search}%")
                      ->orWhere('moderateur', 'like', "%{$search}%")
                      ->orWhere('lieu', 'like', "%{$search}%")
                      ->orWhere('famille_reception', 'like', "%{$search}%");
                });
            }
            
            // Filtre par année
            if ($request->filled('year') && $request->year !== 'all') {
                $query->whereYear('start_date', $request->year);
            }
            
            // Filtre par mois
            if ($request->filled('month') && $request->month !== 'all') {
                $query->whereMonth('start_date', $request->month);
            }
            
            // Tri (desc = plus récentes d'abord, asc = plus anciennes d'abord)
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy('start_date', $sortOrder)
                  ->orderBy('start_time', $sortOrder);
            
            // Pagination
            $perPage = $request->get('per_page', 6);
            $historyProgrammes = $query->paginate($perPage);
            
            // Ajouter les champs compatibles pour le frontend
            $historyProgrammes->getCollection()->transform(function($event) {
                $event->date = $event->start_date;
                $event->time = $event->start_time;
                return $event;
            });
            
            return response()->json([
                'success' => true,
                'data' => $historyProgrammes->items(),
                'pagination' => [
                    'current_page' => $historyProgrammes->currentPage(),
                    'last_page' => $historyProgrammes->lastPage(),
                    'per_page' => $historyProgrammes->perPage(),
                    'total' => $historyProgrammes->total(),
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération historique filtré', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Récupérer les médias de la galerie avec filtres (API) - Lecture seule
     */
    public function getGalleryMediaFiltered(Request $request)
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
            
            $query = Media::where('class_id', $classe->id)
                ->with('specialEvent');
            
            // Filtre par recherche (titre ou description)
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }
            
            // Filtre par mois
            if ($request->filled('month')) {
                $monthNum = $this->getMonthNumber($request->month);
                if ($monthNum) {
                    $query->whereMonth('date', $monthNum);
                }
            }
            
            // Filtre par année
            if ($request->filled('year')) {
                $query->whereYear('date', $request->year);
            }
            
            // Filtre par type (photo/video)
            if ($request->filled('type') && $request->type !== 'all') {
                $query->where('type', $request->type);
            }
            
            // Tri par date
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy('date', $sortOrder);
            
            // Pagination
            $perPage = $request->get('per_page', 12);
            $medias = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'data' => $medias->items(),
                'pagination' => [
                    'current_page' => $medias->currentPage(),
                    'last_page' => $medias->lastPage(),
                    'per_page' => $medias->perPage(),
                    'total' => $medias->total(),
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération galerie filtrée', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Convertir le nom du mois en numéro
     */
    private function getMonthNumber($monthName)
    {
        $months = [
            'Janvier' => 1, 'Février' => 2, 'Mars' => 3, 'Avril' => 4,
            'Mai' => 5, 'Juin' => 6, 'Juillet' => 7, 'Août' => 8,
            'Septembre' => 9, 'Octobre' => 10, 'Novembre' => 11, 'Décembre' => 12
        ];
        
        return $months[$monthName] ?? null;
    }
    
    /**
     * Récupérer les événements par mois (pour le calendrier) - Lecture seule
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
                ->whereYear('start_date', $year)
                ->whereMonth('start_date', $month)
                ->orderBy('start_date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get()
                ->map(function($event) {
                    $event->date = $event->start_date;
                    $event->time = $event->start_time;
                    return $event;
                });
            
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
            
            // Ajouter les champs compatibles pour le frontend
            $event->date = $event->start_date;
            $event->time = $event->start_time;
            
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