<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Models\SpecialEvent;
use App\Models\Media;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProgrammesController extends Controller
{
    private function conducteurActivitiesBaseQuery($classe)
    {
        $query = SpecialEvent::query()
            ->where('is_parish', false)
            ->where('class_id', $classe->id);

        $conducteurIds = User::query()
            ->where('classe_id', $classe->id)
            ->where('role', 'conducteur')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (is_numeric($classe->conducteur)) {
            $conducteurIds[] = (int) $classe->conducteur;
        } elseif (!empty($classe->conducteur)) {
            $resolvedByIdentifier = User::query()
                ->where('identifier', $classe->conducteur)
                ->where('role', 'conducteur')
                ->value('id');

            if ($resolvedByIdentifier) {
                $conducteurIds[] = (int) $resolvedByIdentifier;
            }
        }

        $conducteurIds = array_values(array_unique(array_filter($conducteurIds)));

        if (!empty($conducteurIds)) {
            $query->whereIn('created_by', $conducteurIds);
        } else {
            $query->whereRaw('1 = 0');
        }

        return $query;
    }

    /**
     * Compatibilité routes historiques: module en lecture seule côté membre/responsable.
     */
    public function storeAgenda(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Cette action n\'est pas autorisée pour ce profil.'
        ], 403);
    }

    /**
     * Compatibilité routes historiques: module en lecture seule côté membre/responsable.
     */
    public function storeEvent(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Cette action n\'est pas autorisée pour ce profil.'
        ], 403);
    }

    /**
     * Compatibilité routes historiques: module en lecture seule côté membre/responsable.
     */
    public function addMedia(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Cette action n\'est pas autorisée pour ce profil.'
        ], 403);
    }

    /**
     * Compatibilité routes historiques: module en lecture seule côté membre/responsable.
     */
    public function deleteMedia($id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Cette action n\'est pas autorisée pour ce profil.'
        ], 403);
    }

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
        $baseQuery = $this->conducteurActivitiesBaseQuery($classe);

        $evenementsActuels = (clone $baseQuery)
            ->where('date', '>=', now()->startOfDay())
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->get();

        // Récupérer l'HISTORIQUE des événements de sa classe (limité à 10)
        $evenementsHistorique = (clone $baseQuery)
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
     * API des activités visibles par membre/responsable
     * (activités créées par le conducteur de la classe)
     */
    public function activitiesApi()
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

            $today = now()->startOfDay();
            $baseQuery = $this->conducteurActivitiesBaseQuery($classe);

            $current = (clone $baseQuery)
                ->where('date', '>=', $today)
                ->orderBy('date', 'asc')
                ->orderBy('time', 'asc')
                ->get();

            $history = (clone $baseQuery)
                ->where('date', '<', $today)
                ->orderBy('date', 'desc')
                ->orderBy('time', 'desc')
                ->limit(50)
                ->get();

            $all = (clone $baseQuery)
                ->whereYear('date', now()->year)
                ->orderBy('date', 'asc')
                ->orderBy('time', 'asc')
                ->get();

            $eventIds = (clone $baseQuery)->pluck('id');

            $gallery = Media::where('class_id', $classe->id)
                ->whereIn('special_event_id', $eventIds)
                ->with('specialEvent')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'current' => $current,
                'history' => $history,
                'all' => $all,
                'gallery' => $gallery,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur API activités membre/responsable', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des activités'
            ], 500);
        }
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
        $allProgrammes = $this->conducteurActivitiesBaseQuery($classe)
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
        $historyProgrammes = $this->conducteurActivitiesBaseQuery($classe)
            ->where('date', '<', now()->startOfDay())
            ->whereYear('date', now()->year)
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();

        // Récupérer TOUS les médias de la classe pour l'historique
        $eventIds = $this->conducteurActivitiesBaseQuery($classe)->pluck('id');

        $galleryMedia = Media::where('class_id', $classe->id)
            ->whereIn('special_event_id', $eventIds)
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

            $events = $this->conducteurActivitiesBaseQuery($classe)
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

            $eventIds = $this->conducteurActivitiesBaseQuery($classe)->pluck('id');

            $media = Media::where('class_id', $classe->id)
                ->whereIn('special_event_id', $eventIds)
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

            $event = $this->conducteurActivitiesBaseQuery($classe)
                ->where('id', $id)
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
            $event = $this->conducteurActivitiesBaseQuery($classe)
                ->where('id', $eventId)
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
