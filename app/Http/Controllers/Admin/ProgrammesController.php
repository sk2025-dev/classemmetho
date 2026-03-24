<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PermanentActivity;
use App\Models\SpecialEvent;

class ProgrammesController extends Controller
{
    /**
     * Affiche la page avec toutes les données.
     */
    public function index()
    {
        // Récupérer les activités permanentes
        $parishActivities = PermanentActivity::where('is_parish', true)
            ->orderBy('day')
            ->orderBy('time')
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'type' => $activity->type,
                    'tag' => $activity->tag,
                    'day' => $activity->day,
                    'time' => $activity->time,
                    'title' => $activity->title,
                    'roles' => [
                        'speaker' => $activity->speaker ?? '-',
                        'prayer' => $activity->prayer ?? '-',
                        'master' => $activity->master ?? '-',
                        'choir' => $activity->choir ?? '-',
                    ],
                ];
            });

        $classActivities = PermanentActivity::where('is_parish', false)
            ->orderBy('day')
            ->orderBy('time')
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'type' => $activity->type,
                    'tag' => $activity->tag,
                    'day' => $activity->day,
                    'time' => $activity->time,
                    'title' => $activity->title,
                    'roles' => [
                        'speaker' => $activity->speaker ?? '-',
                        'prayer' => $activity->prayer ?? '-',
                        'master' => $activity->master ?? '-',
                        'choir' => $activity->choir ?? '-',
                    ],
                ];
            });

        // Événements particuliers à venir (date >= aujourd'hui)
        $today = now()->startOfDay();
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
                    'time' => substr($event->time, 0, 5), // HH:MM
                    'category' => $event->category,
                    'desc' => $event->description,
                ];
            });

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
                    'category' => $event->category,
                    'desc' => $event->description,
                ];
            });

        // Historique (événements passés)
        $parishHistory = SpecialEvent::where('is_parish', true)
            ->where('date', '<', $today)
            ->orderByDesc('date')
            ->limit(10) // optionnel
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'date' => $event->date->format('d F Y'),
                    'title' => $event->title,
                    'description' => $event->description,
                    'link' => '#', // à adapter si besoin d'un lien détail
                ];
            });

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

        return Inertia::render('Admin/Programmes', [
            'initialParishSchedule' => $parishActivities,
            'initialClassSchedule' => $classActivities,
            'initialParishList' => $parishUpcoming,
            'initialClassList' => $classUpcoming,
            'initialParishHistory' => $parishHistory,
            'initialClassHistory' => $classHistory,
        ]);
    }

    /**
     * Stocke une nouvelle activité permanente (ordre du jour).
     */
    public function storeAgenda(Request $request)
    {
        $validated = $request->validate([
            'context' => 'required|in:parish,classes',
            'type' => 'required|string',
            'date' => 'required|date',
            'theme' => 'required|string|max:255',
            'time' => 'required',
            'speaker' => 'nullable|string|max:255',
            'president' => 'nullable|string|max:255',
            'leader' => 'nullable|string|max:255',
            'choir' => 'nullable|string|max:255',
        ]);

        // Convertir la date en jour de la semaine
        $dayOfWeek = [
            0 => 'Dimanche',
            1 => 'Lundi',
            2 => 'Mardi',
            3 => 'Mercredi',
            4 => 'Jeudi',
            5 => 'Vendredi',
            6 => 'Samedi',
        ][date('w', strtotime($validated['date']))];

        // Déterminer le tag en fonction du type (pour affichage)
        $tags = [
            'mass' => 'Culte',
            'charity' => 'Social',
            'youth' => 'Jeunes',
            'other' => 'Autre',
            'eveil' => 'Primaire',
            'catechese' => 'Élémentaire',
            'aumonerie' => 'Collège',
        ];
        $tag = $tags[$validated['type']] ?? 'Activité';

        PermanentActivity::create([
            'type' => $validated['type'],
            'tag' => $tag,
            'day' => $dayOfWeek,
            'time' => $validated['time'],
            'title' => $validated['theme'],
            'speaker' => $validated['speaker'],
            'prayer' => $validated['president'],
            'master' => $validated['leader'],
            'choir' => $validated['choir'],
            'is_parish' => $validated['context'] === 'parish',
        ]);

        return redirect()->back()->with('success', 'Activité ajoutée avec succès.');
    }

    /**
     * Stocke un nouvel événement particulier (programmer une activité).
     */
    public function storeEvent(Request $request)
    {
        $validated = $request->validate([
            'context' => 'required|in:parish,classes',
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required',
            'category' => 'required|string',
            'desc' => 'nullable|string',
        ]);

        SpecialEvent::create([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'time' => $validated['time'],
            'category' => $validated['category'],
            'description' => $validated['desc'],
            'is_parish' => $validated['context'] === 'parish',
        ]);

        return redirect()->back()->with('success', 'Événement ajouté avec succès.');
    }
}