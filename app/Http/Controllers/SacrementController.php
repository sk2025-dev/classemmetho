<?php

namespace App\Http\Controllers;

use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiquePieceJointe;
use App\Models\CampagneSacrement;
use App\Models\Classe;
use App\Models\ListeSacrement;
use App\Models\User;
use App\Services\CampagneSacrementService;
use App\Services\SacrementWorkflowService;
use App\Support\SacrementAccess as Access;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SacrementController extends Controller
{
    public function __construct(private SacrementWorkflowService $workflow) {}

    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless(Access::allowed($user), 403);
        $campaigns = CampagneSacrement::latest('id')->get();
        $campaign = $request->filled('campagne_id') ? $campaigns->firstWhere('id', (int) $request->campagne_id) : $campaigns->first();
        $query = ActeLiturgique::with(['membre:id,nom,prenom', 'classe:id,nom', 'historiques.acteur:id,nom,prenom', 'piecesJointes'])
            ->whereNotNull('campagne_id')->where('campagne_id', $campaign?->id ?? 0);
        if (! in_array($user->role, ['admin', 'pasteur'], true)) {
            $query->where(function ($q) use ($user) {
                $q->whereRaw('1 = 0');
                if (Access::responsable($user)) {
                    $q->orWhere('family_id', $user->family_id);
                }
                if ($user->role === 'conducteur' && $user->classe_id) {
                    $q->orWhere('classe_id', $user->classe_id);
                }
                if (Access::bureau($user)) {
                    $q->orWhereNotNull('liste_sacrement_id');
                }
            });
        }
        // A draft belongs only to its family; administration can identify abandoned drafts for closure.
        $query->where(function ($q) use ($user) {
            if ($user->role === 'admin') {
                return;
            }
            $q->where('suivi_sacrement->etape', '!=', 'brouillon');
            if ($user->role === 'conducteur' && $user->classe_id) {
                $q->orWhere(fn ($draft) => $draft->where('created_by', $user->id)->where('classe_id', $user->classe_id));
            }
            if (Access::responsable($user)) {
                $q->orWhere('family_id', $user->family_id);
            }
        });
        foreach (['classe_id', 'type_acte'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }
        if ($request->filled('etape')) {
            $query->where('suivi_sacrement->etape', $request->etape);
        }
        if ($request->filled('search')) {
            $query->whereHas('membre', fn ($q) => $q->where('nom', 'like', '%'.$request->search.'%')->orWhere('prenom', 'like', '%'.$request->search.'%'));
        }
        $actes = $query->latest('id')->paginate(30)->withQueryString();
        $actes->through(function ($acte) use ($user, $campaign) {
            $row = $acte->toArray();
            $row['bapteme_a_verifier'] = $acte->type_acte === 'premiere_communion' && ! (bool) \App\Models\UserSacrement::where('user_id', $acte->membre_id)->value('baptise');
            $row['peut_corriger'] = Access::owns($user, $acte);
            $row['peut_controler'] = $user->role === 'conducteur' && (int) $user->classe_id === (int) $acte->classe_id;
            if ($row['peut_controler']) {
                $row['indicateurs'] = $this->workflow->indicators($acte, $campaign);
            }
            $row['pieces_jointes'] = $acte->piecesJointes->map(fn ($p) => ['id' => $p->id, 'nom' => $p->original_name, 'url' => route('sacrements.piece', $p)]);

            return $row;
        });
        $lists = ListeSacrement::with('classe:id,nom')->where('campagne_id', $campaign?->id ?? 0);
        if (! in_array($user->role, ['admin', 'pasteur'], true) && ! Access::bureau($user)) {
            if ($user->role === 'conducteur') {
                $lists->where('classe_id', $user->classe_id ?? 0);
            } else {
                $lists->whereRaw('1 = 0');
            }
        }

        $members = Access::canRegister($user)
            ? Access::candidates($user)->with('family')->get(['id', 'family_id', 'nom', 'prenom', 'classe_id', 'telephone', 'telephone2', 'email'])
                ->map(function ($member) use ($user) {
                    $family = $member->family;
                    $contactActor = (int) $member->family_id === (int) $user->family_id ? $user : null;
                    $phones = collect([$member->telephone, $member->telephone2, $family?->telephone, $family?->telephone2, $contactActor?->telephone, $contactActor?->telephone2])
                        ->map(fn ($phone) => trim((string) $phone))->filter()->unique()->values();

                    return [
                        'id' => $member->id, 'nom' => $member->nom, 'prenom' => $member->prenom, 'classe_id' => $member->classe_id,
                        'contacts' => ['telephone' => $phones->get(0, ''), 'telephone2' => $phones->get(1, ''),
                            'email' => $member->email ?: ($family?->email ?: ($contactActor?->email ?? ''))],
                    ];
                })
            : [];

        return Inertia::render('Sacrements/Index', [
            'ajoutMembreUrl' => Access::responsable($user) ? route('responsable_famille.members.create', ['family_id' => $user->family_id]) : null,
            'membrePreselectionne' => Access::responsable($user) && $request->filled('membre_id') ? User::where('family_id', $user->family_id)->where('id', $request->integer('membre_id'))->value('id') : null,
            'inscriptionType' => in_array($request->input('type_acte'), CampagneSacrementService::TYPES_GATED, true) ? $request->input('type_acte') : 'bapteme',
            'ouvrirInscription' => $request->boolean('inscription') && Access::canRegister($user) && $campaign?->isCurrentlyOpen(),
            'anciensDossiers' => $user->role === 'admin' ? ActeLiturgique::with('membre:id,nom,prenom')->whereNull('campagne_id')->whereIn('type_acte', CampagneSacrementService::TYPES_GATED)->whereIn('statut', ['SOUMISE', 'EN_ATTENTE_CONDUCTEUR', 'TRANSMISE_AU_BUREAU_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR', 'VALIDEE'])->orderBy('id')->limit(100)->get(['id', 'reference', 'membre_id', 'type_acte', 'statut']) : [],
            'campagnes' => $campaigns, 'campagne' => $campaign ? $campaign->toArray() + ['est_ouverte' => $campaign->isCurrentlyOpen()] : null,
            'dossiers' => $actes, 'listes' => $lists->latest('id')->get(),
            'membres' => $members,
            'classes' => in_array($user->role, ['admin', 'pasteur'], true) || Access::bureau($user) ? Classe::orderBy('nom')->get(['id', 'nom']) : [],
            'droits' => ['inscrire' => Access::canRegister($user), 'responsable' => Access::responsable($user), 'conducteur' => $user->role === 'conducteur',
                'bureau' => Access::bureau($user), 'pasteur' => $user->role === 'pasteur', 'admin' => $user->role === 'admin'],
            'filters' => $request->only(['campagne_id', 'classe_id', 'type_acte', 'etape', 'search']),
        ]);
    }

    private function dossierRules(): array
    {
        return ['details' => ['required', 'array:telephone,telephone2,email,parents,parrain,marraine,observations,bapteme_date,bapteme_lieu'],
            'details.bapteme_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'details.bapteme_lieu' => ['nullable', 'string', 'max:255'],
            'details.telephone' => ['nullable', 'string', 'max:50'],
            'details.telephone2' => ['nullable', 'string', 'max:50'], 'details.email' => ['nullable', 'email', 'max:255'], 'details.parents' => ['nullable', 'string', 'max:255'],
            'details.parrain' => ['nullable', 'string', 'max:255'], 'details.marraine' => ['nullable', 'string', 'max:255'],
            'details.observations' => ['nullable', 'string', 'max:2000']];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->dossierRules() + [
            'membre_id' => ['required', 'integer'], 'type_acte' => ['required', Rule::in(CampagneSacrementService::TYPES_GATED)],
            'brouillon' => ['sometimes', 'boolean'], 'pieces_jointes' => ['nullable', 'array', 'max:5'],
            'pieces_jointes.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);
        $paths = [];
        try {
            DB::transaction(function () use ($data, $request, &$paths) {
                $acte = $this->workflow->create($data, $request->user());
                foreach ($request->file('pieces_jointes', []) as $file) {
                    $path = $file->store('sacrements/'.$acte->id, 'local');
                    $paths[] = $path;
                    ActeLiturgiquePieceJointe::create(['acte_id' => $acte->id, 'path' => $path,
                        'original_name' => $file->getClientOriginalName(), 'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(), 'uploaded_by' => $request->user()->id]);
                }
            });
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($paths);
            throw $e;
        }

        return to_route('sacrements.index')->with('success', 'Dossier enregistré.');
    }

    public function action(Request $request)
    {
        $data = $request->validate([
            'campagne_id' => ['required', 'integer'], 'ids' => ['required', 'array', 'min:1', 'max:100'], 'ids.*' => ['integer', 'distinct'],
            'action' => ['required', Rule::in(['valider', 'retourner', 'exclure', 'soumettre', 'corriger', 'annuler', 'celebrer', 'planifier', 'rectifier', 'reporter', 'archiver'])],
            'commentaire' => ['nullable', 'string', 'max:2000'], 'revision' => ['nullable', 'integer'], 'revisions' => ['required', 'array'], 'revisions.*' => ['required', 'integer'],
        ]);
        if (in_array($data['action'], ['corriger', 'soumettre'], true)) {
            $data += $request->validate($this->dossierRules() + ['pieces_jointes' => ['nullable', 'array', 'max:5'], 'pieces_jointes.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120']]);
            $this->workflow->require(count($data['ids']) === 1, 'Corrigez un dossier à la fois.');
        }
        if (in_array($data['action'], ['celebrer', 'rectifier', 'planifier'], true)) {
            $perCandidate = $data['action'] !== 'planifier' && $request->has('sacrements');
            $data += $request->validate(['sacrement' => [$data['action'] === 'planifier' || $perCandidate ? 'nullable' : 'required', Rule::in(['bapteme', 'premiere_communion'])],
                'date' => array_filter(['required', 'date_format:Y-m-d', $data['action'] === 'planifier' ? null : 'before_or_equal:today']),
                'lieu' => ['required', 'string', 'max:255'], 'celebrant' => ['required', 'string', 'max:255']]);
            if ($perCandidate) {
                $allowed = $data['action'] === 'celebrer' ? ['bapteme', 'premiere_communion', 'bapteme_premiere_communion'] : ['bapteme', 'premiere_communion'];
                $data += $request->validate(['sacrements' => ['required', 'array', 'min:1', 'max:100'], 'sacrements.*' => ['required', Rule::in($allowed)]]);
                $this->workflow->require(count($data['sacrements']) === count($data['ids']) && collect($data['ids'])->every(fn ($id) => isset($data['sacrements'][$id])), 'Précisez le sacrement pour chaque candidat sélectionné.');
            }
            if ($data['action'] === 'planifier') {
                $data += $request->validate(['formation' => ['required', Rule::in(['en_cours', 'terminee', 'non_requise'])]]);
            }
        }
        $paths = [];
        try {
            DB::transaction(function () use ($request, $data, &$paths) {
                $this->workflow->action($request->user(), $data['campagne_id'], $data['ids'], $data['action'], $data);
                foreach (in_array($data['action'], ['corriger', 'soumettre'], true) ? $request->file('pieces_jointes', []) : [] as $file) {
                    $path = $file->store('sacrements/'.$data['ids'][0], 'local');
                    $paths[] = $path;
                    ActeLiturgiquePieceJointe::create(['acte_id' => $data['ids'][0], 'path' => $path,
                        'original_name' => $file->getClientOriginalName(), 'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(), 'uploaded_by' => $request->user()->id]);
                }
            });
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($paths);
            throw $e;
        }

        return back()->with('success', 'Décision enregistrée pour chaque dossier sélectionné.');
    }

    public function reprendre(Request $request)
    {
        $data = $request->validate(['campagne_id' => ['required', 'integer'], 'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer', 'distinct'], 'commentaire' => ['required', 'string', 'max:2000']]);
        $this->workflow->reprendre($request->user(), $data['campagne_id'], $data['ids'], $data['commentaire']);

        return back()->with('success', 'Dossiers repris ; le conducteur doit effectuer un nouveau contrôle.');
    }

    public function transmit(Request $request)
    {
        $data = $request->validate(['campagne_id' => ['required', 'integer']]);
        $this->workflow->transmit($request->user(), $data['campagne_id']);

        return back()->with('success', 'Liste de classe transmise.');
    }

    public function decidePastoralCandidates(Request $request)
    {
        abort_unless($request->user()->role === 'pasteur', 403);
        $data = $request->validate([
            'candidats' => ['required', 'array', 'min:1'],
            'candidats.*.id' => ['required', 'integer', 'distinct'],
            'candidats.*.liste_id' => ['required', 'integer'],
            'candidats.*.revision' => ['required', 'integer'],
            'decision' => ['required', Rule::in(['valider', 'refuser'])],
            'commentaire' => ['nullable', 'string', 'max:2000'],
        ]);
        $this->workflow->decidePastoralCandidates($request->user(), $data['candidats'], $data['decision'], $data['commentaire'] ?? '');
        return back()->with('success', 'Décision pastorale enregistrée pour '.count($data['candidats']).' candidat(s).');
    }

    public function refuseCandidate(Request $request, ListeSacrement $liste, int $candidate)
    {
        $data = $request->validate(['commentaire' => ['required', 'string', 'max:2000']]);
        $this->workflow->refuseCandidate($request->user(), $liste->id, $candidate, $data['commentaire']);

        return back()->with('success', 'Candidat refusé. Les autres inscriptions de la liste sont conservées.');
    }

    public function decideBatch(Request $request)
    {
        abort_unless(Access::bureau($request->user()), 403);
        $data = $request->validate([
            'campagne_id' => ['required', 'integer'],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct'],
            'commentaire' => ['nullable', 'string', 'max:2000'],
        ]);
        DB::transaction(function () use ($data, $request) {
            CampagneSacrement::lockForUpdate()->findOrFail($data['campagne_id']);
            $ids = $data['ids'];
            sort($ids);
            foreach ($ids as $id) {
                $list = ListeSacrement::where('campagne_id', $data['campagne_id'])->lockForUpdate()->findOrFail($id);
                $this->workflow->decideList($request->user(), $list->id, 'valider', $data['commentaire'] ?? '', 'bureau');
            }
        });

        return back()->with('success', count($data['ids']).' liste(s) validée(s) et transmise(s) au pasteur.');
    }

    public function decide(Request $request, ListeSacrement $liste)
    {
        $data = $request->validate(['decision' => ['required', Rule::in(['valider', 'retourner', 'refuser'])],
            'commentaire' => ['nullable', 'string', 'max:2000'], 'statut' => ['required', 'string']]);
        $this->workflow->decideList($request->user(), $liste->id, $data['decision'], $data['commentaire'] ?? '', $data['statut']);

        return back()->with('success', 'Décision sur la liste enregistrée.');
    }

    public function campaign(Request $request, CampagneSacrementService $service)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $data = $request->validate(['action' => ['required', Rule::in(['ouvrir', 'fermer', 'reouvrir', 'archiver'])], 'id' => ['nullable', 'integer']]);
        if (in_array($data['action'], ['ouvrir', 'reouvrir'], true)) {
            $data += $request->validate([
                'annee' => ['required', 'integer', 'min:2000', 'max:2100'], 'titre' => ['required', 'string', 'max:255'],
                'date_ouverture' => ['required', 'date_format:Y-m-d'], 'date_fermeture' => ['required', 'date_format:Y-m-d', 'after_or_equal:date_ouverture'],
                'motif_reouverture' => [$data['action'] === 'reouvrir' ? 'required' : 'nullable', 'string', 'max:255'],
            ]);
        }
        try {
            match ($data['action']) {
                'ouvrir' => $service->ouvrir($data, $request->user()->id),
                'fermer' => $service->fermer(CampagneSacrement::findOrFail($data['id'] ?? 0), $request->user()->id),
                'reouvrir' => $service->reouvrir(CampagneSacrement::findOrFail($data['id'] ?? 0), $data, $request->user()->id),
                'archiver' => $this->workflow->archiveCampaign($request->user(), $data['id'] ?? 0),
            };
        } catch (\InvalidArgumentException $e) {
            $this->workflow->require(false, $e->getMessage());
        }

        return back()->with('success', 'Campagne mise à jour.');
    }

    public function piece(Request $request, ActeLiturgiquePieceJointe $piece)
    {
        abort_unless($piece->acte && Access::reads($request->user(), $piece->acte), 403);

        return Storage::disk(str_starts_with($piece->path, 'sacrements/') ? 'local' : 'public')->download($piece->path, $piece->original_name);
    }

    public function certificate(Request $request, ActeLiturgique $acte, string $type)
    {
        abort_unless(Access::reads($request->user(), $acte), 403);
        $celebration = $acte->suivi_sacrement['celebrations'][$type] ?? null;
        $ancienneVersion = false;
        if ($request->filled('version') && $celebration && (int) $request->version !== (int) ($celebration['version'] ?? 1)) {
            $celebration = collect($acte->suivi_sacrement['versions_certificats'][$type] ?? [])->firstWhere('version', (int) $request->version);
            $ancienneVersion = true;
        }
        abort_unless($celebration, 422, 'Le sacrement doit avoir été confirmé par le pasteur.');

        return Pdf::loadView('sacrements.certificat', compact('acte', 'celebration', 'type', 'ancienneVersion'))->download($celebration['reference'].'-v'.($celebration['version'] ?? 1).'.pdf');
    }

    public function listPdf(Request $request, ListeSacrement $liste)
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['admin', 'pasteur'], true) || Access::bureau($user)
            || ($user->role === 'conducteur' && (int) $user->classe_id === (int) $liste->classe_id), 403);
        $liste->load('classe', 'campagne');

        return Pdf::loadView('sacrements.liste', compact('liste'))->download('liste-'.$liste->id.'-v'.$liste->version.'.pdf');
    }
}
