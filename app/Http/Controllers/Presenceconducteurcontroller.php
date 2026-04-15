<?php

namespace App\Http\Controllers;

use App\Models\PermanentActivity;
use App\Models\Presence;
use App\Models\SpecialEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class PresenceConducteurController extends Controller
{
    /**
     * Affiche la page de gestion des présences pour le conducteur connecté.
     * Route : GET /conducteur/presences
     */
    public function index(Request $request)
    {
        $conducteur = Auth::user()->load('classe');
        $classe = $conducteur->classe;

        abort_if(! $classe, 403, "Aucune classe associée à ce conducteur.");

        // Activites source unique: evenements crees dans Programmes (special_events)
        $activites = SpecialEvent::query()
            ->where('class_id', $classe->id)
            ->where('is_parish', false)
            ->orderByDesc('date')
            ->orderByDesc('time')
            ->get(['id', 'title', 'date', 'time', 'end_time', 'lieu'])
            ->map(function (SpecialEvent $event) {
                $dateHeure = $this->resolveSpecialEventDateTime($event);
                $dateHeureFin = $this->resolveSpecialEventEndDateTime($event);
                $titre = (string) $event->title;

                return [
                    'id' => $event->id,
                    'titre' => $titre,
                    'type' => 'activite',
                    'date_heure_debut' => $dateHeure,
                    'date_heure_fin' => $dateHeureFin,
                    'statut' => Carbon::parse($dateHeure)->isPast() ? 'terminee' : 'planifiee',
                    'presence_obligatoire' => true,
                    'source' => 'programme',
                ];
            })
            ->values();

        // Membres de la classe
        $membres = $classe->users()
            ->with('family:id,nom')
            ->get()
            ->map(fn(User $m) => [
                'id' => $m->id,
                'prenom' => $m->prenom,
                'nom' => $m->nom,
                'famille' => $m->family ? ['nom' => $m->family->nom] : null,
                'avatar_initiales' => strtoupper(substr((string) $m->prenom, 0, 1) . substr((string) $m->nom, 0, 1)),
                'couleur' => $this->couleurAvatar($m->id),
            ]);

        // Présences existantes indexées [activite_id][membre_id] = statut
        $hasSpecialEventColumn = Schema::hasColumn('presences', 'special_event_id');

        $presencesBrutes = $hasSpecialEventColumn
            ? Presence::whereIn('special_event_id', $activites->pluck('id'))
            ->get(['special_event_id', 'membre_famille_id', 'statut'])
            : collect();

        $presences = [];
        foreach ($presencesBrutes as $p) {
            $presences[$p->special_event_id][$p->membre_famille_id] = $p->statut ?? 'present';
        }

        // Activité en cours ou la plus récente
        $activiteActiveId = $activites->first()['id'] ?? null;

        // Stats rapides
        $derniereActivite = $activites->first();
        $presencesDernier = $derniereActivite ? ($presences[$derniereActivite['id']] ?? []) : [];
        $nbPresents       = collect($presencesDernier)->filter(fn($v) => $v === 'present')->count();

        // Absences récurrentes : membres absents >= 3 fois
        $absencesParMembre = [];
        foreach ($presences as $actId => $marquages) {
            foreach ($marquages as $membreId => $statut) {
                if ($statut === 'absent') {
                    $absencesParMembre[$membreId] = ($absencesParMembre[$membreId] ?? 0) + 1;
                }
            }
        }
        $nbAbsencesRecurrentes = collect($absencesParMembre)->filter(fn($n) => $n >= 3)->count();

        // Taux moyen sur les 4 dernières activités
        $dernières = $activites->take(4);
        $tauxTotal = $membres->count() > 0
            ? $dernières->map(fn($a) => collect($presences[$a['id']] ?? [])->filter(fn($v) => $v === 'present')->count())
            ->average()
            : 0;
        $tauxMoyen = $membres->count() > 0
            ? round(($tauxTotal / max($membres->count(), 1)) * 100)
            : 0;

        return Inertia::render('Conducteur/Presence/presences', [
            'conducteur'          => [
                'id'     => $conducteur->id,
                'prenom' => $conducteur->prenom,
                'nom'    => $conducteur->nom,
                'classe' => ['id' => $classe->id, 'nom' => $classe->nom],
            ],
            'activites'           => $activites,
            'membres'             => $membres,
            'presences'           => $presences,
            'activite_active_id'  => $activiteActiveId,
            'stats'               => [
                'total_membres'          => $membres->count(),
                'presents_dernier'       => $nbPresents,
                'absences_recurrentes'   => $nbAbsencesRecurrentes,
                'taux_moyen'             => $tauxMoyen,
            ],
        ]);
    }

    /**
     * Retourne les activités créées dans le module Programmes du conducteur.
     * Route : GET /conducteur/presences/programmes-activites
     */
    public function activitesProgramme(Request $request)
    {
        $conducteur = Auth::user()->load('classe');
        $classe = $conducteur->classe;

        abort_if(! $classe, 403, "Aucune classe associée à ce conducteur.");

        $items = SpecialEvent::query()
            ->where('class_id', $classe->id)
            ->where('is_parish', false)
            ->orderByDesc('date')
            ->orderByDesc('time')
            ->get(['id', 'title', 'date', 'time', 'end_time', 'lieu'])
            ->map(function (SpecialEvent $event) {
                $dateHeure = $this->resolveSpecialEventDateTime($event);
                $dateHeureFin = $this->resolveSpecialEventEndDateTime($event);
                $title = (string) ($event->title ?? 'Activite');

                return [
                    'id' => $event->id,
                    'titre' => $title,
                    'type' => 'activite',
                    'date_heure_debut' => $dateHeure,
                    'date_heure_fin' => $dateHeureFin,
                    'statut' => Carbon::parse($dateHeure)->isPast() ? 'terminee' : 'planifiee',
                    'presence_obligatoire' => true,
                    'source' => 'programme',
                    'lieu' => $event->lieu,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'activites' => $items,
        ]);
    }

    /**
     * Enregistre les presences pour une activite issue du module Programmes.
     * Route : POST /conducteur/presences/programme/{event}
     */
    public function enregistrerProgramme(Request $request, SpecialEvent $event)
    {
        return response()->json([
            'success' => false,
            'message' => 'Le pointage manuel est desactive. Utilisez uniquement le QR code.',
        ], 403);
    }

    /**
     * Enregistre les présences pour une activité donnée.
     * Route : POST /conducteur/presences/{activite}
     */
    public function enregistrer(Request $request, PermanentActivity $activite)
    {
        return response()->json([
            'success' => false,
            'message' => 'Le pointage manuel est desactive. Utilisez uniquement le QR code.',
        ], 403);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Retourne une couleur déterministe selon l'id du membre.
     */
    private function couleurAvatar(int $id): string
    {
        $couleurs = [
            '#1a237e',
            '#4a148c',
            '#880e4f',
            '#006064',
            '#1b5e20',
            '#e65100',
            '#bf360c',
            '#37474f',
        ];
        return $couleurs[$id % count($couleurs)];
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
        $time = str_replace('h', ':', trim($time));
        $today = Carbon::now();
        $date = $today->copy()->startOfWeek(Carbon::MONDAY)->addDays(max($dayOfWeek - 1, 0));

        if (preg_match('/^\d{1,2}:\d{2}$/', $time)) {
            [$hour, $minute] = array_map('intval', explode(':', $time));
            $date->setTime($hour, $minute, 0);
        }

        if ($date->lt($today->copy()->subDay())) {
            $date->addWeek();
        }

        return $date->toDateTimeString();
    }

    private function resolveSpecialEventDateTime(SpecialEvent $event): string
    {
        $date = Carbon::parse($event->date);

        if (! empty($event->time)) {
            $time = Carbon::parse($event->time);
            $date->setTime($time->hour, $time->minute, $time->second);
        } else {
            $date->setTime(0, 0, 0);
        }

        return $date->toDateTimeString();
    }

    private function resolveSpecialEventEndDateTime(SpecialEvent $event): ?string
    {
        if (empty($event->end_time)) {
            return null;
        }

        $date = Carbon::parse($event->date);
        $time = Carbon::parse($event->end_time);
        $date->setTime($time->hour, $time->minute, $time->second);

        return $date->toDateTimeString();
    }
}
