<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SpecialEvent;
use App\Models\Classe;
use Illuminate\Support\Facades\Log;

class ProgrammesController extends Controller
{
    /**
     * Affiche la page avec toutes les données.
     */
    public function index()
    {
        // Log de début de méthode
        Log::info('=== ProgrammesController@index - Début ===');
        
        // Récupérer les classes sans doublons
        try {
            $classes = Classe::all()
                ->unique('nom') // Supprime les doublons basés sur le champ 'nom'
                ->map(function ($classe) {
                    return [
                        'id' => $classe->id,
                        'name' => $classe->nom, // Utilise le champ 'nom' de la base pour le champ 'name' du front
                    ];
                })
                ->values(); // Réindexe le tableau après unique()
            
            // Log du nombre de classes récupérées
            Log::info('Classes récupérées (uniques) :', [
                'count' => $classes->count(),
                'data' => $classes->toArray()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des classes :', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            $classes = collect(); // Collection vide en cas d'erreur
        }

        // Événements particuliers à venir (date >= aujourd'hui)
        $today = now()->startOfDay();
        
        try {
            $parishUpcoming = SpecialEvent::where('is_parish', true)
                ->where('date', '>=', $today)
                ->orderBy('date')
                ->orderBy('time')
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'date' => $event->date->format('d/m/Y'),
                        'time' => substr($event->time, 0, 5),
                        'desc' => $event->description,
                    ];
                });
            
            Log::info('Événements paroissiaux à venir :', ['count' => $parishUpcoming->count()]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des événements paroissiaux :', [
                'message' => $e->getMessage()
            ]);
            $parishUpcoming = collect();
        }

        try {
            $classUpcoming = SpecialEvent::where('is_parish', false)
                ->where('date', '>=', $today)
                ->orderBy('date')
                ->orderBy('time')
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'date' => $event->date->format('d/m/Y'),
                        'time' => substr($event->time, 0, 5),
                        'class_name' => $event->class_name,
                        'desc' => $event->description,
                    ];
                });
            
            Log::info('Événements des classes à venir :', ['count' => $classUpcoming->count()]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des événements des classes :', [
                'message' => $e->getMessage()
            ]);
            $classUpcoming = collect();
        }

        // Historique (événements passés)
        try {
            $parishHistory = SpecialEvent::where('is_parish', true)
                ->where('date', '<', $today)
                ->orderByDesc('date')
                ->limit(10)
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'date' => $event->date->format('d F Y'),
                        'title' => $event->title,
                        'description' => $event->description,
                        'link' => '#',
                    ];
                });
            
            Log::info('Historique paroissial :', ['count' => $parishHistory->count()]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de l\'historique paroissial :', [
                'message' => $e->getMessage()
            ]);
            $parishHistory = collect();
        }

        try {
            $classHistory = SpecialEvent::where('is_parish', false)
                ->where('date', '<', $today)
                ->orderByDesc('date')
                ->limit(10)
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'date' => $event->date->format('d F Y'),
                        'title' => $event->title,
                        'description' => $event->description,
                        'link' => '#',
                    ];
                });
            
            Log::info('Historique des classes :', ['count' => $classHistory->count()]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de l\'historique des classes :', [
                'message' => $e->getMessage()
            ]);
            $classHistory = collect();
        }

        // Log de fin avec résumé
        Log::info('=== ProgrammesController@index - Fin ===', [
            'classes_count' => $classes->count(),
            'parish_upcoming_count' => $parishUpcoming->count(),
            'class_upcoming_count' => $classUpcoming->count(),
            'parish_history_count' => $parishHistory->count(),
            'class_history_count' => $classHistory->count(),
        ]);

        return Inertia::render('Admin/Programmes', [
            'initialClasses' => $classes,
            'initialParishList' => $parishUpcoming,
            'initialClassList' => $classUpcoming,
            'initialParishHistory' => $parishHistory,
            'initialClassHistory' => $classHistory,
        ]);
    }

    /**
     * Stocke un nouvel événement particulier (programmer une activité).
     */
    public function storeEvent(Request $request)
    {
        Log::info('=== storeEvent - Début ===', ['request_data' => $request->all()]);
        
        try {
            $validated = $request->validate([
                'context' => 'required|in:parish,classes',
                'title' => 'required|string|max:255',
                'date' => 'required|date',
                'time' => 'required',
                'desc' => 'nullable|string',
            ]);

            Log::info('Validation de base réussie', ['validated' => $validated]);

            // Validation conditionnelle pour les classes uniquement
            if ($validated['context'] === 'classes') {
                $validated = array_merge($validated, $request->validate([
                    'class_name' => 'required|string|max:255',
                ]));
                Log::info('Validation des classes réussie', ['class_name' => $validated['class_name']]);
            }

            // Construction dynamique du tableau
            $data = [
                'title' => $validated['title'],
                'date' => $validated['date'],
                'time' => $validated['time'],
                'description' => $validated['desc'],
                'is_parish' => $validated['context'] === 'parish',
            ];

            // Ajout de class_name uniquement pour les événements de classes
            if ($validated['context'] === 'classes') {
                $data['class_name'] = $validated['class_name'];
            }

            Log::info('Données à insérer :', $data);

            $event = SpecialEvent::create($data);
            
            Log::info('Événement créé avec succès', ['event_id' => $event->id]);

            return redirect()->back()->with('success', 'Événement ajouté avec succès.');
            
        } catch (\Exception $e) {
            Log::error('Erreur dans storeEvent :', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return redirect()->back()->withErrors(['error' => 'Une erreur est survenue : ' . $e->getMessage()]);
        }
    }
}