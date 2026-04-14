<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Models\Presence;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PresencesController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $user->loadMissing('classe.conducteur');

        $historique = Presence::query()
            ->where('membre_famille_id', $user->id)
            ->with([
                'activite:id,title,type,day,time',
                'specialEvent:id,title,date,time',
            ])
            ->orderByDesc('marquee_le')
            ->orderByDesc('updated_at')
            ->limit(120)
            ->get()
            ->map(function (Presence $presence) {
                $dateSource = $presence->marquee_le
                    ?? $presence->updated_at
                    ?? $presence->created_at
                    ?? now();

                if ($presence->activite) {
                    $dateSource = $this->dateHeureDebut($presence->activite->day, $presence->activite->time);
                }

                if ($presence->specialEvent && $presence->specialEvent->date) {
                    $dateSource = Carbon::parse(
                        trim((string) $presence->specialEvent->date . ' ' . (string) ($presence->specialEvent->time ?? '00:00'))
                    );
                }

                $d = Carbon::parse($dateSource);

                $activityLabel = $presence->specialEvent?->title
                    ?? $presence->activite?->title
                    ?? 'Activite';

                $activityType = $presence->specialEvent ? 'programme' : ($presence->activite?->type ?? null);

                $isCulte = str_contains(
                    mb_strtolower((string) ($presence->specialEvent?->title ?? $presence->activite?->type ?? '')),
                    'culte'
                );

                return [
                    'id' => $presence->id,
                    'activite' => $activityLabel,
                    'type' => $activityType,
                    'is_culte' => $isCulte,
                    'date' => $d->locale('fr')->translatedFormat('d M'),
                    'mois' => (int) $d->month,
                    'statut' => $presence->statut ?? 'present',
                ];
            })
            ->values();

        $membre = [
            'prenom' => $user->prenom,
            'nom' => $user->nom,
            'classe' => $user->classe?->nom,
            'conducteur' => trim((string) (($user->classe?->conducteur?->prenom ?? '') . ' ' . ($user->classe?->conducteur?->nom ?? ''))),
            'initiales' => strtoupper(substr((string) $user->prenom, 0, 1) . substr((string) $user->nom, 0, 1)),
        ];

        return Inertia::render('MembreFamille/Presences/Index', [
            'membre' => $membre,
            'historique' => $historique,
        ]);
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
