<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Mail\RappelCotisation;
use App\Models\Cotisation;
use App\Models\Paiement;
use App\Models\Presence;
use App\Models\SpecialEvent;
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

        if (!in_array($membre->role, ['membre_famille', 'responsable_famille', 'conducteur'], true)) {
            return back()->withErrors(['error' => 'Ce membre ne peut pas être affecté à une tribu.']);
        }

        if ($membre->is_nouveau) {
            return back()->withErrors(['error' => 'Ce membre est encore en suivi (nouveau) et ne peut pas être affecté à une tribu.']);
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
            'membresActuels' => $this->buildMembresActuelsProfil($tribu),
            'membresAAffecter' => self::buildMembresAvecCriteres($classeId, $tribu->id),
            'villes' => self::buildVillesOptions($classeId),
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
            ->whereIn('role', ['membre_famille', 'responsable_famille', 'conducteur'])
            ->where('is_nouveau', false)
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
            'membres' => self::buildMembresAvecCriteres($classeId),
            'villes' => self::buildVillesOptions($classeId),
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
            ->whereIn('role', ['membre_famille', 'responsable_famille', 'conducteur'])
            ->where('is_nouveau', false)
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

        $nombreCotisations = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->where('target_scope', Cotisation::TARGET_SCOPE_INDIVIDUELLE)
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $classeId);
            })
            ->count();

        return Inertia::render('Conducteur/TribuFinances', [
            'tribus' => $tribus,
            'classeNom' => $user->classe?->nom,
            'stats' => [
                'totalCollecte' => $tribus->sum('totalCollecte'),
                'totalDu' => $tribus->sum('totalDu'),
                'nombreTribus' => $tribus->count(),
                'nombreCotisations' => $nombreCotisations,
            ],
        ]);
    }

    /**
     * Envoie un email de rappel à un membre en retard sur sa cotisation.
     */
    public function relancerMembre(Request $request, User $user)
    {
        $conducteur = $this->guardClasse();

        $validated = $request->validate([
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

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
            Mail::to($membre->email)->send(new RappelCotisation($membre, $cotisationsDues, $finances['totalDu'], $validated['message'] ?? null, $finances['totalPaye']));
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

        $validated = $request->validate([
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

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
                Mail::to($membre->email)->send(new RappelCotisation($membre, $cotisationsDues, $f['totalDu'], $validated['message'] ?? null, $f['totalPaye']));
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
    public static function buildMembresAvecCriteres(int $classeId, ?int $excludeTribuId = null): array
    {
        $membres = User::query()
            ->where('classe_id', $classeId)
            ->whereIn('role', ['membre_famille', 'responsable_famille', 'conducteur'])
            // Un nouveau membre en suivi (< 3 mois) ne peut pas encore être affecté à une tribu.
            ->where('is_nouveau', false)
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
    public static function buildVillesOptions(int $classeId): array
    {
        return User::query()
            ->where('classe_id', $classeId)
            ->whereIn('role', ['membre_famille', 'responsable_famille', 'conducteur'])
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
     * Profil complet des membres actuels d'une tribu (identité, contact, fonction,
     * sacrements) — même jeu de champs que l'Annuaire, sans les données financières.
     */
    public static function buildMembresActuelsProfil(Tribu $tribu): array
    {
        $membres = $tribu->membres()
            ->with(['family:id,code_famille,nom', 'fonction:id,nom', 'sacrements', 'classe:id,nom'])
            ->get([
                'id', 'nom', 'prenom', 'email', 'telephone', 'genre', 'role',
                'fonction_id', 'family_id', 'code_membre', 'photo_path', 'profile_photo_url',
                'classe_id', 'date_naissance', 'relation', 'profession', 'employment_status',
                'lieu_naissance', 'numero_cni', 'hors_communaute', 'retrait', 'date_retrait', 'status',
            ]);

        return $membres->map(function (User $membre) {
            $sacrements = $membre->sacrements;
            $statutMarital = 'Célibataire';
            if ($sacrements) {
                if ($sacrements->est_marie) $statutMarital = 'Marié(e)';
                elseif ($sacrements->est_divorce) $statutMarital = 'Divorcé(e)';
                elseif ($sacrements->est_veuf) $statutMarital = 'Veuf(ve)';
                elseif ($sacrements->dot_effectue) $statutMarital = 'Doté(e)';
            }

            return [
                'id' => $membre->id,
                'nom' => $membre->nom,
                'prenom' => $membre->prenom,
                'photo_path' => $membre->photo_path,
                'profile_photo_url' => $membre->profile_photo_url,
                'code_membre' => $membre->code_membre,
                'code_famille' => $membre->family?->code_famille,
                'famille' => $membre->family?->nom ?? 'Sans famille',
                'classe' => $membre->classe?->nom,
                'email' => $membre->email,
                'telephone' => $membre->telephone,
                'genre' => $membre->genre,
                'role' => $membre->role,
                'fonction' => $membre->fonction?->nom,
                'baptise' => (bool) $sacrements?->baptise,
                'premiere_communion' => (bool) $sacrements?->premiere_communion,
                'statut_marital' => $statutMarital,
                'date_naissance' => optional($membre->date_naissance)->format('Y-m-d'),
                'relation' => $membre->relation,
                'profession' => $membre->profession,
                'employment_status' => $membre->employment_status,
                'lieu_naissance' => $membre->lieu_naissance,
                'numero_cni' => $membre->numero_cni,
                'hors_communaute' => (bool) $membre->hors_communaute,
                'retrait' => (bool) $membre->retrait,
                'date_retrait' => optional($membre->date_retrait)->format('Y-m-d'),
                'is_active' => $membre->status === 'active',
            ];
        })->values()->all();
    }

    /**
     * Agrégation des cotisations individuelles payées/dues pour les membres d'une tribu,
     * même logique que Conducteur\TresorerieController (scope classe -> scope tribu).
     */
    public static function buildFinancesData(Tribu $tribu): array
    {
        $membres = $tribu->membres()->with('family:id,nom')->get(['id', 'nom', 'prenom', 'email', 'telephone', 'family_id', 'genre', 'employment_status', 'date_naissance']);

        return self::buildFinancesDataForMembers($membres, $tribu->classe_id);
    }

    /**
     * Historique des paiements réglés par les membres d'une tribu (toutes cotisations
     * individuelles confondues), du plus récent au plus ancien.
     */
    public static function buildHistoriquePaiements(Tribu $tribu): array
    {
        $memberIds = $tribu->membres()->pluck('id');

        return Paiement::query()
            ->whereIn('user_id', $memberIds)
            ->where('statut', Paiement::STATUT_PAYE)
            ->with(['user:id,nom,prenom', 'cotisation:id,nom'])
            ->orderByDesc('date_paiement')
            ->get()
            ->map(fn (Paiement $p) => [
                'id' => $p->id,
                'membre_id' => $p->user_id,
                'membre' => trim(($p->user->prenom ?? '') . ' ' . ($p->user->nom ?? '')),
                'cotisation' => $p->cotisation?->nom ?? '-',
                'montant' => (int) $p->montant,
                'mode' => $p->mode_paiement,
                'date' => optional($p->date_paiement)->format('d/m/Y'),
            ])
            ->values()
            ->all();
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

        // Versements individuels (pour le détail chronologique par membre : date, montant, cotisation).
        $paiementsDetail = Paiement::query()
            ->whereIn('user_id', $memberIds)
            ->whereIn('cotisation_id', $cotisationsIndividuelles->pluck('id'))
            ->where('statut', Paiement::STATUT_PAYE)
            ->with('cotisation:id,nom')
            ->orderByDesc('date_paiement')
            ->get(['id', 'user_id', 'cotisation_id', 'montant', 'mode_paiement', 'date_paiement'])
            ->groupBy('user_id');

        return $membres->map(function (User $membre) use ($paiementsParCotisation, $paiementsDetail, $cotisationsIndividuelles) {
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

            $paiementsListe = ($paiementsDetail->get($membre->id) ?? collect())
                ->map(fn (Paiement $p) => [
                    'id' => $p->id,
                    'cotisation' => $p->cotisation?->nom ?? '-',
                    'montant' => (int) $p->montant,
                    'mode' => $p->mode_paiement,
                    'date' => optional($p->date_paiement)->format('d/m/Y'),
                ])
                ->values()
                ->all();

            return [
                'id' => $membre->id,
                'nom' => trim(($membre->prenom ?? '') . ' ' . ($membre->nom ?? '')),
                'prenom' => $membre->prenom,
                'email' => $membre->email,
                'telephone' => $membre->telephone,
                'famille' => $membre->family?->nom ?? 'Sans famille',
                'cotisation' => $cotisationTotal,
                'cotisations' => $cotisationsDetail->all(),
                'paiements' => $paiementsListe,
                'totalPaye' => $paid,
                'totalDu' => $due,
                'statut' => $statut,
            ];
        })->values()->all();
    }

    /**
     * Suivi des présences des membres d'une tribu aux activités (SpecialEvent) de la classe.
     * Vue de consultation uniquement : lit les présences déjà enregistrées via le module
     * QR existant (PresenceConducteurController/Api\PresenceController), sans marquage manuel.
     */
    public function presences(Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        $membres = $tribu->membres()->orderBy('nom')->orderBy('prenom')->get(['id', 'nom', 'prenom']);

        return Inertia::render('Conducteur/TribuPresences', [
            'tribu' => [
                'id' => $tribu->id,
                'nom' => $tribu->nom,
            ],
            ...self::buildPresencesPageData($tribu->classe_id, $membres),
        ]);
    }

    /**
     * Données de la page "Suivi des présences" pour un ensemble de membres donné
     * (activités + statistiques + journal de pointage) — réutilisable pour la vue
     * conducteur comme pour la vue chef de tribu (MembreFamille).
     */
    public static function buildPresencesPageData(int $classeId, \Illuminate\Support\Collection $membres): array
    {
        $activites = self::fetchActivitesClasse($classeId);
        $presenceIndex = self::buildPresenceIndex($activites->pluck('id'), $membres->pluck('id'));

        return [
            'activites' => self::buildActivitesPresenceStats($activites, $membres->pluck('id'), $presenceIndex),
            'membres' => self::buildMembresPresenceData($membres, $activites, $presenceIndex),
            'pointages' => self::buildPointagesLog($membres, $activites, $presenceIndex),
        ];
    }

    /**
     * Vue d'ensemble des présences : toutes les tribus de la classe, chacune avec le
     * détail de présence de ses membres, plus un taux moyen global.
     */
    public function presencesOverview()
    {
        $user = $this->guardClasse();
        $classeId = $user->classe_id;

        $activitesRaw = self::fetchActivitesClasse($classeId);

        $tribus = Tribu::query()
            ->where('classe_id', $classeId)
            ->with('chefs:id,nom,prenom')
            ->orderBy('nom')
            ->get();

        $tousMembres = User::query()
            ->where('classe_id', $classeId)
            ->whereNotNull('tribu_id')
            ->orderBy('nom')->orderBy('prenom')
            ->get(['id', 'nom', 'prenom', 'tribu_id']);

        $presenceIndex = self::buildPresenceIndex($activitesRaw->pluck('id'), $tousMembres->pluck('id'));
        $tribuNomById = $tribus->pluck('nom', 'id');
        $membreTribuId = $tousMembres->pluck('tribu_id', 'id');
        $chefIds = $tribus->flatMap(fn (Tribu $t) => collect($t->chefs)->pluck('id'))->unique()->all();

        $activites = self::buildActivitesPresenceStats($activitesRaw, $tousMembres->pluck('id'), $presenceIndex);

        $membresData = self::buildMembresPresenceData($tousMembres, $activitesRaw, $presenceIndex)
            ->map(function (array $m) use ($membreTribuId, $tribuNomById) {
                $tribuId = $membreTribuId->get($m['id']);
                $m['tribuId'] = $tribuId;
                $m['tribuNom'] = $tribuNomById->get($tribuId) ?? '-';
                return $m;
            })
            ->values();

        $avecTaux = $membresData->filter(fn (array $m) => $m['taux'] !== null);
        $tauxMoyen = $avecTaux->count() > 0 ? (int) round($avecTaux->avg('taux')) : null;

        $pointages = collect(self::buildPointagesLog($tousMembres, $activitesRaw, $presenceIndex))
            ->map(function (array $p) use ($membreTribuId, $tribuNomById, $chefIds) {
                $tribuId = $membreTribuId->get($p['membre_id']);
                $p['tribuId'] = $tribuId;
                $p['tribuNom'] = $tribuNomById->get($tribuId) ?? '-';
                $p['estChef'] = in_array($p['membre_id'], $chefIds, true);
                return $p;
            })
            ->values();

        return Inertia::render('Conducteur/TribuPresencesOverview', [
            'classeNom' => $user->classe?->nom,
            'tribus' => $tribus->map(fn (Tribu $t) => ['id' => $t->id, 'nom' => $t->nom])->values(),
            'activites' => $activites,
            'membres' => $membresData,
            'pointages' => $pointages,
            'stats' => [
                'tauxMoyen' => $tauxMoyen,
                'nombreActivites' => $activitesRaw->count(),
                'nombreMembres' => $tousMembres->count(),
                'nombreTribus' => $tribus->count(),
            ],
        ]);
    }

    /**
     * Activités (SpecialEvent) non paroissiales de la classe, servant de base au
     * suivi des présences par tribu.
     */
    private static function fetchActivitesClasse(int $classeId): Collection
    {
        return SpecialEvent::query()
            ->where('class_id', $classeId)
            ->where('is_parish', false)
            ->orderByDesc('start_date')
            ->get(['id', 'title', 'start_date', 'end_date', 'start_time', 'end_time', 'lieu']);
    }

    /**
     * Index [special_event_id => [membre_id => statut]] pour un ensemble d'activités/membres.
     */
    private static function buildPresenceIndex(\Illuminate\Support\Collection $activiteIds, \Illuminate\Support\Collection $memberIds): \Illuminate\Support\Collection
    {
        return Presence::query()
            ->whereIn('special_event_id', $activiteIds)
            ->whereIn('membre_famille_id', $memberIds)
            ->get(['special_event_id', 'membre_famille_id', 'statut', 'marquee_le', 'justifiee', 'motif_justification', 'motif_justification_detail'])
            ->groupBy('special_event_id')
            ->map(fn (Collection $rows) => $rows->keyBy('membre_famille_id'));
    }

    /**
     * Statistiques présents/absents/en attente par activité, pour un ensemble de membres donné.
     */
    private static function buildActivitesPresenceStats(Collection $activites, \Illuminate\Support\Collection $memberIds, \Illuminate\Support\Collection $presenceIndex): \Illuminate\Support\Collection
    {
        $now = now();

        return $activites->map(function (SpecialEvent $event) use ($presenceIndex, $memberIds, $now) {
            $rows = $presenceIndex->get($event->id, new Collection());
            $isCloture = $now->greaterThanOrEqualTo(self::resolveEventEndAt($event));

            $presents = 0;
            $absents = 0;
            $enAttente = 0;
            foreach ($memberIds as $id) {
                $statut = $rows->get($id)?->statut;
                if ($statut === 'present') {
                    $presents++;
                } elseif ($statut === 'absent' || $isCloture) {
                    $absents++;
                } else {
                    $enAttente++;
                }
            }

            $dateDebut = optional($event->start_date)->format('d/m/Y');
            $dateFin = optional($event->end_date)->format('d/m/Y');

            return [
                'id' => $event->id,
                'titre' => $event->title,
                'date' => $dateDebut,
                'dateFin' => ($dateFin && $dateFin !== $dateDebut) ? $dateFin : null,
                'heure' => self::formatEventHeureRange($event),
                'lieu' => $event->lieu,
                'estCloture' => $isCloture,
                'presents' => $presents,
                'absents' => $absents,
                'enAttente' => $enAttente,
            ];
        })->values();
    }

    /**
     * Détail de présence par membre (statut par activité + taux global), pour un ensemble
     * de membres et d'activités donné — réutilisé pour une tribu ou pour toute la classe.
     */
    private static function buildMembresPresenceData(\Illuminate\Support\Collection $membres, Collection $activites, \Illuminate\Support\Collection $presenceIndex): \Illuminate\Support\Collection
    {
        $now = now();

        return $membres->map(function (User $membre) use ($presenceIndex, $activites, $now) {
            $totalPresent = 0;
            $totalCloture = 0;
            $detail = [];

            foreach ($activites as $event) {
                $rows = $presenceIndex->get($event->id, new Collection());
                $row = $rows->get($membre->id);
                $isCloture = $now->greaterThanOrEqualTo(self::resolveEventEndAt($event));
                $statut = $row?->statut ?? ($isCloture ? 'absent' : null);

                if ($statut === 'present') {
                    $totalPresent++;
                }
                if ($isCloture) {
                    $totalCloture++;
                }

                $detail[] = [
                    'activite_id' => $event->id,
                    'statut' => $statut,
                    'justifiee' => (bool) ($row->justifiee ?? false),
                    'motifJustification' => $row->motif_justification ?? null,
                    'motifJustificationDetail' => $row->motif_justification_detail ?? null,
                ];
            }

            return [
                'id' => $membre->id,
                'nom' => trim(($membre->prenom ?? '') . ' ' . ($membre->nom ?? '')),
                'presences' => $detail,
                'totalPresent' => $totalPresent,
                'totalCloture' => $totalCloture,
                'taux' => $totalCloture > 0 ? (int) round(($totalPresent / $totalCloture) * 100) : null,
            ];
        })->values();
    }

    /**
     * Journal de pointage à plat (une ligne par membre × activité) : Présent dès qu'un
     * pointage existe, Absent une fois l'heure de fin de l'activité passée sans pointage,
     * sinon "Aucun pointage" tant que l'activité est encore en cours.
     */
    private static function buildPointagesLog(\Illuminate\Support\Collection $membres, Collection $activites, \Illuminate\Support\Collection $presenceIndex): array
    {
        $log = [];
        $now = now();

        foreach ($membres as $membre) {
            foreach ($activites as $event) {
                $rows = $presenceIndex->get($event->id, new Collection());
                $row = $rows->get($membre->id);
                $estPresent = $row?->statut === 'present';
                $isCloture = $now->greaterThanOrEqualTo(self::resolveEventEndAt($event));

                if ($estPresent) {
                    $statut = 'present';
                } elseif ($isCloture) {
                    $statut = 'absent';
                } else {
                    $statut = 'aucun_pointage';
                }

                $log[] = [
                    'membre_id' => $membre->id,
                    'membre_nom' => trim(($membre->prenom ?? '') . ' ' . ($membre->nom ?? '')),
                    'activite_id' => $event->id,
                    'activite_titre' => $event->title,
                    'activite_date' => optional($event->start_date)->format('d/m/Y'),
                    'activite_heure' => self::formatEventHeureRange($event),
                    'statut' => $statut,
                    'pointe_le' => $row?->marquee_le ? \Carbon\Carbon::parse($row->marquee_le)->format('d/m/Y H:i') : null,
                    'justifiee' => (bool) ($row->justifiee ?? false),
                    'motifJustification' => $row->motif_justification ?? null,
                    'motifJustificationDetail' => $row->motif_justification_detail ?? null,
                ];
            }
        }

        return $log;
    }

    private static function resolveEventEndAt(SpecialEvent $event): \Carbon\Carbon
    {
        $end = \Carbon\Carbon::parse($event->end_date ?? $event->start_date);

        if (!empty($event->end_time)) {
            $t = \Carbon\Carbon::parse($event->end_time);
            $end->setTime($t->hour, $t->minute, $t->second);
        } elseif (!empty($event->start_time)) {
            $t = \Carbon\Carbon::parse($event->start_time);
            $end->setTime($t->hour, $t->minute, $t->second);
        } else {
            $end->setTime(23, 59, 59);
        }

        return $end;
    }

    private static function formatEventHeureRange(SpecialEvent $event): ?string
    {
        $debut = $event->start_time ? \Carbon\Carbon::parse($event->start_time)->format('H:i') : null;
        $fin = $event->end_time ? \Carbon\Carbon::parse($event->end_time)->format('H:i') : null;

        if ($debut && $fin) {
            return "$debut → $fin";
        }

        return $debut ?: null;
    }

    private function authorizeTribu(User $user, Tribu $tribu): void
    {
        if ($tribu->classe_id !== $user->classe_id) {
            abort(403, 'Cette tribu n\'appartient pas à votre classe.');
        }
    }
}
