<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\PermanentActivity;
use App\Models\Presence;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PresencesController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $family = Family::query()
            ->where('responsable_id', $user->id)
            ->with(['classe:id,nom,conducteur', 'classe.conducteur:id,prenom,nom', 'users:id,family_id,prenom,nom,role'])
            ->first();

        abort_if(! $family, 403, 'Aucune famille associée à ce responsable.');

        $members = $family->users
            ->sortBy('prenom')
            ->values();

        $memberIds = $members->pluck('id');

        $activites = PermanentActivity::query()
            ->where('is_parish', false)
            ->get(['id', 'title', 'type', 'day', 'time'])
            ->map(function (PermanentActivity $activity) {
                $dateTime = $this->dateHeureDebut($activity->day, $activity->time);

                return [
                    'id' => $activity->id,
                    'titre' => $activity->title,
                    'type' => $activity->type,
                    'is_culte' => str_contains(mb_strtolower((string) $activity->type), 'culte'),
                    'date_heure_debut' => $dateTime,
                    'heure' => Carbon::parse($dateTime)->format('H\\hi'),
                ];
            })
            ->sortByDesc('date_heure_debut')
            ->values();

        $presenceRows = Presence::query()
            ->whereIn('membre_famille_id', $memberIds)
            ->whereIn('activite_id', $activites->pluck('id'))
            ->get(['activite_id', 'membre_famille_id', 'statut']);

        $presences = [];
        foreach ($presenceRows as $row) {
            $presences[$row->activite_id][$row->membre_famille_id] = $row->statut;
        }

        $famille = [
            'id' => $family->id,
            'nom' => $family->nom,
            'classe' => $family->classe?->nom,
            'conducteur' => trim((string) (($family->classe?->conducteur?->prenom ?? '') . ' ' . ($family->classe?->conducteur?->nom ?? ''))),
            'membres' => $members->map(function (User $member) {
                return [
                    'id' => $member->id,
                    'prenom' => $member->prenom,
                    'nom' => $member->nom,
                    'role' => $member->role,
                    'initiales' => strtoupper(substr((string) $member->prenom, 0, 1) . substr((string) $member->nom, 0, 1)),
                ];
            })->values(),
        ];

        return Inertia::render('ResponsableFamille/Presences/Index', [
            'famille' => $famille,
            'activites' => $activites,
            'presences' => $presences,
        ]);
    }

    public function enregistrer(Request $request, PermanentActivity $activite): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Pointage reserve au conducteur de classe.',
        ], 403);
    }

    private function dateHeureDebut(string $day, string $time): string
    {
        $days = [
            'lundi' => 1,
            'mardi' => 2,
            'mercredi' => 3,
            'jeudi' => 4,
            'vendredi' => 5,
            'samedi' => 6,
            'dimanche' => 7,
        ];

        $normalizedDay = strtr(mb_strtolower(trim($day)), [
            'é' => 'e',
            'è' => 'e',
            'ê' => 'e',
            'à' => 'a',
            'ù' => 'u',
            'ç' => 'c',
        ]);

        $dayOfWeek = $days[$normalizedDay] ?? now()->dayOfWeekIso;
        $normalizedTime = str_replace('h', ':', trim($time));
        $today = Carbon::now();
        $date = $today->copy()->startOfWeek(Carbon::MONDAY)->addDays(max($dayOfWeek - 1, 0));

        if (preg_match('/^\d{1,2}:\d{2}$/', $normalizedTime)) {
            [$hour, $minute] = array_map('intval', explode(':', $normalizedTime));
            $date->setTime($hour, $minute, 0);
        }

        if ($date->lt($today->copy()->subDay())) {
            $date->addWeek();
        }

        return $date->toDateTimeString();
    }
}
