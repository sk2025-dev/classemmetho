<?php

namespace App\Http\Controllers;

use App\Models\PermanentActivity;
use App\Models\Fonction;
use App\Models\Presence;
use App\Models\SpecialEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
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
        $user = Auth::user();

        return Inertia::render(
            'Conducteur/Presence/presences',
            $this->buildPresencePagePayload($user, true, false),
        );
    }

    /**
     * Affiche la vue "marquage de présence" pour le marqueur désigné.
     */
    public function indexMarqueur(Request $request)
    {
        $user = Auth::user();
        $user->loadMissing('fonction');

        abort_if(! $this->isPresenceMarker($user), 403, 'Seul le marqueur de présence désigné peut accéder à ce module.');

        return Inertia::render(
            'Conducteur/Presence/marqueur_de_presence',
            $this->buildPresencePagePayload($user, false, true),
        );
    }

    /**
     * Retourne les activités créées dans le module Programmes du conducteur.
     * Route : GET /conducteur/presences/programmes-activites
     */
    public function activitesProgramme(Request $request)
    {
        $user = Auth::user()->loadMissing('classe', 'fonction');
        $classe = $user->classe;

        abort_if(! $classe, 403, "Aucune classe associée à ce conducteur.");
        abort_if(! $this->canAccessPresenceModule($user, (int) $classe->id), 403, 'Accès non autorisé à ce module.');

        $items = SpecialEvent::query()
            ->where('class_id', $classe->id)
            ->where('is_parish', false)
            ->orderByDesc('start_date')
            ->orderByDesc('start_time')
            ->get(['id', 'title', 'start_date', 'start_time', 'end_time', 'lieu'])
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

    public function assignPresenceMarker(Request $request): JsonResponse
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            return response()->json(['message' => 'Seul le conducteur peut assigner un marqueur de présence.'], 403);
        }

        if (! $user->classe_id) {
            return response()->json(['message' => 'Conducteur sans classe associee.'], 422);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $member = User::query()->findOrFail($validated['user_id']);

        if ((int) $member->classe_id !== (int) $user->classe_id) {
            return response()->json(['message' => 'Ce membre n\'est pas dans votre classe.'], 403);
        }

        if (! in_array($member->role, ['membre_famille', 'tresorier'], true)) {
            return response()->json(['message' => 'Seul un membre de famille peut devenir marqueur de présence.'], 422);
        }

        $fonction = $this->getPresenceMarkerFunction();

        User::query()
            ->where('classe_id', $user->classe_id)
            ->where('fonction_id', $fonction->id)
            ->where('id', '!=', $member->id)
            ->update(['fonction_id' => null]);

        $member->update([
            'role' => 'membre_famille',
            'fonction_id' => $fonction->id,
        ]);
        $member->load('family');

        return response()->json([
            'message' => 'Marqueur de présence assigné avec succès.',
            'data' => [
                'id' => $member->id,
                'nom' => trim(($member->prenom ?? '') . ' ' . ($member->nom ?? '')),
                'famille' => $member->family?->nom ?? 'Sans famille',
            ],
        ]);
    }

    public function unassignPresenceMarker(Request $request): JsonResponse
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            return response()->json(['message' => 'Seul le conducteur peut retirer un marqueur de présence.'], 403);
        }

        if (! $user->classe_id) {
            return response()->json(['message' => 'Conducteur sans classe associee.'], 422);
        }

        $validated = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $fonction = $this->getPresenceMarkerFunction();

        $query = User::query()
            ->where('classe_id', $user->classe_id)
            ->where('fonction_id', $fonction->id);

        if (! empty($validated['user_id'])) {
            $query->where('id', $validated['user_id']);
        }

        $member = $query->first();

        if (! $member) {
            return response()->json(['message' => 'Aucun marqueur de présence correspondant trouvé dans votre classe.'], 404);
        }

        $member->update(['fonction_id' => null]);

        return response()->json([
            'message' => 'Marqueur de présence retiré avec succès.',
            'data' => [
                'id' => $member->id,
                'nom' => trim(($member->prenom ?? '') . ' ' . ($member->nom ?? '')),
            ],
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

    private function buildPresencePagePayload(User $user, bool $canManagePresenceMarker, bool $isMarkerView): array
    {
        $user->loadMissing('classe');
        $classe = $user->classe;

        abort_if(! $classe, 403, 'Aucune classe associée à ce compte.');

        $activites = SpecialEvent::query()
            ->where('class_id', $classe->id)
            ->where('is_parish', false)
            ->orderByDesc('start_date')
            ->orderByDesc('start_time')
            ->get(['id', 'title', 'start_date', 'start_time', 'end_time', 'lieu'])
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

        $hasSpecialEventColumn = Schema::hasColumn('presences', 'special_event_id');

        $presencesBrutes = $hasSpecialEventColumn
            ? Presence::whereIn('special_event_id', $activites->pluck('id'))
            ->get(['special_event_id', 'membre_famille_id', 'statut'])
            : collect();

        $presences = [];
        foreach ($presencesBrutes as $p) {
            $presences[$p->special_event_id][$p->membre_famille_id] = $p->statut ?? 'present';
        }

        $activiteActiveId = $activites->first()['id'] ?? null;

        $derniereActivite = $activites->first();
        $presencesDernier = $derniereActivite ? ($presences[$derniereActivite['id']] ?? []) : [];
        $nbPresents = collect($presencesDernier)->filter(fn($v) => $v === 'present')->count();

        $absencesParMembre = [];
        foreach ($presences as $marquages) {
            foreach ($marquages as $membreId => $statut) {
                if ($statut === 'absent') {
                    $absencesParMembre[$membreId] = ($absencesParMembre[$membreId] ?? 0) + 1;
                }
            }
        }
        $nbAbsencesRecurrentes = collect($absencesParMembre)->filter(fn($n) => $n >= 3)->count();

        $dernieres = $activites->take(4);
        $tauxTotal = $membres->count() > 0
            ? $dernieres->map(fn($a) => collect($presences[$a['id']] ?? [])->filter(fn($v) => $v === 'present')->count())->average()
            : 0;
        $tauxMoyen = $membres->count() > 0
            ? round(($tauxTotal / max($membres->count(), 1)) * 100)
            : 0;

        $marqueur = $this->findPresenceMarkerForClass((int) $classe->id);

        return [
            'conducteur' => [
                'id' => $user->id,
                'prenom' => $user->prenom,
                'nom' => $user->nom,
                'classe' => ['id' => $classe->id, 'nom' => $classe->nom],
            ],
            'viewerLabel' => $isMarkerView ? 'Marqueur' : 'Conducteur',
            'canManagePresenceMarker' => $canManagePresenceMarker,
            'presenceMarkerClasse' => $marqueur ? [
                'id' => $marqueur->id,
                'nom' => trim(($marqueur->prenom ?? '') . ' ' . ($marqueur->nom ?? '')),
                'famille' => $marqueur->family?->nom ?? 'Sans famille',
            ] : null,
            'presenceEndpoints' => [
                'activitesProgramme' => $isMarkerView
                    ? '/membre-famille/presences/marquage/programmes-activites'
                    : '/conducteur/presences/programmes-activites',
                'programmeSummary' => $isMarkerView
                    ? '/membre-famille/presences/marquage/programmes/{id}/presences'
                    : '/conducteur/programmes/{id}/presences',
                'manualMark' => '/membre-famille/presences/marquage/marquer',
                'assignPresenceMarker' => '/conducteur/presences/assign-marqueur',
                'unassignPresenceMarker' => '/conducteur/presences/unassign-marqueur',
            ],
            'activites' => $activites,
            'membres' => $membres,
            'presences' => $presences,
            'activite_active_id' => $activiteActiveId,
            'stats' => [
                'total_membres' => $membres->count(),
                'presents_dernier' => $nbPresents,
                'absences_recurrentes' => $nbAbsencesRecurrentes,
                'taux_moyen' => $tauxMoyen,
            ],
        ];
    }

    private function findPresenceMarkerForClass(int $classeId): ?User
    {
        $fonction = $this->getPresenceMarkerFunction(false);
        if (! $fonction) {
            return null;
        }

        return User::query()
            ->with('family:id,nom')
            ->where('classe_id', $classeId)
            ->where('fonction_id', $fonction->id)
            ->first();
    }

    private function getPresenceMarkerFunction(bool $createIfMissing = true): ?Fonction
    {
        $fonction = Fonction::query()
            ->whereRaw('LOWER(nom) = ?', ['marqueur de présence'])
            ->orWhereRaw('LOWER(nom) = ?', ['marqueur de presence'])
            ->orWhereRaw('LOWER(nom) = ?', ['marqueur presence'])
            ->first();

        if (! $fonction && $createIfMissing) {
            $fonction = Fonction::query()->create([
                'nom' => 'Marqueur de présence',
                'description' => 'Membre désigné pour la vérification finale des présences de la classe',
            ]);
        }

        return $fonction;
    }

    private function canAccessPresenceModule(User $user, int $classeId): bool
    {
        if ((int) $user->classe_id !== $classeId) {
            return false;
        }

        if ($user->role === 'conducteur') {
            return true;
        }

        $user->loadMissing('fonction');

        return $this->isPresenceMarker($user);
    }

    private function isPresenceMarker(User $user): bool
    {
        $fonctionNom = $this->normalizeLabel((string) ($user->fonction?->nom ?? ''));

        return in_array($fonctionNom, ['marqueur de presence', 'marqueur presence'], true);
    }

    private function normalizeLabel(string $value): string
    {
        $normalized = mb_strtolower(trim($value));

        return strtr($normalized, [
            'é' => 'e',
            'è' => 'e',
            'ê' => 'e',
            'ë' => 'e',
            'à' => 'a',
            'â' => 'a',
            'ù' => 'u',
            'û' => 'u',
            'î' => 'i',
            'ï' => 'i',
            'ô' => 'o',
            'ö' => 'o',
            'ç' => 'c',
        ]);
    }
}
