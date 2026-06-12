<?php

namespace App\Http\Controllers\PresidentConducteurs;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\PermanentActivity;
use App\Models\Presence;
use App\Models\SpecialEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class PresencesController extends Controller
{
    private const MEMBER_ROLES = ['responsable_famille', 'membre_famille'];
    private const ABSENCES_THRESHOLD = 2;

    public function stats(Request $request)
    {
        $vue = $request->query('vue', 'classe');
        $periode = in_array($request->query('periode'), ['semaine', 'annee'], true)
            ? $request->query('periode')
            : 'mois';

        [$start, $end] = $this->resolvePeriodRange($periode, $request->query('date_ref'));

        return match ($vue) {
            'activite' => response()->json($this->statsParActivite(
                (int) $request->query('classe_id'),
                $periode,
                $start,
                $end
            )),
            'activites_globales' => response()->json($this->statsActivitesGlobales($periode, $start, $end)),
            'absences_repetees' => response()->json($this->statsAbsencesRepetees($start, $end)),
            'membres' => response()->json($this->statsMembres(
                (int) $request->query('classe_id'),
                $start,
                $end
            )),
            default => response()->json($this->statsParClasse($periode, $start, $end)),
        };
    }

    private function resolvePeriodRange(string $periode, ?string $dateRef): array
    {
        $ref = $dateRef ? Carbon::parse($dateRef) : Carbon::now();

        return match ($periode) {
            'semaine' => [$ref->copy()->startOfWeek(Carbon::MONDAY), $ref->copy()->endOfWeek(Carbon::SUNDAY)],
            'annee' => [$ref->copy()->startOfYear(), $ref->copy()->endOfYear()],
            default => [$ref->copy()->startOfMonth(), $ref->copy()->endOfMonth()],
        };
    }

    private function statsParClasse(string $periode, Carbon $start, Carbon $end): array
    {
        $classes = Classe::query()->orderBy('nom')->get(['id', 'nom']);

        $result = $classes->map(function (Classe $classe) use ($periode, $start, $end) {
            $memberIds = $this->memberIdsForClasse($classe->id);
            $nbMembres = $memberIds->count();
            $occurrences = $this->getOccurrences($memberIds, $start, $end);

            return [
                'id' => $classe->id,
                'nom' => $classe->nom,
                'nb_membres' => $nbMembres,
                'nb_occurrences' => $occurrences->count(),
                'taux_moyen' => $this->computeTauxMoyen($occurrences, $nbMembres),
                'serie_mensuelle' => $periode === 'annee'
                    ? $this->computeSerieMensuelle($memberIds, $nbMembres, $start, $end)
                    : null,
            ];
        })->values();

        return [
            'periode' => $periode,
            'debut' => $start->format('Y-m-d'),
            'fin' => $end->format('Y-m-d'),
            'classes' => $result,
        ];
    }

    private function statsParActivite(int $classeId, string $periode, Carbon $start, Carbon $end): array
    {
        $classe = Classe::query()->findOrFail($classeId, ['id', 'nom']);
        $memberIds = $this->memberIdsForClasse($classe->id);
        $nbMembres = $memberIds->count();

        if ($periode === 'annee') {
            return [
                'classe' => ['id' => $classe->id, 'nom' => $classe->nom],
                'periode' => $periode,
                'mode' => 'mensuel',
                'items' => $this->computeSerieMensuelle($memberIds, $nbMembres, $start, $end),
            ];
        }

        $occurrences = $this->getOccurrences($memberIds, $start, $end);

        $items = $occurrences->map(function (array $occ) use ($nbMembres) {
            $present = collect($occ['presences'])->filter(fn ($s) => $s === 'present')->count();

            return [
                'label' => $occ['titre'] . ' (' . Carbon::parse($occ['date'])->format('d/m') . ')',
                'date' => $occ['date'],
                'taux' => $nbMembres > 0 ? (int) round($present / $nbMembres * 100) : 0,
            ];
        })->values();

        return [
            'classe' => ['id' => $classe->id, 'nom' => $classe->nom],
            'periode' => $periode,
            'mode' => 'activite',
            'items' => $items,
        ];
    }

    /**
     * Synthèse des activités les plus suivies, toutes classes confondues,
     * sur la période donnée : nombre de présences cumulées et taux moyen
     * de participation par activité.
     */
    private function statsActivitesGlobales(string $periode, Carbon $start, Carbon $end): array
    {
        $members = User::query()->whereIn('role', self::MEMBER_ROLES)->get(['id', 'classe_id']);
        $memberIds = $members->pluck('id');
        $nbMembres = $memberIds->count();
        $memberClasseMap = $members->pluck('classe_id', 'id');
        $classeMemberCounts = $members->groupBy('classe_id')->map->count();

        $occurrences = $this->getOccurrences($memberIds, $start, $end);

        $eventIds = $occurrences->filter(fn (array $o) => str_starts_with($o['key'], 'se-'))
            ->map(fn (array $o) => (int) substr($o['key'], 3))
            ->unique();
        $events = SpecialEvent::query()
            ->with(['classe:id,nom', 'creator:id,nom,prenom'])
            ->whereIn('id', $eventIds)
            ->get()
            ->keyBy('id');

        $activites = $occurrences->groupBy('key')->map(function (Collection $group, string $key) use ($nbMembres, $memberClasseMap, $classeMemberCounts, $events) {
            $totalPresent = 0;
            $totalPossible = 0;
            $dates = [];

            foreach ($group as $occ) {
                $totalPresent += collect($occ['presences'])->filter(fn ($s) => $s === 'present')->count();
                $totalPossible += $nbMembres;
                $dates[] = $occ['date'];
            }

            $classeNom = null;
            $classeId = null;
            $conducteur = null;

            if (str_starts_with($key, 'se-')) {
                $event = $events->get((int) substr($key, 3));
                if ($event) {
                    $classeId = $event->class_id;
                    $classeNom = $event->classe?->nom;
                    $creator = $event->creator;
                    $conducteur = $creator ? trim(($creator->prenom ?? '') . ' ' . ($creator->nom ?? '')) : null;
                    $conducteur = $conducteur !== '' ? $conducteur : null;
                }
            }

            if ($classeId !== null && ($classeMemberCounts[$classeId] ?? 0) > 0) {
                $nbMembresRef = $classeMemberCounts[$classeId];
                $totalPresentRef = 0;
                $totalPossibleRef = 0;

                foreach ($group as $occ) {
                    foreach ($occ['presences'] as $membreId => $statut) {
                        if ($statut === 'present' && (int) ($memberClasseMap[$membreId] ?? 0) === (int) $classeId) {
                            $totalPresentRef++;
                        }
                    }
                    $totalPossibleRef += $nbMembresRef;
                }
            } else {
                $nbMembresRef = $nbMembres;
                $totalPresentRef = $totalPresent;
                $totalPossibleRef = $totalPossible;
            }

            return [
                'titre' => $group->first()['titre'],
                'nb_occurrences' => $group->count(),
                'nb_presences' => $totalPresent,
                'taux_moyen' => $totalPossible > 0 ? (int) round($totalPresent / $totalPossible * 100) : 0,
                'classe' => $classeNom,
                'conducteur' => $conducteur,
                'dates' => collect($dates)->unique()->sort()->values()
                    ->map(fn (string $d) => Carbon::parse($d)->format('d/m/Y'))->all(),
                'nb_participants_ref' => $totalPresentRef,
                'nb_membres_ref' => $nbMembresRef,
                'taux_ref' => $totalPossibleRef > 0 ? (int) round($totalPresentRef / $totalPossibleRef * 100) : 0,
            ];
        })->sortByDesc('nb_presences')->values();

        return [
            'periode' => $periode,
            'debut' => $start->format('Y-m-d'),
            'fin' => $end->format('Y-m-d'),
            'nb_membres' => $nbMembres,
            'activites' => $activites,
        ];
    }

    private function statsAbsencesRepetees(Carbon $start, Carbon $end): array
    {
        $classes = Classe::query()->orderBy('nom')->get(['id', 'nom']);
        $result = collect();

        foreach ($classes as $classe) {
            $membres = User::query()
                ->where('classe_id', $classe->id)
                ->whereIn('role', self::MEMBER_ROLES)
                ->get(['id', 'prenom', 'nom']);

            $memberIds = $membres->pluck('id');
            if ($memberIds->isEmpty()) {
                continue;
            }

            $occurrences = $this->getOccurrences($memberIds, $start, $end);
            $nbOccurrences = $occurrences->count();
            if ($nbOccurrences === 0) {
                continue;
            }

            foreach ($membres as $membre) {
                $absences = $occurrences->reduce(
                    fn (int $carry, array $occ) => $carry + (($occ['presences'][$membre->id] ?? null) !== 'present' ? 1 : 0),
                    0
                );

                if ($absences >= self::ABSENCES_THRESHOLD) {
                    $result->push([
                        'membre_id' => $membre->id,
                        'nom_complet' => trim(($membre->prenom ?? '') . ' ' . ($membre->nom ?? '')),
                        'classe_id' => $classe->id,
                        'classe' => $classe->nom,
                        'nb_absences' => $absences,
                        'nb_occurrences' => $nbOccurrences,
                        'taux_absence' => (int) round($absences / $nbOccurrences * 100),
                    ]);
                }
            }
        }

        return [
            'debut' => $start->format('Y-m-d'),
            'fin' => $end->format('Y-m-d'),
            'threshold' => self::ABSENCES_THRESHOLD,
            'membres' => $result->sortByDesc('nb_absences')->values(),
        ];
    }

    private function statsMembres(int $classeId, Carbon $start, Carbon $end): array
    {
        $classe = Classe::query()->findOrFail($classeId, ['id', 'nom']);

        $membres = User::query()
            ->where('classe_id', $classe->id)
            ->whereIn('role', self::MEMBER_ROLES)
            ->orderBy('prenom')
            ->get(['id', 'prenom', 'nom']);

        $memberIds = $membres->pluck('id');
        $occurrences = $this->getOccurrences($memberIds, $start, $end);
        $totalOccurrences = $occurrences->count();

        $rows = $membres->map(function (User $membre) use ($occurrences, $totalOccurrences) {
            $present = 0;
            $absent = 0;

            foreach ($occurrences as $occ) {
                if (($occ['presences'][$membre->id] ?? null) === 'present') {
                    $present++;
                } else {
                    $absent++;
                }
            }

            return [
                'id' => $membre->id,
                'nom_complet' => trim(($membre->prenom ?? '') . ' ' . ($membre->nom ?? '')),
                'present' => $present,
                'absent' => $absent,
                'taux' => $totalOccurrences > 0 ? (int) round($present / $totalOccurrences * 100) : 0,
            ];
        })->sortByDesc('taux')->values();

        return [
            'classe' => ['id' => $classe->id, 'nom' => $classe->nom],
            'debut' => $start->format('Y-m-d'),
            'fin' => $end->format('Y-m-d'),
            'occurrences' => $occurrences->map(fn (array $o) => [
                'key' => $o['key'],
                'titre' => $o['titre'],
                'date' => $o['date'],
            ])->values(),
            'membres' => $rows,
        ];
    }

    private function memberIdsForClasse(int $classeId): Collection
    {
        return User::query()
            ->where('classe_id', $classeId)
            ->whereIn('role', self::MEMBER_ROLES)
            ->pluck('id');
    }

    /**
     * Construit la liste des occurrences d'activités (permanentes ou événements
     * spéciaux) pour lesquelles des présences ont été marquées entre $start et $end,
     * pour les membres donnés. La date d'occurrence d'une activité permanente est
     * déduite de la date à laquelle ses présences ont été marquées.
     */
    private function getOccurrences(Collection $memberIds, Carbon $start, Carbon $end): Collection
    {
        if ($memberIds->isEmpty()) {
            return collect();
        }

        $rows = Presence::query()
            ->whereIn('membre_famille_id', $memberIds)
            ->whereNotNull('marquee_le')
            ->whereBetween('marquee_le', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->get(['membre_famille_id', 'activite_id', 'special_event_id', 'statut', 'marquee_le']);

        if ($rows->isEmpty()) {
            return collect();
        }

        $permActIds = $rows->whereNull('special_event_id')->pluck('activite_id')->filter()->unique();
        $permActTitles = PermanentActivity::query()->whereIn('id', $permActIds)->pluck('title', 'id');

        $eventIds = $rows->whereNotNull('special_event_id')->pluck('special_event_id')->unique();
        $eventTitles = SpecialEvent::query()->whereIn('id', $eventIds)->pluck('title', 'id');

        return $rows->groupBy(function (Presence $p) {
            return $p->special_event_id
                ? 'se-' . $p->special_event_id
                : 'pa-' . $p->activite_id . '-' . $p->marquee_le->format('Y-m-d');
        })->map(function (Collection $group) use ($permActTitles, $eventTitles) {
            $first = $group->first();
            $titre = $first->special_event_id
                ? ($eventTitles[$first->special_event_id] ?? 'Activité')
                : ($permActTitles[$first->activite_id] ?? 'Activité');

            $presences = [];
            foreach ($group as $p) {
                $presences[$p->membre_famille_id] = $p->statut;
            }

            return [
                'key' => $first->special_event_id ? 'se-' . $first->special_event_id : 'pa-' . $first->activite_id,
                'titre' => $titre,
                'date' => $first->marquee_le->format('Y-m-d'),
                'presences' => $presences,
            ];
        })->sortBy('date')->values();
    }

    private function computeTauxMoyen(Collection $occurrences, int $nbMembres): int
    {
        if ($occurrences->isEmpty() || $nbMembres === 0) {
            return 0;
        }

        $totalPresent = 0;
        $totalPossible = 0;

        foreach ($occurrences as $occ) {
            $totalPresent += collect($occ['presences'])->filter(fn ($s) => $s === 'present')->count();
            $totalPossible += $nbMembres;
        }

        return $totalPossible > 0 ? (int) round($totalPresent / $totalPossible * 100) : 0;
    }

    private function computeSerieMensuelle(Collection $memberIds, int $nbMembres, Carbon $start, Carbon $end): array
    {
        $serie = [];
        $cursor = $start->copy()->startOfMonth();
        $limite = $end->copy()->startOfMonth();

        while ($cursor->lte($limite)) {
            $monthStart = $cursor->copy()->startOfMonth();
            $monthEnd = $cursor->copy()->endOfMonth();
            $occurrences = $this->getOccurrences($memberIds, $monthStart, $monthEnd);

            $serie[] = [
                'label' => $cursor->locale('fr')->translatedFormat('M'),
                'taux' => $this->computeTauxMoyen($occurrences, $nbMembres),
            ];

            $cursor->addMonth();
        }

        return $serie;
    }
}
