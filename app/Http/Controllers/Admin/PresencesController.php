<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\Presence;
use App\Models\PermanentActivity;
use App\Models\SpecialEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PresencesController extends Controller
{
    public function index()
    {
        if (! $this->hasRequiredTables()) {
            return Inertia::render('Admin/Presences/index', [
                'stats' => [
                    'total_classes' => 0,
                    'total_membres' => 0,
                    'presents_dernier' => 0,
                    'absences_recurrentes' => 0,
                ],
                'classesData' => [],
                'activitesData' => [],
                'periodesData' => [],
                'alertesData' => [],
                'tendancesData' => [],
                'participantsData' => [],
                'activitesParMois2026' => $this->emptyMonths2026(),
                'classInsights' => [],
            ]);
        }

        return Inertia::render('Admin/Presences/index', $this->collectDashboardData());
    }

    public function export(): StreamedResponse
    {
        if (! $this->hasRequiredTables()) {
            abort(404, 'Les données de présence ne sont pas encore disponibles.');
        }

        $data = $this->collectDashboardData();
        $fileName = 'presences_admin_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($data) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, ['Dashboard', 'Valeur']);
            fputcsv($out, ['Classes actives', $data['stats']['total_classes'] ?? 0]);
            fputcsv($out, ['Total membres', $data['stats']['total_membres'] ?? 0]);
            fputcsv($out, ['Presents derniere activite', $data['stats']['presents_dernier'] ?? 0]);
            fputcsv($out, ['Absences recurrentes', $data['stats']['absences_recurrentes'] ?? 0]);
            fputcsv($out, []);

            fputcsv($out, ['Par classe']);
            fputcsv($out, ['Classe', 'Taux (%)', 'Presents', 'Total']);
            foreach ($data['classesData'] as $row) {
                fputcsv($out, [$row['name'], $row['pct'], $row['present'], $row['total']]);
            }
            fputcsv($out, []);

            fputcsv($out, ['Par activite']);
            fputcsv($out, ['Activite', 'Taux (%)', 'Presents', 'Total']);
            foreach ($data['activitesData'] as $row) {
                fputcsv($out, [$row['name'], $row['pct'], $row['present'], $row['total']]);
            }
            fputcsv($out, []);

            fputcsv($out, ['Par periode']);
            fputcsv($out, ['Mois', 'Taux (%)', 'Presents', 'Total']);
            foreach ($data['periodesData'] as $row) {
                fputcsv($out, [$row['mois'], $row['pct'], $row['present'], $row['total']]);
            }
            fputcsv($out, []);

            fputcsv($out, ['Alertes absences']);
            fputcsv($out, ['Nom', 'Classe', 'Absences', 'Niveau']);
            foreach ($data['alertesData'] as $row) {
                fputcsv($out, [$row['name'], $row['classe'], $row['absences'], $row['level']]);
            }
            fputcsv($out, []);

            fputcsv($out, ['Tendances hebdomadaires']);
            fputcsv($out, ['Semaine', 'Taux (%)']);
            foreach ($data['tendancesData'] as $row) {
                fputcsv($out, [$row['semaine'], $row['pct']]);
            }

            fclose($out);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function hasRequiredTables(): bool
    {
        return Schema::hasTable('presences')
            && Schema::hasTable('permanent_activities')
            && Schema::hasTable('classes');
    }

    private function collectDashboardData(): array
    {
        $totalClasses = (int) Classe::query()->count();
        $totalMembres = (int) User::query()->whereNotNull('classe_id')->count();

        $classes = Classe::query()
            ->with('users:id,classe_id')
            ->get(['id', 'nom']);

        $lastActivityId = PermanentActivity::query()
            ->where('is_parish', false)
            ->latest('id')
            ->value('id');

        $presentsDernier = 0;
        if ($lastActivityId) {
            $presentsDernier = (int) Presence::query()
                ->where('activite_id', $lastActivityId)
                ->where('statut', 'present')
                ->count();
        }

        $absencesRecurrentes = (int) Presence::query()
            ->where('statut', 'absent')
            ->select('membre_famille_id')
            ->groupBy('membre_famille_id')
            ->havingRaw("COUNT(DISTINCT CASE WHEN special_event_id IS NOT NULL THEN CONCAT('se-', special_event_id) WHEN activite_id IS NOT NULL THEN CONCAT('pa-', activite_id) ELSE CONCAT('p-', id) END) >= 3")
            ->get()
            ->count();

        $classesData = $classes
            ->map(function (Classe $classe) {
                $memberIds = $classe->users->pluck('id');
                $totalMembresClasse = $memberIds->count();
                $presentCount = 0;
                $totalMarquages = 0;

                if ($totalMembresClasse > 0) {
                    $totalMarquages = (int) Presence::query()
                        ->whereIn('membre_famille_id', $memberIds)
                        ->count();

                    $presentCount = (int) Presence::query()
                        ->whereIn('membre_famille_id', $memberIds)
                        ->where('statut', 'present')
                        ->count();
                }

                $pct = $totalMarquages > 0 ? (int) round(($presentCount / $totalMarquages) * 100) : 0;

                return [
                    'id' => $classe->id,
                    'name' => $classe->nom,
                    'pct' => $pct,
                    'present' => $presentCount,
                    'total' => $totalMarquages > 0 ? $totalMarquages : $totalMembresClasse,
                    'color' => $pct >= 75 ? '#2d2f8f' : ($pct >= 60 ? '#4a4db8' : '#e53e3e'),
                ];
            })
            ->sortByDesc('pct')
            ->values();

        $classIds = $classes->pluck('id')->values();

        $classActivitiesRows = Presence::query()
            ->from('presences as p')
            ->join('users as u', 'u.id', '=', 'p.membre_famille_id')
            ->leftJoin('permanent_activities as pa', 'pa.id', '=', 'p.activite_id')
            ->leftJoin('special_events as se', 'se.id', '=', 'p.special_event_id')
            ->whereIn('u.classe_id', $classIds)
            ->selectRaw('u.classe_id as classe_id,
                COALESCE(se.title, pa.title, "Activite") as activity_name,
                COALESCE(pa.type, "programme") as activity_type,
                SUM(CASE WHEN p.statut = "present" THEN 1 ELSE 0 END) as presents,
                COUNT(*) as total')
            ->groupBy('u.classe_id', 'activity_name', 'activity_type')
            ->get()
            ->groupBy('classe_id')
            ->map(function ($rows) {
                return collect($rows)
                    ->map(function ($row) {
                        $present = (int) ($row->presents ?? 0);
                        $total = (int) ($row->total ?? 0);
                        $pct = $total > 0 ? (int) round(($present / $total) * 100) : 0;

                        return [
                            'name' => $row->activity_name,
                            'type' => $row->activity_type,
                            'pct' => $pct,
                            'present' => $present,
                            'total' => max($total, 1),
                            'color' => $pct >= 75 ? '#2d2f8f' : ($pct >= 60 ? '#4a4db8' : '#7c3aed'),
                        ];
                    })
                    ->sortByDesc('pct')
                    ->values();
            });

        $classParticipantsRows = Presence::query()
            ->from('presences as p')
            ->join('users as u', 'u.id', '=', 'p.membre_famille_id')
            ->leftJoin('classes as c', 'c.id', '=', 'u.classe_id')
            ->leftJoin('permanent_activities as pa', 'pa.id', '=', 'p.activite_id')
            ->leftJoin('special_events as se', 'se.id', '=', 'p.special_event_id')
            ->whereIn('u.classe_id', $classIds)
            ->selectRaw('u.classe_id as classe_id,
                u.id as membre_id,
                u.prenom,
                u.nom,
                c.nom as classe_nom,
                p.statut,
                COALESCE(se.title, pa.title, "Activite") as activite_nom,
                p.marquee_le,
                p.created_at')
            ->orderByDesc('p.marquee_le')
            ->orderByDesc('p.created_at')
            ->limit(1500)
            ->get()
            ->groupBy('classe_id')
            ->map(function ($rows) {
                return collect($rows)
                    ->map(function ($row) {
                        return [
                            'participant' => trim(($row->prenom ?? '') . ' ' . ($row->nom ?? '')),
                            'classe' => $row->classe_nom ?? 'Sans classe',
                            'activite' => $row->activite_nom ?? 'Activite',
                            'statut' => $row->statut ?? 'absent',
                            'date' => $row->marquee_le ?? $row->created_at,
                        ];
                    })
                    ->values();
            });

        $classMonthlyRows = Presence::query()
            ->from('presences as p')
            ->join('users as u', 'u.id', '=', 'p.membre_famille_id')
            ->whereIn('u.classe_id', $classIds)
            ->whereNotNull('p.created_at')
            ->selectRaw('u.classe_id as classe_id,
                YEAR(p.created_at) as y,
                MONTH(p.created_at) as m,
                SUM(CASE WHEN p.statut = "present" THEN 1 ELSE 0 END) as presents,
                COUNT(*) as total')
            ->groupByRaw('u.classe_id, YEAR(p.created_at), MONTH(p.created_at)')
            ->orderByRaw('YEAR(p.created_at), MONTH(p.created_at)')
            ->get()
            ->groupBy('classe_id')
            ->map(function ($rows) {
                return collect($rows)->map(function ($row) {
                    $monthDate = Carbon::createFromDate((int) $row->y, (int) $row->m, 1);
                    $total = (int) ($row->total ?? 0);
                    $present = (int) ($row->presents ?? 0);
                    $pct = $total > 0 ? (int) round(($present / $total) * 100) : 0;

                    return [
                        'mois' => $monthDate->locale('fr')->translatedFormat('F'),
                        'pct' => $pct,
                        'present' => $present,
                        'total' => max($total, 1),
                    ];
                })->values();
            });

        $classWeeklyRows = Presence::query()
            ->from('presences as p')
            ->join('users as u', 'u.id', '=', 'p.membre_famille_id')
            ->whereIn('u.classe_id', $classIds)
            ->whereNotNull('p.created_at')
            ->selectRaw('u.classe_id as classe_id,
                DATE_FORMAT(p.created_at, "%x-%v") as iso_week,
                SUM(CASE WHEN p.statut = "present" THEN 1 ELSE 0 END) as presents,
                COUNT(*) as total')
            ->groupByRaw('u.classe_id, DATE_FORMAT(p.created_at, "%x-%v")')
            ->orderByRaw('DATE_FORMAT(p.created_at, "%x-%v")')
            ->get()
            ->groupBy('classe_id')
            ->map(function ($rows) {
                return collect($rows)
                    ->take(-8)
                    ->map(function ($row) {
                        $parts = explode('-', (string) $row->iso_week);
                        $weekNumber = $parts[1] ?? null;
                        $total = (int) ($row->total ?? 0);
                        $present = (int) ($row->presents ?? 0);
                        $pct = $total > 0 ? (int) round(($present / $total) * 100) : 0;

                        return [
                            'semaine' => $weekNumber ? ('Sem. ' . ltrim($weekNumber, '0')) : 'Sem.',
                            'pct' => $pct,
                        ];
                    })
                    ->values();
            });

        $classAlertRows = Presence::query()
            ->from('presences as p')
            ->join('users as u', 'u.id', '=', 'p.membre_famille_id')
            ->leftJoin('classes as c', 'c.id', '=', 'u.classe_id')
            ->where('p.statut', 'absent')
            ->whereIn('u.classe_id', $classIds)
            ->selectRaw("u.classe_id as classe_id, u.id as user_id, u.prenom, u.nom, c.nom as classe_nom, COUNT(*) as absences, COUNT(DISTINCT CASE WHEN p.special_event_id IS NOT NULL THEN CONCAT('se-', p.special_event_id) WHEN p.activite_id IS NOT NULL THEN CONCAT('pa-', p.activite_id) ELSE CONCAT('p-', p.id) END) as activites_distinctes")
            ->groupBy('u.classe_id', 'u.id', 'u.prenom', 'u.nom', 'c.nom')
            ->havingRaw("COUNT(DISTINCT CASE WHEN p.special_event_id IS NOT NULL THEN CONCAT('se-', p.special_event_id) WHEN p.activite_id IS NOT NULL THEN CONCAT('pa-', p.activite_id) ELSE CONCAT('p-', p.id) END) >= 3")
            ->orderByDesc('absences')
            ->get()
            ->groupBy('classe_id')
            ->map(function ($rows) {
                return collect($rows)
                    ->take(20)
                    ->map(function ($row) {
                        $abs = (int) ($row->absences ?? 0);

                        return [
                            'id' => (int) ($row->user_id ?? 0),
                            'name' => trim(($row->prenom ?? '') . ' ' . ($row->nom ?? '')),
                            'classe' => $row->classe_nom ?? 'Sans classe',
                            'absences' => $abs,
                            'activites' => (int) ($row->activites_distinctes ?? 0),
                            'level' => $abs >= 4 ? 'high' : 'medium',
                        ];
                    })
                    ->values();
            });

        $classInsights = [];
        foreach ($classes as $classe) {
            $classeKey = (string) $classe->id;
            $classInsights[$classeKey] = [
                'activitesData' => ($classActivitiesRows->get($classe->id) ?? collect())->values()->all(),
                'periodesData' => ($classMonthlyRows->get($classe->id) ?? collect())->values()->all(),
                'tendancesData' => ($classWeeklyRows->get($classe->id) ?? collect())->values()->all(),
                'alertesData' => ($classAlertRows->get($classe->id) ?? collect())->values()->all(),
                'participantsData' => ($classParticipantsRows->get($classe->id) ?? collect())->values()->all(),
                'activitesParMois2026' => $this->emptyMonths2026(),
            ];
        }

        $events2026 = collect();
        if (Schema::hasTable('special_events')) {
            $events2026 = SpecialEvent::query()
                ->leftJoin('classes as c', 'c.id', '=', 'special_events.class_id')
                ->whereYear('special_events.date', 2026)
                ->where('special_events.is_parish', false)
                ->orderBy('special_events.date')
                ->orderBy('special_events.time')
                ->get([
                    'special_events.id',
                    'special_events.class_id',
                    'special_events.title',
                    'special_events.date',
                    'special_events.time',
                    'special_events.end_time',
                    'special_events.lieu',
                    'c.nom as classe_nom',
                ]);
        }

        $activitesParMois2026 = $this->emptyMonths2026();
        foreach ($events2026 as $event) {
            if (empty($event->date)) {
                continue;
            }

            $monthKey = Carbon::parse($event->date)->format('Y-m');
            if (! array_key_exists($monthKey, $activitesParMois2026)) {
                continue;
            }

            $activitesParMois2026[$monthKey][] = [
                'id' => $event->id,
                'titre' => (string) ($event->title ?? 'Activite'),
                'date' => $event->date,
                'heure' => $event->time,
                'heure_fin' => $event->end_time,
                'classe' => $event->classe_nom,
                'lieu' => $event->lieu,
            ];
        }

        foreach ($activitesParMois2026 as $monthKey => $items) {
            usort($items, function ($a, $b) {
                $aDate = $this->resolveEventDateTimeForSort($a);
                $bDate = $this->resolveEventDateTimeForSort($b);
                return $aDate <=> $bDate;
            });
            $activitesParMois2026[$monthKey] = $items;
        }

        foreach ($classes as $classe) {
            $classeKey = (string) $classe->id;
            $monthMap = $this->emptyMonths2026();

            foreach ($events2026->where('class_id', $classe->id) as $event) {
                if (empty($event->date)) {
                    continue;
                }

                $monthKey = Carbon::parse($event->date)->format('Y-m');
                if (! array_key_exists($monthKey, $monthMap)) {
                    continue;
                }

                $monthMap[$monthKey][] = [
                    'id' => $event->id,
                    'titre' => (string) ($event->title ?? 'Activite'),
                    'date' => $event->date,
                    'heure' => $event->time,
                    'heure_fin' => $event->end_time,
                    'classe' => $event->classe_nom,
                    'lieu' => $event->lieu,
                ];
            }

            foreach ($monthMap as $monthKey => $items) {
                usort($items, function ($a, $b) {
                    $aDate = $this->resolveEventDateTimeForSort($a);
                    $bDate = $this->resolveEventDateTimeForSort($b);
                    return $aDate <=> $bDate;
                });
                $monthMap[$monthKey] = $items;
            }

            $classInsights[$classeKey]['activitesParMois2026'] = $monthMap;
        }

        $participantsData = Presence::query()
            ->from('presences as p')
            ->join('users as u', 'u.id', '=', 'p.membre_famille_id')
            ->leftJoin('classes as c', 'c.id', '=', 'u.classe_id')
            ->leftJoin('permanent_activities as pa', 'pa.id', '=', 'p.activite_id')
            ->leftJoin('special_events as se', 'se.id', '=', 'p.special_event_id')
            ->selectRaw('u.id as membre_id,
                u.prenom,
                u.nom,
                c.nom as classe_nom,
                p.statut,
                COALESCE(se.title, pa.title, "Activite") as activite_nom,
                p.marquee_le,
                p.created_at')
            ->orderByDesc('p.marquee_le')
            ->orderByDesc('p.created_at')
            ->limit(1500)
            ->get()
            ->map(function ($row) {
                return [
                    'participant' => trim(($row->prenom ?? '') . ' ' . ($row->nom ?? '')),
                    'classe' => $row->classe_nom ?? 'Sans classe',
                    'activite' => $row->activite_nom ?? 'Activite',
                    'statut' => $row->statut ?? 'absent',
                    'date' => $row->marquee_le ?? $row->created_at,
                ];
            })
            ->values();

        $activityMap = Presence::query()
            ->selectRaw('activite_id,
                SUM(CASE WHEN statut = "present" THEN 1 ELSE 0 END) as presents,
                COUNT(*) as total')
            ->groupBy('activite_id')
            ->get()
            ->keyBy('activite_id');

        $activitesData = PermanentActivity::query()
            ->where('is_parish', false)
            ->get(['id', 'title', 'type'])
            ->map(function (PermanentActivity $activity) use ($activityMap) {
                $stats = $activityMap->get($activity->id);
                $present = (int) ($stats->presents ?? 0);
                $total = (int) ($stats->total ?? 0);
                $pct = $total > 0 ? (int) round(($present / $total) * 100) : 0;

                return [
                    'name' => $activity->title,
                    'type' => $activity->type,
                    'pct' => $pct,
                    'present' => $present,
                    'total' => max($total, 1),
                    'color' => $pct >= 75 ? '#2d2f8f' : ($pct >= 60 ? '#4a4db8' : '#7c3aed'),
                ];
            })
            ->sortByDesc('pct')
            ->values();

        $monthly = Presence::query()
            ->selectRaw('YEAR(created_at) as y, MONTH(created_at) as m,
                SUM(CASE WHEN statut = "present" THEN 1 ELSE 0 END) as presents,
                COUNT(*) as total')
            ->whereNotNull('created_at')
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->orderByRaw('YEAR(created_at), MONTH(created_at)')
            ->get();

        $periodesData = $monthly->map(function ($row) {
            $monthDate = Carbon::createFromDate((int) $row->y, (int) $row->m, 1);
            $total = (int) $row->total;
            $present = (int) $row->presents;
            $pct = $total > 0 ? (int) round(($present / $total) * 100) : 0;

            return [
                'mois' => $monthDate->locale('fr')->translatedFormat('F'),
                'pct' => $pct,
                'present' => $present,
                'total' => max($total, 1),
            ];
        })->values();

        $alertesData = Presence::query()
            ->from('presences as p')
            ->join('users as u', 'u.id', '=', 'p.membre_famille_id')
            ->leftJoin('classes as c', 'c.id', '=', 'u.classe_id')
            ->selectRaw("u.id as user_id, u.prenom, u.nom, c.nom as classe_nom, COUNT(*) as absences, COUNT(DISTINCT CASE WHEN p.special_event_id IS NOT NULL THEN CONCAT('se-', p.special_event_id) WHEN p.activite_id IS NOT NULL THEN CONCAT('pa-', p.activite_id) ELSE CONCAT('p-', p.id) END) as activites_distinctes")
            ->where('p.statut', 'absent')
            ->groupBy('u.id', 'u.prenom', 'u.nom', 'c.nom')
            ->havingRaw("COUNT(DISTINCT CASE WHEN p.special_event_id IS NOT NULL THEN CONCAT('se-', p.special_event_id) WHEN p.activite_id IS NOT NULL THEN CONCAT('pa-', p.activite_id) ELSE CONCAT('p-', p.id) END) >= 3")
            ->orderByDesc('absences')
            ->limit(20)
            ->get()
            ->map(function ($row) {
                $abs = (int) $row->absences;

                return [
                    'id' => (int) ($row->user_id ?? 0),
                    'name' => trim(($row->prenom ?? '') . ' ' . ($row->nom ?? '')),
                    'classe' => $row->classe_nom ?? 'Sans classe',
                    'absences' => $abs,
                    'activites' => (int) ($row->activites_distinctes ?? 0),
                    'level' => $abs >= 4 ? 'high' : 'medium',
                ];
            })
            ->values();

        $weekly = Presence::query()
            ->selectRaw('DATE_FORMAT(created_at, "%x-%v") as iso_week,
                SUM(CASE WHEN statut = "present" THEN 1 ELSE 0 END) as presents,
                COUNT(*) as total')
            ->whereNotNull('created_at')
            ->groupByRaw('DATE_FORMAT(created_at, "%x-%v")')
            ->orderByRaw('DATE_FORMAT(created_at, "%x-%v")')
            ->limit(8)
            ->get();

        $tendancesData = $weekly->map(function ($row) {
            $parts = explode('-', (string) $row->iso_week);
            $weekNumber = $parts[1] ?? null;
            $total = (int) $row->total;
            $present = (int) $row->presents;
            $pct = $total > 0 ? (int) round(($present / $total) * 100) : 0;

            return [
                'semaine' => $weekNumber ? ('Sem. ' . ltrim($weekNumber, '0')) : 'Sem.',
                'pct' => $pct,
            ];
        })->values();

        return [
            'stats' => [
                'total_classes' => $totalClasses,
                'total_membres' => $totalMembres,
                'presents_dernier' => $presentsDernier,
                'absences_recurrentes' => $absencesRecurrentes,
            ],
            'classesData' => $classesData,
            'activitesData' => $activitesData,
            'periodesData' => $periodesData,
            'alertesData' => $alertesData,
            'tendancesData' => $tendancesData,
            'participantsData' => $participantsData,
            'activitesParMois2026' => $activitesParMois2026,
            'classInsights' => $classInsights,
        ];
    }

    private function resolveEventDateTimeForSort(array $item): Carbon
    {
        $date = (string) ($item['date'] ?? '1970-01-01');
        $timeRaw = trim((string) ($item['heure'] ?? ''));

        if ($timeRaw === '') {
            return Carbon::parse($date . ' 00:00:00');
        }

        // Some sources already provide a full datetime in the time field.
        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $timeRaw) === 1) {
            return Carbon::parse($timeRaw);
        }

        if (preg_match('/^\d{1,2}:\d{2}(:\d{2})?$/', $timeRaw) === 1) {
            return Carbon::parse($date . ' ' . $timeRaw);
        }

        try {
            return Carbon::parse($timeRaw);
        } catch (\Throwable $e) {
            return Carbon::parse($date . ' 00:00:00');
        }
    }

    private function emptyMonths2026(): array
    {
        return [
            '2026-01' => [],
            '2026-02' => [],
            '2026-03' => [],
            '2026-04' => [],
            '2026-05' => [],
            '2026-06' => [],
            '2026-07' => [],
            '2026-08' => [],
            '2026-09' => [],
            '2026-10' => [],
            '2026-11' => [],
            '2026-12' => [],
        ];
    }
}
