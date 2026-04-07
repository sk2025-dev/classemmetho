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
        
        // Récupérer la classe du conducteur connecté
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
        
        // Passer les données à la vue
        return Inertia::render('Conducteur/Programmes', [
            'initialClassList' => $evenementsActuels,
            'initialClassHistory' => $evenementsHistorique,
            'currentClass' => $classe,
            'galleryMedia' => $galleryMedia,
        ]);
    }
    
    /**
     * Afficher tous les programmes de l'année en cours (présents et futurs)
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
        
        return Inertia::render('Conducteur/AllProgrammes', [
            'allProgrammes' => $allProgrammes,
            'currentClass' => $classe,
        ]);
    }
    
    /**
     * Afficher tout l'historique des programmes (activités passées de l'année)
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
        
        return Inertia::render('Conducteur/HistoryProgrammes', [
            'historyProgrammes' => $historyProgrammes,
            'currentClass' => $classe,
        ]);
    }
    
    /**
     * Créer un nouvel événement pour la classe du conducteur
     */
    public function storeEvent(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Vérifier que le conducteur a une classe
            $classe = $user->classe;
            if (!$classe) {
                Log::warning('Tentative de création d\'événement sans classe associée', [
                    'user_id' => $user->id,
                    'user_email' => $user->email
                ]);
                return redirect()->back()->with('error', 'Aucune classe associée à votre compte.');
            }
            
            // Log des données reçues pour débogage
            Log::info('Données reçues pour création événement', [
                'user_id' => $user->id,
                'class_id' => $classe->id,
                'data' => $request->all()
            ]);
            
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'date' => 'required|date',
                'time' => 'required|date_format:H:i',
                'orateur' => 'nullable|string|max:255',
                'moderateur' => 'nullable|string|max:255',
                'dirigeant_priere' => 'nullable|string|max:255',
                'lieu' => 'nullable|string|max:500',
            ]);
            
            // Création de l'événement
            $event = SpecialEvent::create([
                'title' => $validated['title'],
                'date' => $validated['date'],
                'time' => $validated['time'],
                'orateur' => $validated['orateur'] ?? null,
                'moderateur' => $validated['moderateur'] ?? null,
                'dirigeant_priere' => $validated['dirigeant_priere'] ?? null,
                'lieu' => $validated['lieu'] ?? null,
                'class_id' => $classe->id,
                'created_by' => $user->id,
                'is_parish' => false,
            ]);
            
            // Log du succès
            Log::info('Événement créé avec succès', [
                'event_id' => $event->id,
                'user_id' => $user->id,
                'class_id' => $classe->id
            ]);
            
            return redirect()->back()->with('success', 'Événement créé avec succès');
            
        } catch (ValidationException $e) {
            // Log des erreurs de validation
            Log::warning('Erreur de validation lors de la création', [
                'errors' => $e->errors(),
                'data' => $request->all()
            ]);
            
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
                
        } catch (\Exception $e) {
            // Log des erreurs inattendues
            Log::error('Erreur lors de la création de l\'événement', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $request->all()
            ]);
            
            return redirect()->back()->with('error', 'Erreur lors de la création: ' . $e->getMessage());
        }
    }
    
    /**
     * Importer plusieurs événements depuis un fichier Excel
     */
    public function importEvents(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Vérifier que le conducteur a une classe
            $classe = $user->classe;
            if (!$classe) {
                Log::warning('Tentative d\'import sans classe associée', [
                    'user_id' => $user->id,
                    'user_email' => $user->email
                ]);
                return response()->json([
                    'success' => false, 
                    'message' => 'Aucune classe associée à votre compte.'
                ], 403);
            }
            
            // Valider les données reçues
            $validated = $request->validate([
                'events' => 'required|array',
                'events.*.title' => 'required|string|max:255',
                'events.*.date' => 'required|date',
                'events.*.time' => 'required|date_format:H:i',
                'events.*.orateur' => 'nullable|string|max:255',
                'events.*.moderateur' => 'nullable|string|max:255',
                'events.*.dirigeant_priere' => 'nullable|string|max:255',
                'events.*.lieu' => 'nullable|string|max:500',
            ]);
            
            $events = $validated['events'];
            $importedCount = 0;
            $errors = [];
            
            Log::info('Début de l\'import massif', [
                'user_id' => $user->id,
                'class_id' => $classe->id,
                'total_events' => count($events)
            ]);
            
            // Utiliser une transaction pour garantir l'intégrité des données
            DB::beginTransaction();
            
            try {
                foreach ($events as $index => $eventData) {
                    try {
                        // Vérifier que la date n'est pas dans le passé (optionnel)
                        if ($eventData['date'] < now()->startOfDay()->format('Y-m-d')) {
                            $errors[] = "Ligne " . ($index + 2) . ": La date ne peut pas être dans le passé";
                            continue;
                        }
                        
                        // Créer l'événement
                        $event = SpecialEvent::create([
                            'title' => $eventData['title'],
                            'date' => $eventData['date'],
                            'time' => $eventData['time'],
                            'orateur' => $eventData['orateur'] ?? null,
                            'moderateur' => $eventData['moderateur'] ?? null,
                            'dirigeant_priere' => $eventData['dirigeant_priere'] ?? null,
                            'lieu' => $eventData['lieu'] ?? null,
                            'class_id' => $classe->id,
                            'created_by' => $user->id,
                            'is_parish' => false,
                        ]);
                        
                        $importedCount++;
                        
                        Log::debug('Événement importé', [
                            'event_id' => $event->id,
                            'title' => $event->title
                        ]);
                        
                    } catch (\Exception $e) {
                        $errors[] = "Ligne " . ($index + 2) . ": " . $e->getMessage();
                        Log::error('Erreur lors de l\'import d\'un événement', [
                            'index' => $index,
                            'data' => $eventData,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
                
                // Si aucun événement n'a été importé, annuler la transaction
                if ($importedCount === 0 && count($errors) > 0) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Aucun événement n\'a pu être importé',
                        'errors' => $errors
                    ], 400);
                }
                
                DB::commit();
                
                Log::info('Import massif terminé avec succès', [
                    'user_id' => $user->id,
                    'class_id' => $classe->id,
                    'imported_count' => $importedCount,
                    'error_count' => count($errors)
                ]);
                
                $responseMessage = "{$importedCount} événement(s) importé(s) avec succès.";
                if (count($errors) > 0) {
                    $responseMessage .= " " . count($errors) . " erreur(s) rencontrée(s).";
                }
                
                return response()->json([
                    'success' => true,
                    'imported_count' => $importedCount,
                    'message' => $responseMessage,
                    'errors' => $errors
                ]);
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            
        } catch (ValidationException $e) {
            Log::warning('Erreur de validation lors de l\'import', [
                'errors' => $e->errors()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation des données',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'import des événements', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'import: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Mettre à jour un événement existant
     */
    public function updateEvent(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Vérifier que le conducteur a une classe
            $classe = $user->classe;
            if (!$classe) {
                Log::warning('Tentative de modification sans classe', ['user_id' => $user->id]);
                return redirect()->back()->with('error', 'Aucune classe associée');
            }
            
            $event = SpecialEvent::where('id', $id)
                ->where('class_id', $classe->id)
                ->first();
            
            if (!$event) {
                Log::warning('Tentative de modification d\'événement inexistant', [
                    'event_id' => $id,
                    'user_id' => $user->id
                ]);
                return redirect()->back()->with('error', 'Événement non trouvé');
            }
            
            // Vérifier que le conducteur est le créateur
            if ($event->created_by !== $user->id) {
                Log::warning('Tentative de modification non autorisée', [
                    'event_id' => $id,
                    'user_id' => $user->id,
                    'creator_id' => $event->created_by
                ]);
                return redirect()->back()->with('error', 'Vous ne pouvez modifier que vos propres événements');
            }
            
            // Log des données reçues
            Log::info('Mise à jour événement', [
                'event_id' => $id,
                'data' => $request->all()
            ]);
            
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'date' => 'required|date',
                'time' => 'required|date_format:H:i',
                'orateur' => 'nullable|string|max:255',
                'moderateur' => 'nullable|string|max:255',
                'dirigeant_priere' => 'nullable|string|max:255',
                'lieu' => 'nullable|string|max:500',
            ]);
            
            $event->update($validated);
            
            Log::info('Événement mis à jour avec succès', ['event_id' => $id]);
            
            // Si la requête est AJAX (Inertia), retourner JSON, sinon redirection
            if ($request->wantsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Événement modifié avec succès',
                    'event' => $event
                ]);
            }
            
            return redirect()->back()->with('success', 'Événement modifié avec succès');
            
        } catch (ValidationException $e) {
            Log::warning('Erreur de validation lors de la modification', [
                'errors' => $e->errors(),
                'event_id' => $id
            ]);
            
            if ($request->wantsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $e->errors()
                ], 422);
            }
            
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
                
        } catch (\Exception $e) {
            Log::error('Erreur lors de la modification', [
                'error' => $e->getMessage(),
                'event_id' => $id
            ]);
            
            if ($request->wantsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la modification: ' . $e->getMessage()
                ], 500);
            }
            
            return redirect()->back()->with('error', 'Erreur lors de la modification: ' . $e->getMessage());
        }
    }
    
    /**
     * Supprimer un événement
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            // Vérifier que le conducteur a une classe
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
            
            // Vérifier les autorisations
            if ($event->created_by !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez supprimer que vos propres événements'
                ], 403);
            }
            
            $event->delete();
            
            Log::info('Événement supprimé', [
                'event_id' => $id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Événement supprimé avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression', [
                'error' => $e->getMessage(),
                'event_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Récupérer tous les événements de la classe (pour le calendrier)
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
     * Ajouter un ou plusieurs médias (photos/vidéos) à la galerie
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
            
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'date' => 'required|date',
                'type' => 'required|in:photo,video',
                'special_event_id' => 'nullable|exists:special_events,id',
                'media' => 'required|array',
                'media.*' => 'file|mimes:jpg,jpeg,png,mp4,mov,avi|max:20480', // 20MB max par fichier
            ]);
            
            $uploadedMedia = [];
            
            foreach ($request->file('media') as $file) {
                // Générer un nom de fichier unique
                $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('media/' . $classe->id, $filename, 'public');
                
                // Créer l'entrée média dans la base de données
                $media = Media::create([
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'date' => $validated['date'],
                    'type' => $validated['type'],
                    'url' => Storage::url($path),
                    'thumbnail' => $validated['type'] === 'video' ? $this->generateThumbnail($path) : null,
                    'class_id' => $classe->id,
                    'special_event_id' => $validated['special_event_id'] ?? null,
                    'created_by' => $user->id,
                ]);
                
                $uploadedMedia[] = $media;
            }
            
            Log::info('Média(s) ajouté(s) avec succès', [
                'count' => count($uploadedMedia),
                'user_id' => $user->id,
                'class_id' => $classe->id,
                'type' => $validated['type']
            ]);
            
            return response()->json([
                'success' => true,
                'message' => count($uploadedMedia) . ' média(s) ajouté(s) avec succès',
                'media' => $uploadedMedia
            ]);
            
        } catch (ValidationException $e) {
            Log::warning('Erreur de validation lors de l\'ajout du média', [
                'errors' => $e->errors()
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
                'message' => 'Erreur lors de l\'ajout: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Générer une miniature pour une vidéo
     */
    private function generateThumbnail($videoPath)
    {
        // Cette fonction nécessite FFmpeg pour générer des miniatures
        // Pour l'instant, on retourne null
        return null;
    }
    
    /**
     * Récupérer tous les médias de la classe
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
            
            // Supprimer le fichier du stockage
            $path = str_replace('/storage', '', $media->url);
            Storage::disk('public')->delete($path);
            
            // Supprimer également la miniature si elle existe
            if ($media->thumbnail) {
                $thumbnailPath = str_replace('/storage', '', $media->thumbnail);
                Storage::disk('public')->delete($thumbnailPath);
            }
            
            // Supprimer l'entrée de la base de données
            $media->delete();
            
            Log::info('Média supprimé', [
                'media_id' => $id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Média supprimé avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression du média', [
                'error' => $e->getMessage(),
                'media_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }
}