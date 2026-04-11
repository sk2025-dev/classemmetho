<?php

namespace App\Http\Controllers\Pasteur;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\PermanentActivity;
use App\Models\Presence;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PresencesController extends Controller
{
    public function index(): Response
    {
        if (! $this->hasRequiredTables()) {
            return Inertia::render('Pasteur/Presences/Index', [
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
            ]);
        }

        return Inertia::render('Pasteur/Presences/Index', $this->collectDashboardData());
    }

    public function export(): StreamedResponse
    {
        if (! $this->hasRequiredTables()) {
            abort(404, 'Les donnees de presence ne sont pas encore disponibles.');
        }

        $data = $this->collectDashboardData();
        $fileName = 'presences_pasteur_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($data) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, ['Dashboard', 'Valeur']);
            fputcsv($out, ['Classes actives', $data['stats']['total_classes'] ?? 0]);
            fputcsv($out, ['Total membres', $data['stats']['total_membres'] ?? 0]);
            fputcsv($out, ['Presents dernier culte', $data['stats']['presents_dernier'] ?? 0]);
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
            ->havingRaw('COUNT(*) >= 3')
            ->get()
            ->count();

        $classesData = Classe::query()
            ->with('users:id,classe_id')
            ->get(['id', 'nom'])
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
                    'name' => $classe->nom,
                    'pct' => $pct,
                    'present' => $presentCount,
                    'total' => $totalMarquages > 0 ? $totalMarquages : $totalMembresClasse,
                    'color' => $pct >= 75 ? '#2d2f8f' : ($pct >= 60 ? '#4a4db8' : '#e53e3e'),
                ];
            })
            ->sortByDesc('pct')
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
            ->get(['id', 'title'])
            ->map(function (PermanentActivity $activity) use ($activityMap) {
                $stats = $activityMap->get($activity->id);
                $present = (int) ($stats->presents ?? 0);
                $total = (int) ($stats->total ?? 0);
                $pct = $total > 0 ? (int) round(($present / $total) * 100) : 0;

                return [
                    'name' => $activity->title,
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
            ->selectRaw('u.id as user_id, u.prenom, u.nom, c.nom as classe_nom, COUNT(*) as absences')
            ->where('p.statut', 'absent')
            ->groupBy('u.id', 'u.prenom', 'u.nom', 'c.nom')
            ->havingRaw('COUNT(*) >= 3')
            ->orderByDesc('absences')
            ->limit(20)
            ->get()
            ->map(function ($row) {
                $abs = (int) $row->absences;

                return [
                    'name' => trim(($row->prenom ?? '') . ' ' . ($row->nom ?? '')),
                    'classe' => $row->classe_nom ?? 'Sans classe',
                    'absences' => $abs,
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
        ];
    }
}
