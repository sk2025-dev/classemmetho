<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Conducteur\TribuController as ConducteurTribuController;
use App\Mail\RappelCotisation;
use App\Models\Presence;
use App\Models\SpecialEvent;
use App\Models\Tribu;
use App\Models\TribuTransfertDemande;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class TribuController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $user->loadMissing('classe', 'tribu.chefs', 'tribu.membres');

        if (!$user->classe?->has_tribus) {
            abort(403, 'Le module tribu n\'est pas activé pour votre classe.');
        }

        $tribu = $user->tribu;

        if (!$tribu) {
            return Inertia::render('MembreFamille/Tribu', [
                'tribu' => null,
            ]);
        }

        $isTribuChef = $tribu->chefs->contains('id', $user->id);

        // Le chef voit le profil complet de tous les membres de sa tribu (hors
        // lui-même). Un membre ordinaire ne voit que les membres de sa propre
        // famille (même logique qu'un responsable de famille consultant ses
        // membres de famille).
        if ($isTribuChef) {
            $membres = collect(ConducteurTribuController::buildMembresActuelsProfil($tribu))
                ->reject(fn (array $membre) => $membre['id'] === $user->id)
                ->values();
        } else {
            $membresFamille = $user->family_id
                ? User::query()->where('family_id', $user->family_id)->orderBy('nom')->orderBy('prenom')->get()
                : collect([$user]);
            $membres = $membresFamille->map(fn (User $membre) => [
                'id' => $membre->id,
                'nom' => trim($membre->prenom . ' ' . $membre->nom),
            ])->values();
        }

        $autresTribus = self::buildAutresTribusOptions($tribu);

        $demandeEnCours = TribuTransfertDemande::query()
            ->where('membre_id', $user->id)
            ->whereIn('statut', TribuTransfertDemande::STATUTS_EN_ATTENTE)
            ->with(['tribuOrigine:id,nom', 'tribuDestination:id,nom'])
            ->latest()
            ->first();

        $demandesRecues = $isTribuChef ? self::buildDemandesRecues($tribu) : [];

        return Inertia::render('MembreFamille/Tribu', [
            'basePath' => self::basePath($user),
            'tribu' => [
                'id' => $tribu->id,
                'nom' => $tribu->nom,
                'description' => $tribu->description ?? '',
                'chefs' => $tribu->chefs->map(fn ($chef) => [
                    'id' => $chef->id,
                    'nom' => trim($chef->prenom . ' ' . $chef->nom),
                ])->values(),
                'membres' => $membres,
            ],
            'isTribuChef' => $isTribuChef,
            'membresScope' => $isTribuChef ? 'tribu' : 'famille',
            'autresTribus' => $autresTribus,
            'demandeEnCours' => $demandeEnCours ? [
                'id' => $demandeEnCours->id,
                'tribuOrigine' => $demandeEnCours->tribuOrigine?->nom,
                'tribuDestination' => $demandeEnCours->tribuDestination?->nom,
                'etape' => $demandeEnCours->statut === TribuTransfertDemande::STATUT_EN_ATTENTE_ORIGINE
                    ? 'depart'
                    : 'accueil',
                'motif' => $demandeEnCours->motif,
                'date' => $demandeEnCours->created_at?->format('d/m/Y à H:i'),
            ] : null,
            'demandesRecues' => $demandesRecues,
        ]);
    }

    /**
     * Demande de transfert vers une autre tribu de la classe — soit pour
     * soi-même (membre ordinaire), soit, si l'auteur est chef de tribu, au nom
     * d'un membre de sa tribu.
     *
     * Un membre ordinaire qui demande son propre transfert doit d'abord
     * obtenir la validation du chef de sa tribu actuelle (départ), puis celle
     * du chef de la tribu de destination (accueil). Un chef qui initie la
     * demande au nom d'un membre de sa tribu fait déjà office de validation
     * du départ : la demande passe directement à l'étape "accueil".
     */
    public function demanderTransfert(Request $request)
    {
        $user = Auth::user();
        $user->loadMissing('classe', 'tribu.chefs');

        if (!$user->classe?->has_tribus) {
            abort(403, 'Le module tribu n\'est pas activé pour votre classe.');
        }

        $tribu = $user->tribu;

        if (!$tribu) {
            return back()->withErrors(['error' => 'Vous n\'appartenez pas encore à une tribu.']);
        }

        $validated = $request->validate([
            'tribu_id' => ['required', 'integer', 'exists:tribus,id'],
            'motif' => ['nullable', 'string', 'max:500'],
            'membre_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $isChef = $tribu->chefs->contains('id', $user->id);
        $membre = $user;

        if (!empty($validated['membre_id']) && (int) $validated['membre_id'] !== (int) $user->id) {
            if (!$isChef) {
                abort(403, 'Seul le chef de tribu peut demander un transfert au nom d\'un autre membre.');
            }

            $membre = User::findOrFail($validated['membre_id']);

            if ((int) $membre->tribu_id !== (int) $tribu->id) {
                return back()->withErrors(['error' => 'Ce membre ne fait pas partie de votre tribu.']);
            }
        }

        $tribuCible = Tribu::query()->findOrFail($validated['tribu_id']);

        if ((int) $tribuCible->classe_id !== (int) $tribu->classe_id) {
            return back()->withErrors(['error' => 'La tribu de destination n\'appartient pas à votre classe.']);
        }

        if ((int) $tribuCible->id === (int) $tribu->id) {
            return back()->withErrors(['error' => 'Ce membre est déjà dans cette tribu.']);
        }

        $dejaEnAttente = TribuTransfertDemande::query()
            ->where('membre_id', $membre->id)
            ->whereIn('statut', TribuTransfertDemande::STATUTS_EN_ATTENTE)
            ->exists();

        if ($dejaEnAttente) {
            return back()->withErrors(['error' => 'Une demande de transfert est déjà en attente pour ce membre.']);
        }

        $etapeInitiale = $isChef
            ? TribuTransfertDemande::STATUT_EN_ATTENTE_DESTINATION
            : TribuTransfertDemande::STATUT_EN_ATTENTE_ORIGINE;

        TribuTransfertDemande::create([
            'membre_id' => $membre->id,
            'demandeur_id' => $user->id,
            'tribu_origine_id' => $tribu->id,
            'tribu_destination_id' => $tribuCible->id,
            'statut' => $etapeInitiale,
            'motif' => $validated['motif'] ?? null,
            'origine_valide_par' => $isChef ? $user->id : null,
            'origine_valide_le' => $isChef ? now() : null,
        ]);

        $message = $isChef
            ? "Demande envoyée. Le chef de {$tribuCible->nom} doit la valider."
            : "Demande envoyée. Le chef de {$tribu->nom} doit d'abord valider votre départ.";

        return back()->with('success', $message);
    }

    /**
     * Le chef concerné valide l'étape en attente : le chef de la tribu
     * d'origine valide le départ (la demande passe alors à l'étape
     * "accueil"), puis le chef de la tribu de destination valide l'arrivée
     * (le membre change alors réellement de tribu). Son historique de
     * cotisations/présences, lié à son compte et non à la tribu, le suit
     * automatiquement.
     */
    public function validerTransfert(TribuTransfertDemande $demande)
    {
        [$user, $tribu] = $this->guardChef();

        if ($demande->statut === TribuTransfertDemande::STATUT_EN_ATTENTE_ORIGINE) {
            if ((int) $demande->tribu_origine_id !== (int) $tribu->id) {
                abort(403, 'Cette demande ne concerne pas votre tribu.');
            }

            $demande->update([
                'statut' => TribuTransfertDemande::STATUT_EN_ATTENTE_DESTINATION,
                'origine_valide_par' => $user->id,
                'origine_valide_le' => now(),
            ]);

            $tribuDestination = $demande->tribuDestination;

            return back()->with('success', "Départ validé. En attente de la validation du chef de {$tribuDestination?->nom}.");
        }

        if ($demande->statut === TribuTransfertDemande::STATUT_EN_ATTENTE_DESTINATION) {
            if ((int) $demande->tribu_destination_id !== (int) $tribu->id) {
                abort(403, 'Cette demande ne concerne pas votre tribu.');
            }

            $membre = User::findOrFail($demande->membre_id);
            $membre->update(['tribu_id' => $tribu->id]);

            $demande->update([
                'statut' => TribuTransfertDemande::STATUT_VALIDEE,
                'traite_par' => $user->id,
                'traite_le' => now(),
            ]);

            return back()->with('success', "{$membre->prenom} {$membre->nom} a rejoint {$tribu->nom}.");
        }

        return back()->withErrors(['error' => 'Cette demande a déjà été traitée.']);
    }

    /**
     * Le chef concerné (origine ou destination, selon l'étape en cours)
     * refuse la demande de transfert.
     */
    public function refuserTransfert(Request $request, TribuTransfertDemande $demande)
    {
        [$user, $tribu] = $this->guardChef();

        $concerneOrigine = $demande->statut === TribuTransfertDemande::STATUT_EN_ATTENTE_ORIGINE
            && (int) $demande->tribu_origine_id === (int) $tribu->id;
        $concerneDestination = $demande->statut === TribuTransfertDemande::STATUT_EN_ATTENTE_DESTINATION
            && (int) $demande->tribu_destination_id === (int) $tribu->id;

        if (!$concerneOrigine && !$concerneDestination) {
            if (!in_array($demande->statut, TribuTransfertDemande::STATUTS_EN_ATTENTE, true)) {
                return back()->withErrors(['error' => 'Cette demande a déjà été traitée.']);
            }

            abort(403, 'Cette demande ne concerne pas votre tribu.');
        }

        $validated = $request->validate([
            'commentaire' => ['nullable', 'string', 'max:500'],
        ]);

        $demande->update([
            'statut' => TribuTransfertDemande::STATUT_REFUSEE,
            'traite_par' => $user->id,
            'traite_le' => now(),
            'commentaire' => $validated['commentaire'] ?? null,
        ]);

        return back()->with('success', 'Demande de transfert refusée.');
    }

    /**
     * Valide en une seule fois plusieurs demandes reçues par le chef (départ
     * ou accueil selon l'étape de chacune) — celles qui ne concernent plus sa
     * tribu ou sont déjà traitées sont simplement ignorées, sans faire
     * échouer le reste du lot.
     */
    public function validerTransfertBulk(Request $request)
    {
        [$user, $tribu] = $this->guardChef();

        $validated = $request->validate([
            'demande_ids' => ['required', 'array', 'min:1'],
            'demande_ids.*' => ['integer'],
        ]);

        $demandes = $this->demandesEnAttenteEligibles($validated['demande_ids'], $tribu);
        $count = 0;

        foreach ($demandes as $demande) {
            if ($demande->statut === TribuTransfertDemande::STATUT_EN_ATTENTE_ORIGINE) {
                $demande->update([
                    'statut' => TribuTransfertDemande::STATUT_EN_ATTENTE_DESTINATION,
                    'origine_valide_par' => $user->id,
                    'origine_valide_le' => now(),
                ]);
            } else {
                User::where('id', $demande->membre_id)->update(['tribu_id' => $tribu->id]);
                $demande->update([
                    'statut' => TribuTransfertDemande::STATUT_VALIDEE,
                    'traite_par' => $user->id,
                    'traite_le' => now(),
                ]);
            }
            $count++;
        }

        if ($count === 0) {
            return back()->withErrors(['error' => 'Aucune des demandes sélectionnées ne peut être validée.']);
        }

        return back()->with('success', "{$count} demande(s) validée(s).");
    }

    /**
     * Refuse en une seule fois plusieurs demandes reçues par le chef.
     */
    public function refuserTransfertBulk(Request $request)
    {
        [$user, $tribu] = $this->guardChef();

        $validated = $request->validate([
            'demande_ids' => ['required', 'array', 'min:1'],
            'demande_ids.*' => ['integer'],
            'commentaire' => ['nullable', 'string', 'max:500'],
        ]);

        $demandes = $this->demandesEnAttenteEligibles($validated['demande_ids'], $tribu);
        $count = 0;

        foreach ($demandes as $demande) {
            $demande->update([
                'statut' => TribuTransfertDemande::STATUT_REFUSEE,
                'traite_par' => $user->id,
                'traite_le' => now(),
                'commentaire' => $validated['commentaire'] ?? null,
            ]);
            $count++;
        }

        if ($count === 0) {
            return back()->withErrors(['error' => 'Aucune des demandes sélectionnées ne peut être refusée.']);
        }

        return back()->with('success', "{$count} demande(s) refusée(s).");
    }

    /**
     * Parmi les ids donnés, ne retient que les demandes encore en attente
     * d'une action de CE chef (départ pour sa tribu d'origine, ou accueil
     * pour sa tribu de destination).
     */
    private function demandesEnAttenteEligibles(array $demandeIds, Tribu $tribu): Collection
    {
        return TribuTransfertDemande::query()
            ->whereIn('id', $demandeIds)
            ->where(function ($q) use ($tribu) {
                $q->where(function ($q2) use ($tribu) {
                    $q2->where('tribu_origine_id', $tribu->id)
                        ->where('statut', TribuTransfertDemande::STATUT_EN_ATTENTE_ORIGINE);
                })->orWhere(function ($q2) use ($tribu) {
                    $q2->where('tribu_destination_id', $tribu->id)
                        ->where('statut', TribuTransfertDemande::STATUT_EN_ATTENTE_DESTINATION);
                });
            })
            ->get();
    }

    /**
     * Suivi des cotisations de sa tribu — réservé au chef.
     */
    public function finances()
    {
        [$user, $tribu] = $this->guardChef();

        return Inertia::render('MembreFamille/TribuFinances', [
            'basePath' => self::basePath($user),
            'tribu' => ['id' => $tribu->id, 'nom' => $tribu->nom],
            'membres' => ConducteurTribuController::buildFinancesData($tribu),
            'historique' => ConducteurTribuController::buildHistoriquePaiements($tribu),
        ]);
    }

    /**
     * Le chef envoie un rappel de cotisation par email à un membre de sa
     * tribu (même mécanisme que la relance du conducteur, mais restreinte
     * aux membres de sa propre tribu).
     */
    public function relancerMembre(Request $request, User $user)
    {
        [, $tribu] = $this->guardChef();

        $validated = $request->validate([
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        if ((int) $user->tribu_id !== (int) $tribu->id) {
            return back()->withErrors(['error' => 'Ce membre ne fait pas partie de votre tribu.']);
        }

        if (empty($user->email)) {
            return back()->withErrors(['error' => 'Ce membre n\'a pas d\'adresse email enregistrée.']);
        }

        $membre = User::query()
            ->where('id', $user->id)
            ->get(['id', 'nom', 'prenom', 'email', 'genre', 'employment_status', 'date_naissance'])
            ->first();

        $finances = ConducteurTribuController::buildFinancesDataForMembers(new Collection([$membre]), $tribu->classe_id)[0] ?? null;
        $cotisationsDues = collect($finances['cotisations'] ?? [])->where('du', '>', 0)->values()->all();

        if (empty($cotisationsDues)) {
            return back()->withErrors(['error' => 'Ce membre est déjà à jour, aucun rappel nécessaire.']);
        }

        try {
            Mail::to($membre->email)->send(new RappelCotisation($membre, $cotisationsDues, $finances['totalDu'], $validated['message'] ?? null, $finances['totalPaye']));
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi du rappel de cotisation (chef de tribu)', [
                'user_id' => $membre->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Erreur lors de l\'envoi de l\'email : ' . $e->getMessage()]);
        }

        return back()->with('success', "Rappel envoyé à {$membre->email}.");
    }

    /**
     * Le chef relance en une fois tous les membres en retard de sa tribu
     * (même mécanisme que la relance groupée du conducteur, mais restreinte
     * à sa propre tribu).
     */
    public function relancerTousRetardataires(Request $request)
    {
        [, $tribu] = $this->guardChef();

        $validated = $request->validate([
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $membres = $tribu->membres()->get(['id', 'nom', 'prenom', 'email', 'genre', 'employment_status', 'date_naissance']);
        $finances = collect(ConducteurTribuController::buildFinancesDataForMembers($membres, $tribu->classe_id))->keyBy('id');

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
                Log::error('Erreur lors de l\'envoi du rappel de cotisation (relance groupée, chef de tribu)', [
                    'user_id' => $membre->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $message = "{$envoyes} rappel(s) envoyé(s).";
        if ($sansEmail > 0) {
            $message .= " {$sansEmail} membre(s) sans adresse email n'ont pas pu être relancé(s).";
        }

        return back()->with('success', $message);
    }

    /**
     * Suivi des présences de sa tribu aux activités de la classe — réservé au chef.
     */
    public function presences()
    {
        [$user, $tribu] = $this->guardChef();

        $membres = $tribu->membres()->orderBy('nom')->orderBy('prenom')->get(['id', 'nom', 'prenom']);

        return Inertia::render('MembreFamille/TribuPresences', [
            'basePath' => self::basePath($user),
            'tribu' => ['id' => $tribu->id, 'nom' => $tribu->nom],
            ...ConducteurTribuController::buildPresencesPageData($tribu->classe_id, $membres),
        ]);
    }

    /**
     * Le chef justifie l'absence d'un membre de sa tribu à une activité
     * (maladie, empêchement professionnel, événement familial, décès d'un
     * proche, autre). Crée le pointage "absent" si aucun n'existait encore
     * pour cette activité (cas d'une absence simplement déduite de la
     * clôture de l'activité, sans pointage QR).
     */
    public function justifierAbsence(Request $request, SpecialEvent $activite, User $membre)
    {
        [$user, $tribu] = $this->guardChef();

        if ((int) $membre->tribu_id !== (int) $tribu->id) {
            abort(403, 'Ce membre ne fait pas partie de votre tribu.');
        }

        if ((int) $activite->class_id !== (int) $tribu->classe_id) {
            abort(403, 'Cette activité ne concerne pas votre classe.');
        }

        $validated = $request->validate([
            'motif' => ['required', Rule::in(array_keys(Presence::MOTIFS_JUSTIFICATION))],
            'detail' => ['nullable', 'string', 'max:500'],
        ]);

        $presence = Presence::query()->firstOrNew([
            'special_event_id' => $activite->id,
            'membre_famille_id' => $membre->id,
        ]);

        if ($presence->exists && $presence->statut === 'present') {
            return back()->withErrors(['error' => 'Ce membre était présent à cette activité, son absence ne peut pas être justifiée.']);
        }

        $presence->statut = 'absent';
        $presence->justifiee = true;
        $presence->motif_justification = $validated['motif'];
        $presence->motif_justification_detail = $validated['detail'] ?? null;
        $presence->justifiee_par = $user->id;
        $presence->justifiee_le = now();
        $presence->save();

        return back()->with('success', "Absence de {$membre->prenom} {$membre->nom} justifiée.");
    }

    /**
     * Page d'affectation de nouveaux membres à sa tribu, et de transfert d'un
     * membre de sa tribu vers une autre tribu de la classe — réservé au chef.
     */
    public function assigner()
    {
        [$user, $tribu] = $this->guardChef();

        $membresActuels = $tribu->membres()
            ->where('id', '!=', $user->id)
            ->orderBy('nom')->orderBy('prenom')
            ->get(['id', 'nom', 'prenom'])
            ->map(fn (User $m) => ['id' => $m->id, 'nom' => trim($m->prenom . ' ' . $m->nom)])
            ->values();

        $autresTribus = self::buildAutresTribusOptions($tribu);

        return Inertia::render('MembreFamille/TribuAssigner', [
            'basePath' => self::basePath($user),
            'tribu' => [
                'id' => $tribu->id,
                'nom' => $tribu->nom,
                'chefs' => $tribu->chefs->map(fn ($chef) => [
                    'id' => $chef->id,
                    'nom' => trim($chef->prenom . ' ' . $chef->nom),
                ])->values(),
            ],
            'membresActuels' => $membresActuels,
            'autresTribus' => $autresTribus,
            'demandesRecues' => self::buildDemandesRecues($tribu),
        ]);
    }

    /**
     * Historique de toutes les demandes de transfert envoyées par
     * l'utilisateur connecté : un membre ordinaire y retrouve ses propres
     * demandes, un chef de tribu y retrouve celles qu'il a faites au nom de
     * ses membres — avec le détail des étapes de validation.
     */
    public function historique()
    {
        $user = Auth::user();
        $user->loadMissing('classe');

        if (!$user->classe?->has_tribus) {
            abort(403, 'Le module tribu n\'est pas activé pour votre classe.');
        }

        $demandes = TribuTransfertDemande::query()
            ->where('demandeur_id', $user->id)
            ->with([
                'membre:id,nom,prenom',
                'tribuOrigine:id,nom',
                'tribuDestination:id,nom',
                'origineValidePar:id,nom,prenom',
                'traitePar:id,nom,prenom',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (TribuTransfertDemande $d) => [
                'id' => $d->id,
                'membre' => trim(($d->membre->prenom ?? '') . ' ' . ($d->membre->nom ?? '')),
                'pourSoiMeme' => (int) $d->membre_id === (int) $user->id,
                'tribuOrigine' => $d->tribuOrigine?->nom,
                'tribuDestination' => $d->tribuDestination?->nom,
                'statut' => $d->statut,
                'motif' => $d->motif,
                'commentaire' => $d->commentaire,
                'dateEnvoi' => $d->created_at->format('d/m/Y à H:i'),
                'origineValidePar' => $d->origineValidePar
                    ? trim($d->origineValidePar->prenom . ' ' . $d->origineValidePar->nom)
                    : null,
                'origineValideLe' => $d->origine_valide_le?->format('d/m/Y à H:i'),
                'traitePar' => $d->traitePar
                    ? trim($d->traitePar->prenom . ' ' . $d->traitePar->nom)
                    : null,
                'traiteLe' => $d->traite_le?->format('d/m/Y à H:i'),
            ])
            ->values();

        // Membres que l'utilisateur, en tant que chef de la tribu de
        // destination, a acceptés dans sa tribu (dernière étape validée par
        // lui, quel que soit celui qui a envoyé la demande à l'origine).
        $accueillis = TribuTransfertDemande::query()
            ->where('traite_par', $user->id)
            ->where('statut', TribuTransfertDemande::STATUT_VALIDEE)
            ->with([
                'membre:id,nom,prenom',
                'demandeur:id,nom,prenom',
                'tribuOrigine:id,nom',
                'tribuDestination:id,nom',
            ])
            ->orderByDesc('traite_le')
            ->get()
            ->map(fn (TribuTransfertDemande $d) => [
                'id' => $d->id,
                'membre' => trim(($d->membre->prenom ?? '') . ' ' . ($d->membre->nom ?? '')),
                'demandeur' => trim(($d->demandeur->prenom ?? '') . ' ' . ($d->demandeur->nom ?? '')),
                'demandeurEstMembre' => (int) $d->demandeur_id === (int) $d->membre_id,
                'tribuOrigine' => $d->tribuOrigine?->nom,
                'tribuDestination' => $d->tribuDestination?->nom,
                'motif' => $d->motif,
                'dateEnvoi' => $d->created_at->format('d/m/Y à H:i'),
                'dateAcceptation' => $d->traite_le?->format('d/m/Y à H:i'),
            ])
            ->values();

        return Inertia::render('MembreFamille/TribuHistoriqueTransferts', [
            'basePath' => self::basePath($user),
            'demandes' => $demandes,
            'accueillis' => $accueillis,
        ]);
    }

    /**
     * Vérifie que l'utilisateur connecté est bien chef de sa tribu et retourne
     * [User, Tribu] — abort(403) sinon.
     *
     * @return array{0: User, 1: Tribu}
     */
    private function guardChef(): array
    {
        $user = Auth::user();
        $user->loadMissing('classe', 'tribu.chefs');

        if (!$user->classe?->has_tribus) {
            abort(403, 'Le module tribu n\'est pas activé pour votre classe.');
        }

        $tribu = $user->tribu;

        if (!$tribu || !$tribu->chefs->contains('id', $user->id)) {
            abort(403, 'Réservé au chef de tribu.');
        }

        return [$user, $tribu];
    }

    /**
     * Demandes de transfert en attente d'une action du chef de cette tribu :
     * soit une demande de départ d'un de ses membres à valider (étape
     * "origine"), soit une demande d'arrivée d'un membre d'une autre tribu à
     * valider (étape "destination", départ déjà validé par l'autre chef).
     */
    private static function buildDemandesRecues(Tribu $tribu): array
    {
        return TribuTransfertDemande::query()
            ->where(function ($q) use ($tribu) {
                $q->where(function ($q2) use ($tribu) {
                    $q2->where('tribu_origine_id', $tribu->id)
                        ->where('statut', TribuTransfertDemande::STATUT_EN_ATTENTE_ORIGINE);
                })->orWhere(function ($q2) use ($tribu) {
                    $q2->where('tribu_destination_id', $tribu->id)
                        ->where('statut', TribuTransfertDemande::STATUT_EN_ATTENTE_DESTINATION);
                });
            })
            ->with(['membre:id,nom,prenom', 'tribuOrigine:id,nom', 'tribuDestination:id,nom'])
            ->orderBy('created_at')
            ->get()
            ->map(fn (TribuTransfertDemande $d) => [
                'id' => $d->id,
                'membre' => trim(($d->membre->prenom ?? '') . ' ' . ($d->membre->nom ?? '')),
                'tribuOrigine' => $d->tribuOrigine?->nom,
                'tribuDestination' => $d->tribuDestination?->nom,
                'etape' => $d->statut === TribuTransfertDemande::STATUT_EN_ATTENTE_ORIGINE ? 'depart' : 'accueil',
                'motif' => $d->motif,
                'date' => $d->created_at->format('d/m/Y'),
            ])
            ->values()
            ->all();
    }

    /**
     * Autres tribus de la classe pouvant recevoir une demande de transfert.
     */
    private static function buildAutresTribusOptions(Tribu $tribu): array
    {
        return Tribu::query()
            ->where('classe_id', $tribu->classe_id)
            ->where('id', '!=', $tribu->id)
            ->orderBy('nom')
            ->get(['id', 'nom'])
            ->map(fn (Tribu $t) => ['id' => $t->id, 'nom' => $t->nom])
            ->values()
            ->all();
    }

    private static function basePath(User $user): string
    {
        return $user->role === 'responsable_famille' ? '/responsable-famille' : '/membre-famille';
    }
}
