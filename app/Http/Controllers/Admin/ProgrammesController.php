<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SpecialEvent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProgrammesController extends Controller
{
    public function index()
    {
        $conducteurs = User::query()
            ->where('role', 'conducteur')
            ->with('classe')
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get();

        $classIds = $conducteurs
            ->pluck('classe.id')
            ->filter()
            ->unique()
            ->values();

        $eventsByClass = SpecialEvent::query()
            ->where('is_parish', false)
            ->whereIn('class_id', $classIds)
            ->orderBy('start_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get()
            ->groupBy('class_id');

        $conducteurs->each(function ($conducteur) use ($eventsByClass) {
            if ($conducteur->classe) {
                $conducteur->classe->setAttribute(
                    'programmes',
                    $eventsByClass->get($conducteur->classe->id, collect())->values(),
                );
            }
        });

        return Inertia::render('Admin/Programmes', [
            'conducteurs' => $conducteurs,
            'userRole' => Auth::user()?->role,
        ]);
    }

    public function storeEvent(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'orateur' => 'nullable|string|max:255',
            'moderateur' => 'nullable|string|max:255',
            'famille_reception' => 'nullable|string|max:255',
            'lieu' => 'nullable|string|max:500',
        ]);

        $event = SpecialEvent::create([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'time' => $validated['time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'orateur' => $validated['orateur'] ?? null,
            'moderateur' => $validated['moderateur'] ?? null,
            'famille_reception' => $validated['famille_reception'] ?? null,
            'lieu' => $validated['lieu'] ?? null,
            'class_id' => (int) $validated['class_id'],
            'created_by' => Auth::id(),
            'is_parish' => false,
        ]);

        return response()->json([
            'success' => true,
            'event' => $event,
        ]);
    }

    public function storeAgenda(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'activities' => 'required|array|min:1',
            'activities.*.title' => 'required|string|max:255',
            'activities.*.date' => 'required|date',
            'activities.*.time' => 'nullable|date_format:H:i',
            'activities.*.end_time' => 'nullable|date_format:H:i',
            'activities.*.orateur' => 'nullable|string|max:255',
            'activities.*.moderateur' => 'nullable|string|max:255',
            'activities.*.famille_reception' => 'nullable|string|max:255',
            'activities.*.lieu' => 'nullable|string|max:500',
        ]);

        $created = [];
        foreach ($validated['activities'] as $activity) {
            $created[] = SpecialEvent::create([
                'title' => $activity['title'],
                'date' => $activity['date'],
                'time' => $activity['time'] ?? null,
                'end_time' => $activity['end_time'] ?? null,
                'orateur' => $activity['orateur'] ?? null,
                'moderateur' => $activity['moderateur'] ?? null,
                'famille_reception' => $activity['famille_reception'] ?? null,
                'lieu' => $activity['lieu'] ?? null,
                'class_id' => (int) $validated['class_id'],
                'created_by' => Auth::id(),
                'is_parish' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'created' => count($created),
        ]);
    }
}
