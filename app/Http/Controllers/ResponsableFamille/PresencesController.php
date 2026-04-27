<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\Presence;
use App\Models\PermanentActivity;
use App\Models\SpecialEvent;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class PresencesController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $family = Family::with(['classe.conducteur'])
            ->where('responsable_id', $user->id)
            ->first();

        if (! $family) {
            return Inertia::render('ResponsableFamille/Presences/Index', [
                'famille'   => ['nom' => '', 'classe' => '', 'conducteur' => '', 'membres' => []],
                'activites' => [],
                'presences' => (object) [],
            ]);
        }

        $classeId = $family->classe_id;

        // Membres de la famille
        $membersCollection = $family->users()
            ->get(['id', 'prenom', 'nom', 'photo_path', 'profile_photo_url', 'classe_id']);

        $membres = $membersCollection->map(fn ($m) => [
            'id'        => $m->id,
            'prenom'    => $m->prenom,
            'nom'       => $m->nom,
            'initiales' => strtoupper(substr((string) $m->prenom, 0, 1) . substr((string) $m->nom, 0, 1)),
        ])->values();

        $memberIds = $membersCollection->pluck('id');

        $conducteur    = $family->classe?->conducteur;
        $nomConducteur = $conducteur
            ? trim(($conducteur->prenom ?? '') . ' ' . ($conducteur->nom ?? ''))
            : '';

        // Activités permanentes — pas de class_id sur cette table, on prend toutes
        $activites = collect();
        if (Schema::hasTable('permanent_activities')) {
            $activites = PermanentActivity::query()
                ->orderBy('id', 'desc')
                ->limit(30)
                ->get(['id', 'title', 'type', 'day', 'time'])
                ->map(fn ($a) => [
                    'id'               => $a->id,
                    'titre'            => $a->title,
                    'type'             => $a->type ?? 'activite',
                    'date_heure_debut' => $this->resolveDateFromActivity($a),
                    'heure'            => $a->time
                        ? str_replace(':', 'h', substr((string) $a->time, 0, 5))
                        : '',
                    'source'           => 'permanent',
                ]);
        }

        // Événements spéciaux filtrés par classe (special_events a class_id)
        if ($classeId && Schema::hasTable('special_events')) {
            $events = SpecialEvent::query()
                ->where(function ($q) use ($classeId) {
                    $q->where('class_id', $classeId)
                      ->orWhere('is_parish', true);
                })
                ->orderByDesc('start_date')
                ->limit(30)
                ->get(['id', 'title', 'start_date', 'start_time'])
                ->map(fn ($e) => [
                    'id'               => 'se-' . $e->id,
                    'titre'            => $e->title,
                    'type'             => 'programme',
                    'date_heure_debut' => $e->start_date
                        ? Carbon::parse($e->start_date)->toDateTimeString()
                        : null,
                    'heure'            => $e->start_time
                        ? str_replace(':', 'h', substr((string) $e->start_time, 0, 5))
                        : '',
                    'source'           => 'special',
                ]);

            $activites = $activites->concat($events);
        }

        $activites = $activites->sortByDesc('date_heure_debut')->values();

        // Présences indexées par activite_id -> membre_id -> statut
        $presencesByActivity = [];
        if ($memberIds->isNotEmpty() && Schema::hasTable('presences')) {
            Presence::query()
                ->whereIn('membre_famille_id', $memberIds)
                ->get(['membre_famille_id', 'activite_id', 'special_event_id', 'statut'])
                ->each(function ($p) use (&$presencesByActivity) {
                    $key = $p->special_event_id
                        ? 'se-' . $p->special_event_id
                        : (string) $p->activite_id;
                    $presencesByActivity[$key][$p->membre_famille_id] = $p->statut;
                });
        }

        return Inertia::render('ResponsableFamille/Presences/Index', [
            'famille' => [
                'nom'        => $family->nom,
                'classe'     => $family->classe?->nom ?? '',
                'conducteur' => $nomConducteur,
                'membres'    => $membres,
            ],
            'activites' => $activites->values(),
            'presences' => (object) $presencesByActivity,
        ]);
    }

    private function resolveDateFromActivity(PermanentActivity $activity): ?string
    {
        $days = [
            'lundi' => 1, 'mardi' => 2, 'mercredi' => 3,
            'jeudi' => 4, 'vendredi' => 5, 'samedi' => 6, 'dimanche' => 7,
        ];

        $normalizedDay = strtr(
            mb_strtolower(trim((string) ($activity->day ?? '')), 'UTF-8'),
            ['é' => 'e', 'è' => 'e', 'ê' => 'e', 'à' => 'a', 'ù' => 'u', 'ç' => 'c']
        );

        $dayOfWeek = $days[$normalizedDay] ?? Carbon::now()->dayOfWeekIso;
        $today     = Carbon::now();
        $date      = $today->copy()->startOfWeek(Carbon::MONDAY)->addDays(max($dayOfWeek - 1, 0));

        $rawTime = str_replace('h', ':', trim((string) ($activity->time ?? '')));
        if (preg_match('/^\d{1,2}:\d{2}$/', $rawTime)) {
            [$h, $i] = array_map('intval', explode(':', $rawTime));
            $date->setTime($h, $i, 0);
        }

        if ($date->lt($today->copy()->subDay())) {
            $date->addWeek();
        }

        return $date->toDateTimeString();
    }
}
