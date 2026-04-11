<?php

namespace App\Http\Controllers;

use App\Models\PermanentActivity;
use App\Models\Presence;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Activités de la classe (toutes les activités non-paroissiales)
        $activites = PermanentActivity::query()
            ->where('is_parish', false)
            ->get()
            ->map(function (PermanentActivity $activite) {
                return [
                    'id' => $activite->id,
                    'titre' => $activite->title,
                    'type' => $activite->type,
                    'date_heure_debut' => $this->dateHeureDebut($activite->day, $activite->time),
                    'statut' => 'planifiee',
                    'presence_obligatoire' => true,
                ];
            })
            ->sortByDesc('date_heure_debut')
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
        $presencesBrutes = Presence::whereIn('activite_id', $activites->pluck('id'))
            ->get(['activite_id', 'membre_famille_id', 'statut']);   // ajoute 'statut' à ta table si besoin

        $presences = [];
        foreach ($presencesBrutes as $p) {
            $presences[$p->activite_id][$p->membre_famille_id] = $p->statut ?? 'present';
        }

        // Activité en cours ou la plus récente
        $activiteActiveId = $activites->first()['id'] ?? null;

        // Stats rapides
        $dernierCulte    = $activites->firstWhere('type', 'culte');
        $presencesDernier = $dernierCulte ? ($presences[$dernierCulte['id']] ?? []) : [];
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
     * Enregistre les présences pour une activité donnée.
     * Route : POST /conducteur/presences/{activite}
     */
    public function enregistrer(Request $request, PermanentActivity $activite)
    {
        $conducteur = Auth::user()->load('classe');

        // Vérification simple : seules les activités de classe sont autorisées ici
        abort_if((bool) $activite->is_parish, 403);

        $request->validate([
            'marquages'   => ['required', 'array'],
            'marquages.*' => ['nullable', 'in:present,absent,excuse'],
            'notes'       => ['nullable', 'array'],
            'notes.*'     => ['nullable', 'string', 'max:255'],
        ]);

        foreach ($request->marquages as $membreId => $statut) {
            if ($statut === null) {
                // Supprimer la présence si elle existe
                Presence::where('activite_id', $activite->id)
                    ->where('membre_famille_id', $membreId)
                    ->delete();
                continue;
            }

            Presence::updateOrCreate(
                [
                    'activite_id'       => $activite->id,
                    'membre_famille_id' => $membreId,
                ],
                [
                    'statut'      => $statut,   // ajoute ce champ à ta migration si besoin
                    'marquee_par' => Auth::id(),
                    'marquee_le'  => now(),
                    'methode'     => 'manuelle',
                    'notes'       => $request->notes[$membreId] ?? null,
                ]
            );
        }

        return response()->json(['message' => 'Présences enregistrées avec succès.']);
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
}
