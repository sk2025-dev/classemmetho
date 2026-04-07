<?php

namespace App\Http\Controllers\MembreFamille;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SpecialEvent;
use App\Models\User;
use App\Models\Classe;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ProgrammesActivitesClasseController extends Controller
{
    /**
     * Affiche la page avec les programmes de la classe du responsable.
     */
    public function index()
    {
        // Log de début de méthode
        Log::info('=== ProgrammesActivitesClasseController@index (ResponsableFamille) - Début ===');
        
        try {
            // Récupérer l'utilisateur connecté
            $user = Auth::user();
            
            // Récupérer la classe du responsable de famille
            $classe = $this->getUserClasse($user);
            $classeNom = $classe ? $classe->nom : 'Votre classe';
            $classeId = $classe ? $classe->id : null;
            
            Log::info('Utilisateur connecté', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'classe_id' => $classeId,
                'classe_nom' => $classeNom
            ]);
            
            // Si l'utilisateur n'a pas de classe, on renvoie un message
            if (!$classeId) {
                Log::warning('Utilisateur sans classe associée', ['user_id' => $user->id]);
                return Inertia::render('MembreFamille/Programmes', [
                    'initialClassList' => [],
                    'initialClassHistory' => [],
                    'classeNom' => 'Aucune classe',
                    'error' => 'Vous n\'êtes pas associé à une classe. Veuillez contacter l\'administrateur.'
                ]);
            }
            
            // Événements à venir pour cette classe (date >= aujourd'hui)
            $today = now()->startOfDay();
            
            $classUpcoming = SpecialEvent::where('is_parish', false)
                ->where('is_conducteur', false)
                ->where('date', '>=', $today)
                ->where('class_name', $classeNom)
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
            
            Log::info('Événements de la classe à venir :', ['count' => $classUpcoming->count()]);
            
            // Historique pour cette classe (événements passés)
            $classHistory = SpecialEvent::where('is_parish', false)
                ->where('is_conducteur', false)
                ->where('date', '<', $today)
                ->where('class_name', $classeNom)
                ->orderByDesc('date')
                ->limit(10)
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'date' => $event->date->format('d F Y'),
                        'title' => $event->title,
                        'description' => $event->description,
                    ];
                });
            
            Log::info('Historique de la classe :', ['count' => $classHistory->count()]);
            
            // Log de fin
            Log::info('=== ProgrammesActivitesClasseController@index (MembreFamille) - Fin ===', [
                'class_upcoming_count' => $classUpcoming->count(),
                'class_history_count' => $classHistory->count(),
            ]);
            
            return Inertia::render('MembreFamille/Programmes', [
                'initialClassList' => $classUpcoming,
                'initialClassHistory' => $classHistory,
                'classeNom' => $classeNom,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur dans ProgrammesActivitesClasseController@index (MembreFamille) :', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Inertia::render('MembreFamille/Programmes', [
                'initialClassList' => [],
                'initialClassHistory' => [],
                'classeNom' => 'Votre classe',
                'error' => 'Impossible de charger les programmes'
            ]);
        }
    }
    
    /**
     * Récupère la classe du responsable de famille
     */
    private function getUserClasse($user)
    {
        // Méthode 1: Directement via le champ classe_id
        if (isset($user->classe_id) && $user->classe_id) {
            $classe = Classe::find($user->classe_id);
            if ($classe) {
                return $classe;
            }
        }
        
        // Méthode 2: Via l'inscription active
        if (method_exists($user, 'inscriptions')) {
            $inscription = $user->inscriptions()
                ->where('statut', 'active')
                ->where(function($q) {
                    $q->whereNull('date_fin')
                      ->orWhere('date_fin', '>=', now());
                })
                ->first();
                
            if ($inscription && $inscription->classe_id) {
                $classe = Classe::find($inscription->classe_id);
                if ($classe) {
                    return $classe;
                }
            }
        }
        
        // Méthode 3: Via la famille
        if (method_exists($user, 'famille') && $user->famille && $user->famille->classe_id) {
            $classe = Classe::find($user->famille->classe_id);
            if ($classe) {
                return $classe;
            }
        }
        
        return null;
    }
}