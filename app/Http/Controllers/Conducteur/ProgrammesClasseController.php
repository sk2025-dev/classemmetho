<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\SpecialEvent;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProgrammesClasseController extends Controller
{
    /**
     * Afficher les événements pour la classe du conducteur connecté
     */
    public function index()
    {
        $user = Auth::user();
        
        $classe = $user->classe;
        
        if (!$classe) {
            return redirect()->back()->with('error', 'Aucune classe associée à votre compte.');
        }
        
        $evenementsActuels = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->where('date', '>=', now()->startOfDay())
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->get();

        $evenementsHistorique = SpecialEvent::where('is_parish', false)
            ->where('class_id', $classe->id)
            ->where('date', '<', now()->startOfDay())
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->limit(10)
            ->get();
        
        $galleryMedia = Media::where('class_id', $classe->id)
            ->with('specialEvent')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return Inertia::render('Conducteur/Programmes', [
            'initialClassList' => $evenementsActuels,
            'initialClassHistory' => $evenementsHistorique,
            'currentClass' => $classe,
            'galleryMedia' => $galleryMedia,
        ]);
    }
    
    /**
     * Afficher tous les programmes de l'année en cours
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
            ->whereYear('date', now()->year)
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->get();
        
        return Inertia::render('Conducteur/AllProgrammes', [
            'allProgrammes' => $allProgrammes,
            'currentClass' => $classe,
        ]);
    }
    
    /**
     * Afficher tout l'historique des programmes
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
            ->where('date', '<', now()->startOfDay())
            ->whereYear('date', now()->year)
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();
        
        $galleryMedia = Media::where('class_id', $classe->id)
            ->with('specialEvent')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return Inertia::render('Conducteur/HistoryProgrammes', [
            'historyProgrammes' => $historyProgrammes,
            'currentClass' => $classe,
            'galleryMedia' => $galleryMedia,
        ]);
    }
    
    /**
     * Créer un événement (un seul)
     */
    public function storeEvent(Request $request)
    {
        try {
            $user = Auth::user();
            
            $classe = $user->classe;
            if (!$classe) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune classe associée à votre compte.'
                ], 403);
            }
            
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'date' => 'required|date',
                'time' => 'nullable|date_format:H:i',
                'orateur' => 'nullable|string|max:255',
                'moderateur' => 'nullable|string|max:255',
                'famille_reception' => 'nullable|string|max:255',
                'lieu' => 'nullable|string|max:500',
            ]);
            
            $event = SpecialEvent::create([
                'title' => $validated['title'],
                'date' => $validated['date'],
                'time' => $validated['time'] ?? null,
                'orateur' => $validated['orateur'] ?? null,
                'moderateur' => $validated['moderateur'] ?? null,
                'famille_reception' => $validated['famille_reception'] ?? null,
                'lieu' => $validated['lieu'] ?? null,
                'class_id' => $classe->id,
                'created_by' => $user->id,
                'is_parish' => false,
            ]);
            
            Log::info('Événement créé avec succès', [
                'event_id' => $event->id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Événement créé avec succès',
                'event' => $event
            ]);
            
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Créer plusieurs événements en une seule requête
     */
    public function storeMultipleEvents(Request $request)
    {
        try {
            $user = Auth::user();
            
            $classe = $user->classe;
            if (!$classe) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune classe associée à votre compte.'
                ], 403);
            }
            
            $validated = $request->validate([
                'activities' => 'required|array|min:1',
                'activities.*.title' => 'required|string|max:255',
                'activities.*.date' => 'required|date',
                'activities.*.time' => 'nullable|date_format:H:i',
                'activities.*.orateur' => 'nullable|string|max:255',
                'activities.*.moderateur' => 'nullable|string|max:255',
                'activities.*.famille_reception' => 'nullable|string|max:255',
                'activities.*.lieu' => 'nullable|string|max:500',
            ]);
            
            $activities = $validated['activities'];
            $createdCount = 0;
            $errors = [];
            
            Log::info('Début création multiple', [
                'user_id' => $user->id,
                'total' => count($activities)
            ]);
            
            DB::beginTransaction();
            
            try {
                foreach ($activities as $index => $activity) {
                    $eventDateTime = $activity['date'] . ' ' . ($activity['time'] ?? '00:00');
                    if ($eventDateTime < now()->format('Y-m-d H:i')) {
                        $errors[] = "Activité " . ($index + 1) . ": La date ne peut pas être dans le passé";
                        continue;
                    }
                    
                    $event = SpecialEvent::create([
                        'title' => $activity['title'],
                        'date' => $activity['date'],
                        'time' => $activity['time'] ?? null,
                        'orateur' => $activity['orateur'] ?? null,
                        'moderateur' => $activity['moderateur'] ?? null,
                        'famille_reception' => $activity['famille_reception'] ?? null,
                        'lieu' => $activity['lieu'] ?? null,
                        'class_id' => $classe->id,
                        'created_by' => $user->id,
                        'is_parish' => false,
                    ]);
                    
                    $createdCount++;
                }
                
                if ($createdCount === 0 && count($errors) > 0) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Aucun événement n\'a pu être créé',
                        'errors' => $errors
                    ], 400);
                }
                
                DB::commit();
                
                $message = "{$createdCount} événement(s) créé(s) avec succès.";
                if (count($errors) > 0) {
                    $message .= " " . count($errors) . " erreur(s).";
                }
                
                return response()->json([
                    'success' => true,
                    'created_count' => $createdCount,
                    'message' => $message,
                    'errors' => $errors
                ]);
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur création multiple', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Mettre à jour un événement
     */
    public function updateEvent(Request $request, $id)
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
                ->first();
            
            if (!$event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Événement non trouvé'
                ], 404);
            }
            
            if ($event->created_by !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que vos propres événements'
                ], 403);
            }
            
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'date' => 'required|date',
                'time' => 'nullable|date_format:H:i',
                'orateur' => 'nullable|string|max:255',
                'moderateur' => 'nullable|string|max:255',
                'famille_reception' => 'nullable|string|max:255',
                'lieu' => 'nullable|string|max:500',
            ]);
            
            $event->update($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Événement modifié avec succès',
                'event' => $event
            ]);
            
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur modification', [
                'error' => $e->getMessage(),
                'event_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Importer plusieurs événements
     */
    public function importEvents(Request $request)
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
            
            $validated = $request->validate([
                'events' => 'required|array',
                'events.*.title' => 'required|string|max:255',
                'events.*.date' => 'required|date',
                'events.*.time' => 'nullable|date_format:H:i',
                'events.*.orateur' => 'nullable|string|max:255',
                'events.*.moderateur' => 'nullable|string|max:255',
                'events.*.famille_reception' => 'nullable|string|max:255',
                'events.*.lieu' => 'nullable|string|max:500',
            ]);
            
            $events = $validated['events'];
            $importedCount = 0;
            $errors = [];
            
            DB::beginTransaction();
            
            try {
                foreach ($events as $index => $eventData) {
                    $eventDateTime = $eventData['date'] . ' ' . ($eventData['time'] ?? '00:00');
                    if ($eventDateTime < now()->format('Y-m-d H:i')) {
                        $errors[] = "Ligne " . ($index + 2) . ": Date dans le passé";
                        continue;
                    }
                    
                    SpecialEvent::create([
                        'title' => $eventData['title'],
                        'date' => $eventData['date'],
                        'time' => $eventData['time'] ?? null,
                        'orateur' => $eventData['orateur'] ?? null,
                        'moderateur' => $eventData['moderateur'] ?? null,
                        'famille_reception' => $eventData['famille_reception'] ?? null,
                        'lieu' => $eventData['lieu'] ?? null,
                        'class_id' => $classe->id,
                        'created_by' => $user->id,
                        'is_parish' => false,
                    ]);
                    
                    $importedCount++;
                }
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'imported_count' => $importedCount,
                    'message' => "{$importedCount} événement(s) importé(s)",
                    'errors' => $errors
                ]);
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Supprimer un événement
     */
    public function destroy($id)
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
                ->first();
            
            if (!$event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Événement non trouvé'
                ], 404);
            }
            
            if ($event->created_by !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Suppression non autorisée'
                ], 403);
            }
            
            $event->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Événement supprimé'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Ajouter un média (photos ou vidéos externes)
     */
    public function addMedia(Request $request)
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
            
            // Validation selon le type
            if ($request->type === 'video') {
                $validated = $request->validate([
                    'title' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'date' => 'required|date',
                    'type' => 'required|in:photo,video',
                    'special_event_id' => 'nullable|exists:special_events,id',
                    'video_url' => 'required|url',
                    'thumbnail' => 'nullable|string',
                ]);
            } else {
                $validated = $request->validate([
                    'title' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'date' => 'required|date',
                    'type' => 'required|in:photo,video',
                    'special_event_id' => 'nullable|exists:special_events,id',
                    'media' => 'required|array',
                    'media.*' => 'file|mimes:jpg,jpeg,png|max:10240',
                ]);
            }
            
            $uploadedMedia = [];
            
            if ($validated['type'] === 'video') {
                // Pour les vidéos externes
                $media = Media::create([
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'date' => $validated['date'],
                    'type' => 'video',
                    'url' => $request->video_url,
                    'video_url' => $request->video_url,
                    'thumbnail' => $request->thumbnail ?? null,
                    'class_id' => $classe->id,
                    'special_event_id' => $validated['special_event_id'] ?? null,
                    'created_by' => $user->id,
                ]);
                $uploadedMedia[] = $media;
                
                Log::info('Vidéo externe ajoutée', [
                    'media_id' => $media->id,
                    'url' => $request->video_url
                ]);
            } else {
                // Pour les photos (upload)
                foreach ($request->file('media') as $file) {
                    $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('media/' . $classe->id, $filename, 'public');
                    
                    $media = Media::create([
                        'title' => $validated['title'],
                        'description' => $validated['description'] ?? null,
                        'date' => $validated['date'],
                        'type' => 'photo',
                        'url' => Storage::url($path),
                        'video_url' => null,
                        'thumbnail' => null,
                        'class_id' => $classe->id,
                        'special_event_id' => $validated['special_event_id'] ?? null,
                        'created_by' => $user->id,
                    ]);
                    
                    $uploadedMedia[] = $media;
                }
                
                Log::info('Photo(s) ajoutée(s)', [
                    'count' => count($uploadedMedia),
                    'class_id' => $classe->id
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => count($uploadedMedia) . ' média(s) ajouté(s)',
                'media' => $uploadedMedia
            ]);
            
        } catch (ValidationException $e) {
            Log::error('Erreur validation média', [
                'errors' => $e->errors(),
                'type' => $request->type
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'ajout du média', [
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
     * Afficher le formulaire d'édition d'un média
     */
    public function editMedia($id)
    {
        try {
            $user = Auth::user();
            $classe = $user->classe;
            
            if (!$classe) {
                return redirect()->back()->with('error', 'Aucune classe associée.');
            }
            
            $media = Media::where('id', $id)
                ->where('class_id', $classe->id)
                ->first();
            
            if (!$media) {
                return redirect()->route('conducteur.programmes')->with('error', 'Média non trouvé.');
            }
            
            $events = SpecialEvent::where('class_id', $classe->id)
                ->orderBy('date', 'desc')
                ->get();
            
            return Inertia::render('Conducteur/EditMedia', [
                'media' => $media,
                'events' => $events,
                'currentClass' => $classe,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur édition média', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Erreur: ' . $e->getMessage());
        }
    }
    
    /**
     * Mettre à jour un média
     */
    public function updateMedia(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $classe = $user->classe;
            
            if (!$classe) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune classe associée.'
                ], 403);
            }
            
            $media = Media::where('id', $id)
                ->where('class_id', $classe->id)
                ->first();
            
            if (!$media) {
                return response()->json([
                    'success' => false,
                    'message' => 'Média non trouvé.'
                ], 404);
            }
            
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'date' => 'required|date',
                'special_event_id' => 'nullable|exists:special_events,id',
            ]);
            
            $media->update([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'date' => $validated['date'],
                'special_event_id' => $validated['special_event_id'] ?? null,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Média mis à jour avec succès.',
                'media' => $media
            ]);
            
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour média', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Supprimer un média
     */
    public function deleteMedia($id)
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
                ->first();
            
            if (!$media) {
                return response()->json([
                    'success' => false,
                    'message' => 'Média non trouvé'
                ], 404);
            }
            
            // Supprimer le fichier uniquement pour les photos uploadées
            if ($media->type === 'photo' && $media->url && !str_contains($media->url, 'http')) {
                $path = str_replace('/storage', '', $media->url);
                Storage::disk('public')->delete($path);
            }
            
            if ($media->thumbnail) {
                $thumbnailPath = str_replace('/storage', '', $media->thumbnail);
                Storage::disk('public')->delete($thumbnailPath);
            }
            
            $media->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Média supprimé'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Récupérer les événements par mois
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
            return response()->json([
                'message' => 'Erreur de récupération'
            ], 500);
        }
    }
    
    /**
     * Récupérer tous les médias
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
            return response()->json([
                'success' => false,
                'message' => 'Erreur de récupération'
            ], 500);
        }
    }
}