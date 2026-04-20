<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\SpecialEvent;
use App\Models\Media;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use App\Models\Classe;
use App\Models\User;


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
        
        // MODIFIÉ: utilisation de start_date et start_time
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

        // MODIFIÉ: utilisation de start_date et start_time - SUPPRESSION DU limit(10)
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
        
        // MODIFIÉ: utilisation de start_date
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
        
        // MODIFIÉ: utilisation de start_date
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
        
        return Inertia::render('Conducteur/HistoryProgrammes', [
            'historyProgrammes' => $historyProgrammes,
            'currentClass' => $classe,
            'galleryMedia' => $galleryMedia,
        ]);
    }
    
    /**
     * Récupérer l'historique des programmes avec filtres (API)
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
     * Récupérer les médias de la galerie avec filtres (API)
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

        $window = $this->resolveQrWindow($event);
        if (!$window['is_open']) {
            return response()->json([
                'success' => false,
                'message' => $window['message'],
            ], 422);
        }

        $token = $event->ensureQrToken();
        $scanUrl = url('/presence/' . $token);

        $writer = new PngWriter();
        $result = $writer->write(
            new QrCode(
                data: $scanUrl,
                size: 360,
                margin: 12
            )
        );

        return response()->json([
            'success' => true,
            'token' => $token,
            'scan_url' => $scanUrl,
            'qr_code' => $result->getDataUri(),
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->date,
                'time' => $event->time,
            ],
        ]);
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
     * Afficher une page de previsualisation QR imprimable.
     */
    public function qrPreview(int $id)
    {
        $user = Auth::user();
        $classe = $user->classe;

        if (!$classe) {
            return redirect()->back()->with('error', 'Aucune classe associee a votre compte.');
        }

        $event = SpecialEvent::where('id', $id)
            ->where('class_id', $classe->id)
            ->where('is_parish', false)
            ->first();

        if (!$event) {
            return redirect()->back()->with('error', 'Programme introuvable.');
        }

        $window = $this->resolveQrWindow($event);
        if (!$window['is_open']) {
            return redirect()->back()->with('error', $window['message']);
        }

        $token = $event->ensureQrToken();
        $scanUrl = url('/presence/' . $token);

        $writer = new PngWriter();
        $result = $writer->write(
            new QrCode(
                data: $scanUrl,
                size: 460,
                margin: 14
            )
        );

        return Inertia::render('Conducteur/QrPreview', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->date,
                'time' => $event->time,
            ],
            'scanUrl' => $scanUrl,
            'qrCode' => $result->getDataUri(),
        ]);
    }

    private function resolveQrWindow(SpecialEvent $event): array
    {
        $startAt = Carbon::parse($event->date);
        if (!empty($event->time)) {
            $startTime = Carbon::parse($event->time);
            $startAt->setTime($startTime->hour, $startTime->minute, $startTime->second);
        } else {
            $startAt->setTime(0, 0, 0);
        }

        $endAt = Carbon::parse($event->date);
        if (!empty($event->end_time)) {
            $endTime = Carbon::parse($event->end_time);
            $endAt->setTime($endTime->hour, $endTime->minute, $endTime->second);
        } elseif (!empty($event->time)) {
            $startTime = Carbon::parse($event->time);
            $endAt->setTime($startTime->hour, $startTime->minute, $startTime->second);
        } else {
            $endAt->setTime(23, 59, 59);
        }

        $openingAt = $startAt->copy()->subDays(2);

        if (now()->lt($openingAt)) {
            return [
                'is_open' => false,
                'message' => 'Le QR code sera activé deux jours avant la date de l\'activité.',
            ];
        }

        if (now()->greaterThanOrEqualTo($endAt)) {
            return [
                'is_open' => false,
                'message' => 'Cette activité est passée. Le scan n\'est plus disponible.',
            ];
        }

        return [
            'is_open' => true,
            'message' => null,
        ];
    }

    /**
     * Créer un événement (un seul)
     * Créer un événement (un seul) - AVEC RESTRICTION D'ANNÉE
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
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i',
                'orateur' => 'nullable|string|max:255',
                'moderateur' => 'nullable|string|max:255',
                'famille_reception' => 'nullable|string|max:255',
                'lieu' => 'nullable|string|max:500',
            ]);
            
            $currentYear = now()->year;
            $activityYear = date('Y', strtotime($validated['start_date']));
            
            // Vérification de l'année
            if ($activityYear < $currentYear) {
                return response()->json([
                    'success' => false,
                    'message' => "Vérifiez l'année de l'activité que vous essayez de créer. L'année {$activityYear} est antérieure à l'année en cours ({$currentYear})."
                ], 422);
            }
            
            $event = SpecialEvent::create([
                'title' => $validated['title'],
                'date' => $validated['date'],
                'time' => $validated['time'] ?? null,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'start_time' => $validated['start_time'] ?? null,
                'end_time' => $validated['end_time'] ?? null,
                'orateur' => $validated['orateur'] ?? null,
                'moderateur' => $validated['moderateur'] ?? null,
                'famille_reception' => $validated['famille_reception'] ?? null,
                'lieu' => $validated['lieu'] ?? null,
                'class_id' => $classe->id,
                'created_by' => $user->id,
                'is_parish' => false,
            ]);
            
            // Ajouter les champs compatibles pour le frontend
            $eventArray = $event->toArray();
            $eventArray['date'] = $event->start_date;
            $eventArray['time'] = $event->start_time;
            
            Log::info('Événement créé avec succès', [
                'event_id' => $event->id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Événement créé avec succès',
                'event' => $eventArray
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
     * Créer plusieurs événements en une seule requête - AVEC RESTRICTION D'ANNÉE
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
                'activities.*.start_date' => 'required|date',
                'activities.*.end_date' => 'nullable|date|after_or_equal:activities.*.start_date',
                'activities.*.start_time' => 'nullable|date_format:H:i',
                'activities.*.end_time' => 'nullable|date_format:H:i',
                'activities.*.orateur' => 'nullable|string|max:255',
                'activities.*.moderateur' => 'nullable|string|max:255',
                'activities.*.famille_reception' => 'nullable|string|max:255',
                'activities.*.lieu' => 'nullable|string|max:500',
            ]);
            
            $activities = $validated['activities'];
            $currentYear = now()->year;
            
            // Vérification des années des activités
            $invalidYearActivities = [];
            $validActivities = [];
            
            foreach ($activities as $index => $activity) {
                $activityYear = date('Y', strtotime($activity['start_date']));
                
                if ($activityYear < $currentYear) {
                    $invalidYearActivities[] = [
                        'index' => $index + 1,
                        'title' => $activity['title'],
                        'year' => $activityYear
                    ];
                } else {
                    $validActivities[] = $activity;
                }
            }
            
            // Si des activités ont une année invalide, retourner une erreur
            if (count($invalidYearActivities) > 0) {
                $errorMessage = "Vérifiez l'année de l'activité que vous essayez de créer. ";
                $errorMessage .= "Les activités suivantes ont une année antérieure à {$currentYear} : ";
                
                $activityNames = array_map(function($item) {
                    return "{$item['title']} ({$item['year']})";
                }, $invalidYearActivities);
                
                $errorMessage .= implode(', ', $activityNames);
                
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'invalid_activities' => $invalidYearActivities,
                    'current_year' => $currentYear
                ], 422);
            }
            
            // Si aucune activité valide, retourner une erreur
            if (count($validActivities) === 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Aucune activité valide. Toutes les activités ont une année antérieure à {$currentYear}."
                ], 422);
            }
            
            $createdEvents = [];
            $createdCount = 0;
            $errors = [];
            $pastDates = [];
            
            Log::info('Début création multiple', [
                'user_id' => $user->id,
                'total' => count($validActivities)
            ]);
            
            DB::beginTransaction();
            
            try {
                foreach ($validActivities as $index => $activity) {
                    // Vérifier si la date est dans le passé (mais même année ou future)
                    $eventDateTime = $activity['start_date'] . ' ' . ($activity['start_time'] ?? '00:00');
                    $isPast = $eventDateTime < now()->format('Y-m-d H:i');
                    
                    // Créer l'événement
                    $event = SpecialEvent::create([
                        'title' => $activity['title'],
                        'date' => $activity['date'],
                        'time' => $activity['time'] ?? null,
                        'start_date' => $activity['start_date'],
                        'end_date' => $activity['end_date'] ?? null,
                        'start_time' => $activity['start_time'] ?? null,
                        'end_time' => $activity['end_time'] ?? null,
                        'orateur' => $activity['orateur'] ?? null,
                        'moderateur' => $activity['moderateur'] ?? null,
                        'famille_reception' => $activity['famille_reception'] ?? null,
                        'lieu' => $activity['lieu'] ?? null,
                        'class_id' => $classe->id,
                        'created_by' => $user->id,
                        'is_parish' => false,
                    ]);
                    
                    // Ajouter les champs compatibles pour le frontend
                    $eventArray = $event->toArray();
                    $eventArray['date'] = $event->start_date;
                    $eventArray['time'] = $event->start_time;
                    $createdEvents[] = $eventArray;
                    $createdCount++;
                    
                    if ($isPast) {
                        $pastDates[] = "Activité " . ($index + 1) . " (" . $activity['title'] . "): Date dans le passé (" . $activity['start_date'] . ")";
                    }
                }
                
                DB::commit();
                
                $message = "{$createdCount} événement(s) créé(s) avec succès.";
                if (count($pastDates) > 0) {
                    $message .= " Attention: " . count($pastDates) . " événement(s) ont des dates passées mais dans l'année en cours.";
                }
                
                return response()->json([
                    'success' => true,
                    'created_count' => $createdCount,
                    'message' => $message,
                    'events' => $createdEvents,
                    'past_dates' => $pastDates,
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
     * Mettre à jour un événement - VERSION ULTRA COMPATIBLE
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
                'end_time' => 'nullable|date_format:H:i',
                'orateur' => 'nullable|string|max:255',
                'moderateur' => 'nullable|string|max:255',
                'famille_reception' => 'nullable|string|max:255',
                'lieu' => 'nullable|string|max:500',
            
            // Récupérer TOUTES les données
            $data = $request->all();
            
            // Log détaillé
            Log::info('UPDATE EVENT - RAW DATA:', $data);
            
            // Construction des données de mise à jour en acceptant TOUS les formats
            $updateData = [];
            
            // Titre
            if (isset($data['title'])) {
                $updateData['title'] = $data['title'];
            }
            
            // Date de début - accepte 'start_date' ou 'date'
            if (isset($data['start_date'])) {
                $updateData['start_date'] = $data['start_date'];
            } elseif (isset($data['date'])) {
                $updateData['start_date'] = $data['date'];
            }
            
            // Date de fin
            if (isset($data['end_date'])) {
                $updateData['end_date'] = $data['end_date'];
            }
            
            // Heure de début - accepte 'start_time' ou 'time'
            if (isset($data['start_time'])) {
                $updateData['start_time'] = $data['start_time'];
            } elseif (isset($data['time'])) {
                $updateData['start_time'] = $data['time'];
            }
            
            // Heure de fin
            if (isset($data['end_time'])) {
                $updateData['end_time'] = $data['end_time'];
            }
            
            // Autres champs
            $otherFields = ['orateur', 'moderateur', 'famille_reception', 'lieu'];
            foreach ($otherFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            // Validation basique
            if (empty($updateData['title'])) {
                Log::warning('UPDATE EVENT - Titre manquant');
                return response()->json([
                    'success' => false,
                    'message' => 'Le titre est requis'
                ], 422);
            }
            
            if (empty($updateData['start_date'])) {
                Log::warning('UPDATE EVENT - Date de début manquante');
                return response()->json([
                    'success' => false,
                    'message' => 'La date de début est requise'
                ], 422);
            }
            
            // Vérification date de fin
            if (!empty($updateData['end_date']) && $updateData['end_date'] < $updateData['start_date']) {
                Log::warning('UPDATE EVENT - Date de fin antérieure', [
                    'start_date' => $updateData['start_date'],
                    'end_date' => $updateData['end_date']
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'La date de fin ne peut pas être antérieure à la date de début'
                ], 422);
            }
            
            Log::info('UPDATE EVENT - UPDATE DATA:', $updateData);
            
            // Mise à jour
            $event->update($updateData);
            $event->refresh();
            
            // Format de retour
            $eventArray = $event->toArray();
            $eventArray['date'] = $event->start_date;
            $eventArray['time'] = $event->start_time;
            
            Log::info('Événement modifié avec succès', [
                'event_id' => $event->id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Événement modifié avec succès',
                'event' => $eventArray
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur modification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'event_id' => $id,
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Importer plusieurs événements - AVEC RESTRICTION D'ANNÉE
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
                'events.*.start_date' => 'required|date',
                'events.*.end_date' => 'nullable|date',
                'events.*.start_time' => 'nullable|date_format:H:i',
                'events.*.end_time' => 'nullable|date_format:H:i',
                'events.*.orateur' => 'nullable|string|max:255',
                'events.*.moderateur' => 'nullable|string|max:255',
                'events.*.famille_reception' => 'nullable|string|max:255',
                'events.*.lieu' => 'nullable|string|max:500',
            ]);
            
            $events = $validated['events'];
            $currentYear = now()->year;
            
            // Vérification des années des événements
            $invalidYearEvents = [];
            $validEvents = [];
            
            foreach ($events as $index => $eventData) {
                $eventYear = date('Y', strtotime($eventData['start_date']));
                
                if ($eventYear < $currentYear) {
                    $invalidYearEvents[] = [
                        'line' => $index + 2,
                        'title' => $eventData['title'],
                        'year' => $eventYear
                    ];
                } else {
                    $validEvents[] = $eventData;
                }
            }
            
            // Si des événements ont une année invalide, retourner une erreur
            if (count($invalidYearEvents) > 0) {
                $errorMessage = "Vérifiez l'année des activités que vous essayez d'importer. ";
                $errorMessage .= "Les activités suivantes ont une année antérieure à {$currentYear} : ";
                
                $eventNames = array_map(function($item) {
                    return "Ligne {$item['line']}: {$item['title']} ({$item['year']})";
                }, $invalidYearEvents);
                
                $errorMessage .= implode(', ', $eventNames);
                
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'invalid_events' => $invalidYearEvents,
                    'current_year' => $currentYear
                ], 422);
            }
            
            // Si aucun événement valide, retourner une erreur
            if (count($validEvents) === 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Aucune activité valide. Toutes les activités ont une année antérieure à {$currentYear}."
                ], 422);
            }
            
            $importedEvents = [];
            $importedCount = 0;
            $errors = [];
            $pastDates = [];
            
            DB::beginTransaction();
            
            try {
                foreach ($validEvents as $index => $eventData) {
                    // Vérifier si la date est dans le passé (mais même année ou future)
                    $eventDateTime = $eventData['start_date'] . ' ' . ($eventData['start_time'] ?? '00:00');
                    $isPast = $eventDateTime < now()->format('Y-m-d H:i');
                    
                    // Créer l'événement
                    $event = SpecialEvent::create([
                        'title' => $eventData['title'],
                        'date' => $eventData['date'],
                        'time' => $eventData['time'] ?? null,
                        'start_date' => $eventData['start_date'],
                        'end_date' => $eventData['end_date'] ?? null,
                        'start_time' => $eventData['start_time'] ?? null,
                        'end_time' => $eventData['end_time'] ?? null,
                        'orateur' => $eventData['orateur'] ?? null,
                        'moderateur' => $eventData['moderateur'] ?? null,
                        'famille_reception' => $eventData['famille_reception'] ?? null,
                        'lieu' => $eventData['lieu'] ?? null,
                        'class_id' => $classe->id,
                        'created_by' => $user->id,
                        'is_parish' => false,
                    ]);
                    
                    // Ajouter les champs compatibles pour le frontend
                    $eventArray = $event->toArray();
                    $eventArray['date'] = $event->start_date;
                    $eventArray['time'] = $event->start_time;
                    $importedEvents[] = $eventArray;
                    $importedCount++;
                    
                    if ($isPast) {
                        $pastDates[] = "Ligne " . ($index + 2) . ": Date dans le passé (" . $eventData['start_date'] . ")";
                    }
                }
                
                DB::commit();
                
                $message = "{$importedCount} événement(s) importé(s) avec succès.";
                if (count($pastDates) > 0) {
                    $message .= " Attention: " . count($pastDates) . " événement(s) ont des dates passées mais dans l'année en cours.";
                }
                
                return response()->json([
                    'success' => true,
                    'imported_count' => $importedCount,
                    'message' => $message,
                    'events' => $importedEvents,
                    'past_dates' => $pastDates,
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
            Log::error('Erreur import', [
                'error' => $e->getMessage()
            ]);
            
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
                    'is_featured' => false,
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
                        'is_featured' => false,
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
     * Définir un média comme image à la une
     */
    public function setFeaturedMedia(Request $request, $id)
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
            
            // Vérifier que c'est une photo
            if ($media->type !== 'photo') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seules les photos peuvent être définies comme image à la une.'
                ], 400);
            }
            
            // Vérifier que le média est associé à une activité
            if (!$media->special_event_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce média n\'est associé à aucune activité.'
                ], 400);
            }
            
            // Enlever le statut featured des autres médias de la même activité
            Media::where('special_event_id', $media->special_event_id)
                ->where('type', 'photo')
                ->where('id', '!=', $media->id)
                ->update(['is_featured' => false]);
            
            // Définir le média actuel comme featured
            $media->update(['is_featured' => true]);
            
            Log::info('Image à la une définie', [
                'media_id' => $media->id,
                'activity_id' => $media->special_event_id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Image à la une définie avec succès.',
                'media' => $media
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur définition image à la une', [
                'error' => $e->getMessage(),
                'media_id' => $id
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
            
            // MODIFIÉ: utilisation de start_date
            $events = SpecialEvent::where('class_id', $classe->id)
                ->orderBy('start_date', 'desc')
                ->get()
                ->map(function($event) {
                    $event->date = $event->start_date;
                    $event->time = $event->start_time;
                    return $event;
                });
            
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
            return response()->json([
                'message' => 'Erreur de récupération'
            ], 500);
        }
    }
    
    /**
     * Récupérer tous les médias (version simple sans filtres)
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