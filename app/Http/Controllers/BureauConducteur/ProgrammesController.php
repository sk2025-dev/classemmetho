<?php

namespace App\Http\Controllers\BureauConducteur;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\SpecialEvent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProgrammesController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();
            if (! $user || ! in_array($user->role, ['admin', 'pasteur', 'bureau_conducteur'], true)) {
                abort(403, 'Accès non autorisé');
            }

            $classes = Classe::query()
                ->where(function ($q) {
                    $q->where('status', 'active')->orWhereNull('status');
                })
                ->with([
                    'conducteur',
                    'conducteurs' => function ($query) {
                        $query->orderBy('nom')->orderBy('prenom');
                    },
                    'programmes' => function ($query) {
                        $query->where('is_parish', false)
                            ->orderByDesc('start_date')
                            ->orderByDesc('start_time');
                    },
                ])
                ->orderBy('nom')
                ->get();

            return Inertia::render('BureauConducteur/Programmes', [
                'classes' => $classes,
                'userRole' => $user->role,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur récupération programmes par classe (bureau_conducteur)', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return Inertia::render('BureauConducteur/Programmes', [
                'classes' => [],
                'error' => 'Impossible de charger les données: ' . $e->getMessage(),
            ]);
        }
    }

    public function getClassProgrammes($classeId)
    {
        try {
            $user = Auth::user();
            if (! $user || ! in_array($user->role, ['admin', 'pasteur', 'bureau_conducteur'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé',
                ], 403);
            }

            $classe = Classe::with(['conducteur', 'conducteurs'])->findOrFail($classeId);

            $programmes = SpecialEvent::where('class_id', $classeId)
                ->where('is_parish', false)
                ->orderBy('start_date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get()
                ->map(function ($programme) {
                    $programme->date = $programme->start_date;
                    $programme->time = $programme->start_time;
                    return $programme;
                });

            return response()->json([
                'success' => true,
                'classe' => $classe,
                'programmes' => $programmes,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur récupération programmes classe (bureau_conducteur)', [
                'error' => $e->getMessage(),
                'classe_id' => $classeId,
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des programmes: ' . $e->getMessage(),
            ], 500);
        }
    }
}
