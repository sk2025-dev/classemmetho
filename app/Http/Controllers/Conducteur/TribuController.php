<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Mail\RappelCotisation;
use App\Models\Cotisation;
use App\Models\Paiement;
use App\Models\Tribu;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TribuController extends Controller
{
    private function guardClasse(): User
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur' || !$user->classe_id) {
            abort(403, 'Accès non autorisé au module tribu.');
        }

        if (!$user->classe?->has_tribus) {
            abort(403, 'Le module tribu n\'est pas activé pour votre classe.');
        }

        return $user;
    }

    public function index()
    {
        $user = $this->guardClasse();
        $classeId = $user->classe_id;

        $tribus = Tribu::query()
            ->where('classe_id', $classeId)
            ->withCount('membres')
            ->with('chefs:id,nom,prenom')
            ->orderBy('nom')
            ->get()
            ->map(fn (Tribu $tribu) => [
                'id' => $tribu->id,
                'nom' => $tribu->nom,
                'description' => $tribu->description ?? '',
                'status' => $tribu->status,
                'membres_count' => $tribu->membres_count,
                'chefs' => self::mapChefs($tribu),
            ]);

        $membresAffectes = User::query()
            ->where('classe_id', $classeId)
            ->whereNotNull('tribu_id')
            ->with('family:id,nom')
            ->get(['id', 'nom', 'prenom', 'family_id', 'genre', 'employment_status', 'date_naissance']);

        $financesClasse = self::buildFinancesDataForMembers($membresAffectes, $classeId);
        $membresAJour = collect($financesClasse)->where('statut', 'A_JOUR')->count();

        return Inertia::render('Conducteur/Tribus', [
            'tribus' => $tribus,
            'classeNom' => $user->classe?->nom,
            'stats' => [
                'nombreTribus' => $tribus->count(),
                'totalMembres' => $membresAffectes->count(),
                'membresAJour' => $membresAJour,
            ],
        ]);
    }

    public function create()
    {
        $user = $this->guardClasse();

        return Inertia::render('Conducteur/TribuCreer', [
            'classeNom' => $user->classe?->nom,
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->guardClasse();

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255', Rule::unique('tribus', 'nom')->where('classe_id', $user->classe_id)],
            'description' => 'nullable|string',
        ]);

        Tribu::create($validated + [
            'classe_id' => $user->classe_id,
            'status' => 'active',
        ]);

        return redirect()
            ->route('conducteur.tribus.index')
            ->with('success', 'Tribu créée avec succès.');
    }

    public function update(Request $request, Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255', Rule::unique('tribus', 'nom')->where('classe_id', $user->classe_id)->ignore($tribu->id)],
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $tribu->update($validated);

        return back()->with('success', 'Tribu mise à jour avec succès.');
    }

    public function destroy(Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        if ($tribu->membres()->count() > 0) {
            return back()->withErrors([
                'error' => 'Impossible de supprimer cette tribu car elle contient encore des membres.',
            ]);
        }

        $tribu->delete();

        return back()->with('success', 'Tribu supprimée avec succès.');
    }

    public function assignMembre(Request $request, Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $membre = User::query()->findOrFail($validated['user_id']);

        if ($membre->classe_id !== $user->classe_id) {
            return back()->withErrors(['error' => 'Ce membre n\'est pas dans votre classe.']);
        }

        if (!in_array($membre->role, ['membre_famille', 'responsable_famille'], true)) {
            return back()->withErrors(['error' => 'Seul un membre de famille peut être affecté à une tribu.']);
        }

        $membre->update(['tribu_id' => $tribu->id]);

        return back()->with('success', 'Membre affecté à la tribu avec succès.');
    }

    public function removeMembre(Request $request, Tribu $tribu, User $user)
    {
        $conducteur = $this->guardClasse();
        $this->authorizeTribu($conducteur, $tribu);

        if ($user->tribu_id !== $tribu->id) {
            return back()->withErrors(['error' => 'Ce membre n\'appartient pas à cette tribu.']);
        }

        $user->update(['tribu_id' => null]);
        $tribu->chefs()->detach($user->id);

        return back()->with('success', 'Membre retiré de la tribu avec succès.');
    }

    public function nommerChef(Request $request, Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $membre = User::query()->findOrFail($validated['user_id']);

        if ($membre->tribu_id !== $tribu->id) {
            return back()->withErrors(['error' => 'Ce membre doit d\'abord appartenir à la tribu pour en devenir le chef.']);
        }

        $dejaChef = $tribu->chefs()->where('user_id', $membre->id)->exists();
        if (!$dejaChef && $tribu->chefs()->count() >= Tribu::MAX_CHEFS) {
            return back()->withErrors([
                'error' => 'Cette tribu a déjà ' . Tribu::MAX_CHEFS . ' chefs. Retirez-en un avant d\'en nommer un nouveau.',
            ]);
        }

        $tribu->chefs()->syncWithoutDetaching([$membre->id]);

        return back()->with('success', 'Chef de tribu nommé avec succès.');
    }

    public function retirerChef(Tribu $tribu, User $user)
    {
        $conducteur = $this->guardClasse();
        $this->authorizeTribu($conducteur, $tribu);

        $tribu->chefs()->detach($user->id);

        return back()->with('success', 'Chef de tribu retiré avec succès.');
    }

    public function finances(Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        return response()->json([
            'success' => true,
            'data' => $this->buildFinancesData($tribu),
        ]);
    }

    /**
     * Page dédiée à une tribu : membres actuels (finances/chef) + affectation
     * de nouveaux membres filtrable par âge, ville et situation professionnelle.
     */
    public function assigner(Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        $classeId = $user->classe_id;

        $tribu->load('chefs:id,nom,prenom');

        return Inertia::render('Conducteur/TribuAssigner', [
            'tribu' => [
                'id' => $tribu->id,
                'nom' => $tribu->nom,
                'description' => $tribu->description ?? '',
                'status' => $tribu->status,
                'chefs' => self::mapChefs($tribu),
            ],
            'membresActuels' => $this->buildFinancesData($tribu),
            'membresAAffecter' => $this->buildMembresAvecCriteres($classeId, $tribu->id),
            'villes' => $this->buildVillesOptions($classeId),
        ]);
    }

    /**
     * Affectation en masse : réaffecte aussi les membres déjà présents
     * dans une autre tribu de la même classe (contrairement à assignMembre).
     */
    public function bulkAssignerMembres(Request $request, Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $count = User::query()
            ->whereIn('id', $validated['user_ids'])
            ->where('classe_id', $user->classe_id)
            ->whereIn('role', ['membre_famille', 'responsable_famille'])
            ->update(['tribu_id' => $tribu->id]);

        return back()->with('success', "$count membre(s) affecté(s) à la tribu avec succès.");
    }

    /**
     * Page générique d'affectation : tous les membres de la classe, filtrables,
     * avec un sélecteur de tribu cible (pas liée à une tribu précise au départ).
     */
    public function affectation()
    {
        $user = $this->guardClasse();
        $classeId = $user->classe_id;

        $tribus = Tribu::query()
            ->where('classe_id', $classeId)
            ->orderBy('nom')
            ->get(['id', 'nom'])
            ->map(fn (Tribu $tribu) => ['id' => $tribu->id, 'nom' => $tribu->nom]);

        return Inertia::render('Conducteur/TribuAffectation', [
            'tribus' => $tribus,
            'membres' => $this->buildMembresAvecCriteres($classeId),
            'villes' => $this->buildVillesOptions($classeId),
            'classeNom' => $user->classe?->nom,
        ]);
    }

    /**
     * Affectation en masse générique : la tribu cible est fournie dans la requête
     * plutôt que dans l'URL (utilisée par la page d'affectation générique).
     */
    public function bulkAssignerMembresGlobal(Request $request)
    {
        $user = $this->guardClasse();

        $validated = $request->validate([
            'tribu_id' => ['required', 'integer', 'exists:tribus,id'],
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $tribu = Tribu::findOrFail($validated['tribu_id']);
        $this->authorizeTribu($user, $tribu);

        $count = User::query()
            ->whereIn('id', $validated['user_ids'])
            ->where('classe_id', $user->classe_id)
            ->whereIn('role', ['membre_famille', 'responsable_famille'])
            ->update(['tribu_id' => $tribu->id]);

        return back()->with('success', "$count membre(s) affecté(s) à {$tribu->nom} avec succès.");
    }

    /**
     * Vue d'ensemble des finances : chaque tribu avec son total collecté/dû,
     * et le détail par membre pour affichage extensible.
     */
    public function financesOverview()
    {
        $user = $this->guardClasse();
        $classeId = $user->classe_id;

        $tribus = Tribu::query()
            ->where('classe_id', $classeId)
            ->withCount('membres')
            ->with('chefs:id,nom,prenom')
            ->orderBy('nom')
            ->get()
            ->map(function (Tribu $tribu) {
                $membres = $this->buildFinancesData($tribu);
                $totalCollecte = collect($membres)->sum('totalPaye');
                $totalDu = collect($membres)->sum('totalDu');

                return [
                    'id' => $tribu->id,
                    'nom' => $tribu->nom,
                    'membres_count' => $tribu->membres_count,
                    'chefs' => self::mapChefs($tribu),
                    'totalCollecte' => $totalCollecte,
                    'totalDu' => $totalDu,
                    'membres' => $membres,
                ];
            });

        return Inertia::render('Conducteur/TribuFinances', [
            'tribus' => $tribus,
            'classeNom' => $user->classe?->nom,
            'stats' => [
                'totalCollecte' => $tribus->sum('totalCollecte'),
                'totalDu' => $tribus->sum('totalDu'),
                'nombreTribus' => $tribus->count(),
            ],
        ]);
    }

    /**
     * Envoie un email de rappel à un membre en retard sur sa cotisation.
     */
    public function relancerMembre(Request $request, User $user)
    {
        $conducteur = $this->guardClasse();

        if ((int) $user->classe_id !== (int) $conducteur->classe_id) {
            return back()->withErrors(['error' => 'Ce membre n\'est pas dans votre classe.']);
        }

        if (empty($user->email)) {
            return back()->withErrors(['error' => 'Ce membre n\'a pas d\'adresse email enregistrée.']);
        }

        $membre = User::query()
            ->where('id', $user->id)
            ->get(['id', 'nom', 'prenom', 'email', 'genre', 'employment_status', 'date_naissance'])
            ->first();

        $finances = self::buildFinancesDataForMembers(new Collection([$membre]), $conducteur->classe_id)[0] ?? null;
        $cotisationsDues = collect($finances['cotisations'] ?? [])->where('du', '>', 0)->values()->all();

        if (empty($cotisationsDues)) {
            return back()->withErrors(['error' => 'Ce membre est déjà à jour, aucun rappel nécessaire.']);
        }

        try {
            Mail::to($membre->email)->send(new RappelCotisation($membre, $cotisationsDues, $finances['totalDu']));
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi du rappel de cotisation', [
                'user_id' => $membre->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Erreur lors de l\'envoi de l\'email : ' . $e->getMessage()]);
        }

        return back()->with('success', "Rappel envoyé à {$membre->email}.");
    }

    /**
     * Envoie un rappel à tous les membres de la classe en retard (statut EN_ATTENTE/EN_COURS).
     */
    public function relancerRetardataires(Request $request)
    {
        $conducteur = $this->guardClasse();
        $classeId = $conducteur->classe_id;

        $membres = User::query()
            ->where('classe_id', $classeId)
            ->whereNotNull('tribu_id')
            ->whereIn('role', ['membre_famille', 'responsable_famille'])
            ->get(['id', 'nom', 'prenom', 'email', 'genre', 'employment_status', 'date_naissance']);

        $finances = collect(self::buildFinancesDataForMembers($membres, $classeId))->keyBy('id');

        $envoyes = 0;
        $sansEmail = 0;

        foreach ($membres as $membre) {
            $f = $finances->get($membre->id);
            if (!$f || !in_array($f['statut'], ['EN_ATTENTE', 'EN_COURS'], true)) {
                continue;
            }

            if (empty($membre->email)) {
                $sansEmail++;
                continue;
            }

            $cotisationsDues = collect($f['cotisations'])->where('du', '>', 0)->values()->all();
            if (empty($cotisationsDues)) {
                continue;
            }

            try {
                Mail::to($membre->email)->send(new RappelCotisation($membre, $cotisationsDues, $f['totalDu']));
                $envoyes++;
            } catch (\Exception $e) {
                Log::error('Erreur lors de l\'envoi du rappel de cotisation (relance groupée)', [
                    'user_id' => $membre->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $message = "$envoyes rappel(s) envoyé(s).";
        if ($sansEmail > 0) {
            $message .= " $sansEmail membre(s) sans adresse email n'ont pas pu être relancé(s).";
        }

        return back()->with('success', $message);
    }

    /**
     * Liste des membres de la classe (avec critères ville/âge/profession/tribu actuelle),
     * en excluant éventuellement les membres déjà dans une tribu donnée.
     */
    private function buildMembresAvecCriteres(int $classeId, ?int $excludeTribuId = null): array
    {
        $membres = User::query()
            ->where('classe_id', $classeId)
            ->whereIn('role', ['membre_famille', 'responsable_famille'])
            ->with(['family:id,adresse,quartier', 'tribu:id,nom'])
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get(['id', 'nom', 'prenom', 'family_id', 'date_naissance', 'employment_status', 'tribu_id']);

        if ($excludeTribuId !== null) {
            $membres = $membres->where('tribu_id', '!==', $excludeTribuId);
        }

        return $membres
            ->map(fn (User $membre) => [
                'id' => $membre->id,
                'nom' => trim($membre->prenom . ' ' . $membre->nom),
                // Même source que le module Annuaire (App\Services\AnnuaireService) :
                // l'adresse est stockée sur la famille, pas sur le membre.
                'ville' => $membre->family?->adresse ?: $membre->family?->quartier,
                'age' => $membre->date_naissance?->age,
                'employment_status' => $membre->employment_status,
                'tribu_actuelle' => $membre->tribu ? [
                    'id' => $membre->tribu->id,
                    'nom' => $membre->tribu->nom,
                ] : null,
            ])
            ->values()
            ->all();
    }

    private static function mapChefs(Tribu $tribu): array
    {
        return $tribu->chefs
            ->map(fn (User $chef) => [
                'id' => $chef->id,
                'nom' => trim($chef->prenom . ' ' . $chef->nom),
            ])
            ->values()
            ->all();
    }

    /**
     * Lieux d'habitation distincts pour le filtre, sourcés depuis Family::adresse
     * (même donnée que le module Annuaire) plutôt que Ville/ville_id, presque jamais renseigné.
     */
    private function buildVillesOptions(int $classeId): array
    {
        return User::query()
            ->where('classe_id', $classeId)
            ->whereIn('role', ['membre_famille', 'responsable_famille'])
            ->with('family:id,adresse,quartier')
            ->get(['id', 'family_id'])
            ->map(fn (User $membre) => $membre->family?->adresse ?: $membre->family?->quartier)
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->map(fn (string $lieu) => ['id' => $lieu, 'nom' => $lieu])
            ->all();
    }

    /**
     * Agrégation des cotisations individuelles payées/dues pour les membres d'une tribu,
     * même logique que Conducteur\TresorerieController (scope classe -> scope tribu).
     */
    public static function buildFinancesData(Tribu $tribu): array
    {
        $membres = $tribu->membres()->with('family:id,nom')->get(['id', 'nom', 'prenom', 'family_id', 'genre', 'employment_status', 'date_naissance']);

        return self::buildFinancesDataForMembers($membres, $tribu->classe_id);
    }

    /**
     * Agrégation des cotisations individuelles payées/dues pour un ensemble de membres donné,
     * réutilisée pour une tribu précise ou pour toute la classe (cartes de statistiques).
     * Le montant de chaque cotisation est résolu PAR MEMBRE via Cotisation::resolveAmountForUser()
     * (règles de ciblage : statut d'emploi, genre, enfant) — pas un montant fixe pour tous.
     */
    public static function buildFinancesDataForMembers(Collection $membres, int $classeId): array
    {
        $memberIds = $membres->pluck('id');

        $cotisationsIndividuelles = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->where('target_scope', Cotisation::TARGET_SCOPE_INDIVIDUELLE)
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $classeId);
            })
            ->get();

        // Paiements groupés par (membre, cotisation) pour le détail par cotisation.
        $paiementsParCotisation = Paiement::query()
            ->select('user_id', 'cotisation_id', DB::raw('SUM(montant) as total_paye'))
            ->whereIn('user_id', $memberIds)
            ->whereIn('cotisation_id', $cotisationsIndividuelles->pluck('id'))
            ->where('statut', Paiement::STATUT_PAYE)
            ->groupBy('user_id', 'cotisation_id')
            ->get()
            ->groupBy('user_id');

        return $membres->map(function (User $membre) use ($paiementsParCotisation, $cotisationsIndividuelles) {
            $paiementsMembre = ($paiementsParCotisation->get($membre->id) ?? collect())
                ->keyBy('cotisation_id');

            $cotisationsDetail = $cotisationsIndividuelles
                ->map(function (Cotisation $cotisation) use ($membre, $paiementsMembre) {
                    $montant = $cotisation->resolveAmountForUser($membre);

                    // La cotisation ne cible pas ce membre (ex: statut d'emploi différent) -> non concerné.
                    if ($montant === null) {
                        return null;
                    }

                    $cotPaye = (int) ($paiementsMembre->get($cotisation->id)?->total_paye ?? 0);
                    $cotDu = max(0, $montant - $cotPaye);

                    return [
                        'nom' => $cotisation->nom,
                        'montant' => $montant,
                        'paye' => $cotPaye,
                        'du' => $cotDu,
                        'statut' => $cotDu === 0 ? 'A_JOUR' : ($cotPaye > 0 ? 'EN_COURS' : 'EN_ATTENTE'),
                    ];
                })
                ->filter()
                ->values();

            $cotisationTotal = (int) $cotisationsDetail->sum('montant');
            $paid = (int) $cotisationsDetail->sum('paye');
            $due = max(0, $cotisationTotal - $paid);

            if ($cotisationsDetail->isEmpty()) {
                $statut = 'AUCUNE_DONNEE';
            } elseif ($due === 0) {
                $statut = 'A_JOUR';
            } elseif ($paid > 0) {
                $statut = 'EN_COURS';
            } else {
                $statut = 'EN_ATTENTE';
            }

            return [
                'id' => $membre->id,
                'nom' => trim(($membre->prenom ?? '') . ' ' . ($membre->nom ?? '')),
                'famille' => $membre->family?->nom ?? 'Sans famille',
                'cotisation' => $cotisationTotal,
                'cotisations' => $cotisationsDetail->all(),
                'totalPaye' => $paid,
                'totalDu' => $due,
                'statut' => $statut,
            ];
        })->values()->all();
    }

    private function authorizeTribu(User $user, Tribu $tribu): void
    {
        if ($tribu->classe_id !== $user->classe_id) {
            abort(403, 'Cette tribu n\'appartient pas à votre classe.');
        }
    }
}
