<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\Fonction;
use App\Models\Paiement;
use App\Models\Presence;
use App\Models\SpecialEvent;
use App\Models\Tribu;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NouveauxController extends Controller
{
    private const SUIVI_DUREE_JOURS = 90;

    public function index()
    {
        $user = Auth::user();
        $classe = $user->classe;

        if (!$classe) {
            return redirect()->back()->with('error', 'Aucune classe associee a votre compte.');
        }

        $nouveaux = User::query()
            ->where('classe_id', $classe->id)
            ->where('is_nouveau', true)
            ->with('family:id,nom')
            ->orderByDesc('nouveau_depuis')
            ->get();

        $nouveauxIds = $nouveaux->pluck('id');

        // Activités de la classe, pour calculer un taux de présence par nouveau
        // (uniquement les activités survenues depuis son entrée en suivi).
        $activites = SpecialEvent::query()
            ->where('class_id', $classe->id)
            ->where('is_parish', false)
            ->get(['id', 'start_date']);

        $presencesParMembre = Presence::query()
            ->whereIn('membre_famille_id', $nouveauxIds)
            ->where('statut', 'present')
            ->get(['membre_famille_id', 'special_event_id'])
            ->groupBy('membre_famille_id');

        $paiementsParMembre = Paiement::query()
            ->select('user_id', \Illuminate\Support\Facades\DB::raw('SUM(montant) as total'))
            ->whereIn('user_id', $nouveauxIds)
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $nouveauxData = $nouveaux->map(function (User $membre) use ($activites, $presencesParMembre, $paiementsParMembre) {
            $depuis = $membre->nouveau_depuis;
            $joursEcoules = $depuis ? $depuis->diffInDays(now()) : 0;
            $joursRestants = max(0, self::SUIVI_DUREE_JOURS - $joursEcoules);

            $activitesDepuis = $depuis
                ? $activites->filter(fn (SpecialEvent $e) => $e->start_date && $e->start_date->gte($depuis))
                : $activites;

            $nbActivites = $activitesDepuis->count();
            $nbPresences = ($presencesParMembre->get($membre->id) ?? collect())
                ->whereIn('special_event_id', $activitesDepuis->pluck('id'))
                ->count();

            $tauxPresence = $nbActivites > 0 ? round(($nbPresences / $nbActivites) * 100) : null;

            return [
                'id' => $membre->id,
                'nom' => trim(($membre->prenom ?? '') . ' ' . ($membre->nom ?? '')),
                'famille' => $membre->family?->nom ?? 'Sans famille',
                'telephone' => $membre->telephone,
                'email' => $membre->email,
                'photo_url' => \App\Helpers\PhotoHelper::getPhotoUrl($membre->photo_path, $membre->prenom, $membre->nom),
                'nouveau_depuis' => $depuis?->format('Y-m-d'),
                'jours_restants' => $joursRestants,
                'suivi_termine' => $joursRestants === 0,
                'nb_activites' => $nbActivites,
                'nb_presences' => $nbPresences,
                'taux_presence' => $tauxPresence,
                'montant_cotise' => (int) ($paiementsParMembre[$membre->id] ?? 0),
            ];
        })->values();

        $gestionnaireFonction = $this->getGestionnaireNouveauxFunction(false);
        $gestionnaireActuel = $gestionnaireFonction
            ? User::query()
                ->where('classe_id', $classe->id)
                ->where('fonction_id', $gestionnaireFonction->id)
                ->with('family:id,nom')
                ->first()
            : null;

        $membresClasseAssignables = User::query()
            ->where('classe_id', $classe->id)
            ->with('family:id,nom')
            ->get()
            ->map(fn (User $m) => [
                'id' => $m->id,
                'nom' => trim(($m->prenom ?? '') . ' ' . ($m->nom ?? '')),
                'role' => $m->role,
                'famille' => $m->family?->nom ?? 'Sans famille',
            ]);

        $tribus = $classe->has_tribus
            ? Tribu::query()->where('classe_id', $classe->id)->orderBy('nom')->get(['id', 'nom'])
            : collect();

        return Inertia::render('Conducteur/Nouveaux/Index', [
            'classe' => ['id' => $classe->id, 'nom' => $classe->nom, 'has_tribus' => (bool) $classe->has_tribus],
            'nouveaux' => $nouveauxData,
            'gestionnaireNouveaux' => $gestionnaireActuel ? [
                'id' => $gestionnaireActuel->id,
                'nom' => trim(($gestionnaireActuel->prenom ?? '') . ' ' . ($gestionnaireActuel->nom ?? '')),
                'famille' => $gestionnaireActuel->family?->nom ?? 'Sans famille',
            ] : null,
            'membresClasseAssignables' => $membresClasseAssignables,
            'tribus' => $tribus,
        ]);
    }

    public function assignGestionnaire(Request $request): JsonResponse
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            return response()->json(['message' => 'Seul le conducteur peut assigner un gestionnaire des nouveaux.'], 403);
        }
        if (!$user->classe_id) {
            return response()->json(['message' => 'Conducteur sans classe associee.'], 422);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $membre = User::query()->findOrFail($validated['user_id']);
        if ((int) $membre->classe_id !== (int) $user->classe_id) {
            return response()->json(['message' => 'Ce membre n\'est pas dans votre classe.'], 403);
        }

        $fonction = $this->getGestionnaireNouveauxFunction();

        User::query()
            ->where('classe_id', $user->classe_id)
            ->where('fonction_id', $fonction->id)
            ->where('id', '!=', $membre->id)
            ->update(['fonction_id' => null]);

        $membre->update(['fonction_id' => $fonction->id]);
        $membre->load('family');

        return response()->json([
            'message' => 'Gestionnaire des nouveaux assigné avec succès.',
            'data' => [
                'id' => $membre->id,
                'nom' => trim(($membre->prenom ?? '') . ' ' . ($membre->nom ?? '')),
                'famille' => $membre->family?->nom ?? 'Sans famille',
            ],
        ]);
    }

    public function unassignGestionnaire(Request $request): JsonResponse
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur') {
            return response()->json(['message' => 'Seul le conducteur peut retirer le gestionnaire des nouveaux.'], 403);
        }
        if (!$user->classe_id) {
            return response()->json(['message' => 'Conducteur sans classe associee.'], 422);
        }

        $fonction = $this->getGestionnaireNouveauxFunction(false);
        if (!$fonction) {
            return response()->json(['message' => 'Aucun gestionnaire assigné pour cette classe.'], 422);
        }

        $membre = User::query()
            ->where('classe_id', $user->classe_id)
            ->where('fonction_id', $fonction->id)
            ->first();

        if (!$membre) {
            return response()->json(['message' => 'Aucun gestionnaire assigné pour cette classe.'], 404);
        }

        $membre->update(['fonction_id' => null]);

        return response()->json(['message' => 'Gestionnaire des nouveaux retiré avec succès.']);
    }

    /**
     * Intègre un nouveau membre : lève les restrictions (tribu, carte virtuelle) en
     * désactivant son statut "en suivi", et l'affecte éventuellement à une tribu.
     */
    public function integrer(Request $request, User $membre): JsonResponse
    {
        $user = Auth::user();

        if (!$this->canManageNouveaux($user)) {
            return response()->json(['message' => 'Action reservee au conducteur ou au gestionnaire des nouveaux.'], 403);
        }

        if ((int) $membre->classe_id !== (int) $user->classe_id) {
            return response()->json(['message' => 'Ce membre n\'est pas dans votre classe.'], 403);
        }

        if (!$membre->is_nouveau) {
            return response()->json(['message' => 'Ce membre est déjà intégré.'], 422);
        }

        $validated = $request->validate([
            'tribu_id' => ['nullable', 'integer', 'exists:tribus,id'],
        ]);

        $updates = [
            'is_nouveau' => false,
            'nouveau_integre_le' => now(),
        ];

        if (!empty($validated['tribu_id'])) {
            $tribu = Tribu::query()->find($validated['tribu_id']);
            if ($tribu && (int) $tribu->classe_id === (int) $user->classe_id) {
                $updates['tribu_id'] = $tribu->id;
            }
        }

        $membre->update($updates);

        return response()->json([
            'message' => 'Membre intégré avec succès à la classe.',
            'data' => ['id' => $membre->id],
        ]);
    }

    private function getGestionnaireNouveauxFunction(bool $createIfMissing = true): ?Fonction
    {
        $fonction = Fonction::query()
            ->whereRaw('LOWER(nom) = ?', ['gestionnaire des nouveaux'])
            ->first();

        if (!$fonction && $createIfMissing) {
            $fonction = Fonction::query()->create([
                'nom' => 'Gestionnaire des nouveaux',
                'description' => 'Membre désigné pour le suivi des nouveaux membres de la classe',
            ]);
        }

        return $fonction;
    }

    private function canManageNouveaux(User $user): bool
    {
        if (!$user->classe_id) {
            return false;
        }

        if ($user->role === 'conducteur') {
            return true;
        }

        $user->loadMissing('fonction');
        $fonctionNom = mb_strtolower(trim((string) ($user->fonction?->nom ?? '')));

        return $fonctionNom === 'gestionnaire des nouveaux';
    }
}
