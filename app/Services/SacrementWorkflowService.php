<?php

namespace App\Services;

use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\CampagneSacrement;
use App\Models\ListeSacrement;
use App\Models\Notification;
use App\Models\Presence;
use App\Models\User;
use App\Models\UserSacrement;
use App\Support\SacrementAccess as Access;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SacrementWorkflowService
{
    private array $fimecoCache = [];

    public const TERMINAUX = ['celebre', 'refuse', 'annule', 'reporte', 'archive'];

    public function require(bool $condition, string $message): void
    {
        if (! $condition) {
            throw ValidationException::withMessages(['workflow' => $message]);
        }
    }

    public function sacrements(string $type): array
    {
        return match ($type) {
            'bapteme' => ['bapteme'],
            'premiere_communion' => ['premiere_communion'],
            'bapteme_premiere_communion' => ['bapteme', 'premiere_communion'],
            default => [],
        };
    }

    public function create(array $data, User $actor): ActeLiturgique
    {
        abort_unless(Access::canRegister($actor), 403, 'Seul le responsable de famille ou le conducteur peut inscrire un candidat.');

        return DB::transaction(function () use ($data, $actor) {
            $campagne = CampagneSacrement::where('statut', 'ouverte')->whereNull('archivee_at')
                ->whereDate('date_ouverture', '<=', today())->whereDate('date_fermeture', '>=', today())
                ->lockForUpdate()->first();
            $this->require($campagne !== null, 'Les inscriptions sont fermées.');
            $member = Access::candidates($actor)->lockForUpdate()->findOrFail($data['membre_id']);
            $this->require((bool) $member->classe_id, 'Le candidat doit être rattaché à une classe.');
            $types = $this->sacrements($data['type_acte']);
            $this->require($types !== [], 'Type de sacrement invalide.');
            $sacrements = UserSacrement::where('user_id', $member->id)->first();
            foreach ($types as $type) {
                $already = $type === 'bapteme' ? $sacrements?->baptise : $sacrements?->premiere_communion;
                $this->require(! $already, 'Ce membre a déjà reçu ce sacrement.');
            }
            foreach (ActeLiturgique::where('membre_id', $member->id)->whereIn('type_acte', CampagneSacrementService::TYPES_GATED)->get() as $old) {
                if (! array_intersect($types, $this->sacrements($old->type_acte))) {
                    continue;
                }
                $stage = $old->suivi_sacrement['etape'] ?? null;
                $terminal = $old->suivi_sacrement['issue'] ?? $stage;
                $closedWithoutCelebration = in_array($terminal, ['refuse', 'annule', 'reporte'], true)
                    || (! $stage && str_starts_with($old->statut, 'REFUSEE_'));
                $this->require($closedWithoutCelebration, 'Un dossier existe déjà pour ce membre et ce sacrement.');
            }
            $acte = ActeLiturgique::create([
                'reference' => 'SAC-'.$campagne->annee.'-'.Str::upper(Str::random(12)),
                'type_acte' => $data['type_acte'], 'statut' => 'SOUMISE',
                'membre_id' => $member->id, 'family_id' => $member->family_id, 'classe_id' => $member->classe_id,
                'campagne_id' => $campagne->id, 'created_by' => $actor->id,
                'details' => $data['details'] ?? [],
                'suivi_sacrement' => ['etape' => ! empty($data['brouillon']) ? 'brouillon' : 'soumis', 'revision' => 1],
            ]);
            $this->history($acte, $actor, 'Création du dossier', null);
            if (empty($data['brouillon'])) {
                $this->notifyConducteurs($acte, 'Nouvelle inscription à vérifier');
            }

            return $acte;
        });
    }

    /** Explicit adoption of pre-campaign dossiers; never infer historical celebrations. */
    public function reprendre(User $actor, int $campaignId, array $ids, string $reason): void
    {
        abort_unless($actor->role === 'admin', 403);
        $this->require(trim($reason) !== '', 'Le motif de reprise est obligatoire.');
        DB::transaction(function () use ($actor, $campaignId, $ids, $reason) {
            $campaign = CampagneSacrement::lockForUpdate()->findOrFail($campaignId);
            $this->require($campaign->isCurrentlyOpen(), 'La campagne de reprise doit être ouverte.');
            $actes = ActeLiturgique::whereIn('id', $ids)->lockForUpdate()->get();
            $this->require($actes->count() === count(array_unique($ids)), 'Dossier introuvable.');
            foreach ($actes as $acte) {
                $this->require(! $acte->campagne_id && in_array($acte->type_acte, CampagneSacrementService::TYPES_GATED, true), 'Ce dossier est déjà rattaché ou ne concerne pas ces sacrements.');
                $this->require(in_array($acte->statut, ['SOUMISE', 'EN_ATTENTE_CONDUCTEUR', 'TRANSMISE_AU_BUREAU_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR', 'VALIDEE'], true), 'Seuls les anciens dossiers en cours peuvent être repris.');
                $member = User::lockForUpdate()->findOrFail($acte->membre_id);
                $this->require((bool) $member->family_id && (bool) $member->classe_id, 'Le candidat doit avoir une famille et une classe.');
                $sacrements = UserSacrement::where('user_id', $member->id)->first();
                foreach ($this->sacrements($acte->type_acte) as $type) {
                    $this->require(! ($type === 'bapteme' ? $sacrements?->baptise : $sacrements?->premiere_communion), 'Un sacrement est déjà reçu : conservez ce dossier dans les archives historiques.');
                }
                $duplicate = ActeLiturgique::where('membre_id', $member->id)->whereNotNull('campagne_id')
                    ->whereIn('type_acte', CampagneSacrementService::TYPES_GATED)->get()->contains(function ($other) use ($acte) {
                        return array_intersect($this->sacrements($acte->type_acte), $this->sacrements($other->type_acte))
                            && ! in_array($other->suivi_sacrement['issue'] ?? $other->suivi_sacrement['etape'], ['refuse', 'annule', 'reporte'], true);
                    });
                $this->require(! $duplicate, 'Un dossier existe déjà dans le nouveau circuit.');
                $previous = $acte->statut;
                $acte->update(['campagne_id' => $campaignId, 'classe_id' => $member->classe_id, 'family_id' => $member->family_id,
                    'statut' => 'SOUMISE', 'suivi_sacrement' => ['etape' => 'soumis', 'revision' => 1, 'reprise_statut_initial' => $previous]]);
                $this->history($acte, $actor, 'Reprise dans le circuit des listes ; nouveau contrôle requis : '.$reason, $previous);
                $this->notifyConducteurs($acte, 'Ancien dossier repris : contrôle requis');
                $this->notifyFamily($acte, 'Votre dossier a été rattaché à la campagne');
            }
        });
    }

    public function indicators(ActeLiturgique $acte, CampagneSacrement $campagne): array
    {
        $familyId = $acte->family_id ?: $acte->membre?->family_id;
        $key = $acte->classe_id.':'.$campagne->annee;
        $suivi = $this->fimecoCache[$key] ??= app(FimecoClasseSuiviService::class)->suiviPourClasse($acte->classe_id, $campagne->annee)['suivi'];
        $fimeco = $suivi->firstWhere('family_id', $familyId);
        $rows = Presence::where('membre_famille_id', $acte->membre_id)
            ->whereHas('specialEvent', fn ($q) => $q->where('class_id', $acte->classe_id)
                ->where('is_parish', false)->whereYear('start_date', $campagne->annee)
                ->whereDate('start_date', '<=', today())->where('statut_realisation', 'realisee'))
            ->get()->unique('special_event_id');
        $present = $rows->where('statut', 'present')->count();
        $absent = $rows->where('statut', 'absent')->count();

        return [
            'annee' => $campagne->annee, 'observe_le' => now()->toIso8601String(),
            'fimeco' => $fimeco,
            'assiduite' => ['presents' => $present, 'absents' => $absent,
                'absences_justifiees' => $rows->where('statut', 'absent')->where('justifiee', true)->count(),
                'pointages' => $present + $absent,
                'taux' => $present + $absent > 0 ? round(100 * $present / ($present + $absent), 1) : null],
        ];
    }

    // All mutations lock the campaign first, then dossiers, so a transmission cannot race a correction.
    public function action(User $actor, int $campaignId, array $ids, string $action, array $data): void
    {
        $this->fimecoCache = [];
        DB::transaction(function () use ($actor, $campaignId, $ids, $action, $data) {
            $campaign = CampagneSacrement::lockForUpdate()->findOrFail($campaignId);
            $this->require(! $campaign->archivee_at || $action === 'rectifier', 'Cette campagne est archivée.');
            $actes = ActeLiturgique::where('campagne_id', $campaignId)->whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get();
            $this->require($actes->count() === count(array_unique($ids)), 'La sélection contient un dossier introuvable.');
            foreach ($actes as $acte) {
                abort_unless(Access::reads($actor, $acte), 403);
                $suivi = $acte->suivi_sacrement;
                $stage = $suivi['etape'];
                $this->require($stage !== 'archive' || $action === 'rectifier', 'Un dossier archivé est en lecture seule.');
                if (isset($data['revisions'])) {
                    $this->require(isset($data['revisions'][$acte->id]) && (int) $data['revisions'][$acte->id] === (int) $suivi['revision'], 'Un dossier sélectionné a changé. Actualisez la page.');
                }
                if (isset($data['revision'])) {
                    $this->require((int) $data['revision'] === (int) $suivi['revision'], 'Le dossier a changé. Actualisez la page.');
                }
                $comment = trim($data['commentaire'] ?? '');
                $previous = $acte->statut;
                switch ($action) {
                    case 'corriger':
                    case 'soumettre':
                        abort_unless(Access::owns($actor, $acte), 403);
                        $this->require(in_array($stage, ['brouillon', 'a_corriger'], true), 'Ce dossier ne peut pas être modifié.');
                        if ($stage === 'brouillon') {
                            $this->require($campaign->isCurrentlyOpen(), 'Les inscriptions sont fermées.');
                        }
                        $acte->details = array_merge($acte->details ?? [], $data['details']);
                        $suivi['etape'] = 'soumis';
                        unset($suivi['controle']);
                        $this->notifyConducteurs($acte, 'Dossier soumis après complément');
                        break;
                    case 'valider':
                    case 'retourner':
                    case 'exclure':
                        abort_unless($actor->role === 'conducteur' && (int) $actor->classe_id === (int) $acte->classe_id, 403);
                        $this->require(in_array($stage, ['soumis', 'a_corriger', 'controle'], true), 'Ce dossier est déjà transmis ou clos.');
                        if ($action === 'valider') {
                            if ($acte->type_acte === 'premiere_communion') {
                                User::lockForUpdate()->findOrFail($acte->membre_id);
                                $record = UserSacrement::firstOrNew(['user_id' => $acte->membre_id]);
                                if (! $record->baptise) {
                                    $baptism = $acte->details ?? [];
                                    $this->require(! empty($baptism['bapteme_date']) && trim($baptism['bapteme_lieu'] ?? '') !== '', 'Baptême à vérifier : complétez la date et le lieu du baptême reçu avant la validation du conducteur.');
                                    \Illuminate\Support\Facades\Validator::make($baptism, [
                                        'bapteme_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
                                        'bapteme_lieu' => ['required', 'string', 'max:255'],
                                    ])->validate();
                                    $record->fill(['baptise' => true, 'bapteme_date' => $baptism['bapteme_date'], 'bapteme_lieu' => $baptism['bapteme_lieu']])->save();
                                    $suivi['bapteme_verifie'] = ['date' => $baptism['bapteme_date'], 'lieu' => $baptism['bapteme_lieu'], 'acteur_id' => $actor->id, 'verifie_le' => now()->toIso8601String()];
                                }
                            }
                            $this->require($stage !== 'a_corriger', 'Le responsable de famille doit d’abord soumettre les corrections.');
                            $suivi['controle'] = $this->indicators($acte, $campaign) + ['acteur_id' => $actor->id, 'observation' => $comment];
                            $suivi['etape'] = 'controle';
                        } else {
                            $this->require($comment !== '', 'Le motif est obligatoire.');
                            $suivi['etape'] = $action === 'retourner' ? 'a_corriger' : 'refuse';
                            unset($suivi['controle']);
                        }
                        $acte->conducteur_id = $actor->id;
                        $acte->note_conducteur = $comment;
                        $acte->statut = $action === 'exclure' ? 'REFUSEE_PAR_CONDUCTEUR' : 'EN_ATTENTE_CONDUCTEUR';
                        break;
                    case 'annuler':
                        abort_unless(Access::owns($actor, $acte) || ($actor->role === 'admin' && $stage === 'brouillon' && ! $campaign->isCurrentlyOpen()), 403);
                        $this->require(in_array($stage, ['brouillon', 'soumis', 'a_corriger', 'controle'], true), 'Un dossier transmis ne peut plus être retiré par la famille.');
                        $this->require($comment !== '', 'Le motif est obligatoire.');
                        $suivi['etape'] = 'annule';
                        $acte->statut = 'TERMINE';
                        break;
                    case 'planifier':
                        abort_unless($actor->role === 'pasteur', 403);
                        $this->require(in_array($stage, ['admis', 'partiel'], true), 'La préparation concerne les candidats admis.');
                        $suivi['preparation'] = [
                            'date' => $data['date'], 'lieu' => $data['lieu'], 'celebrant' => $data['celebrant'],
                            'formation' => $data['formation'], 'observation' => $comment,
                            'acteur_id' => $actor->id, 'enregistre_le' => now()->toIso8601String(),
                        ];
                        break;
                    case 'rectifier':
                        abort_unless($actor->role === 'pasteur', 403);
                        $this->require($comment !== '', 'Un motif de rectification est obligatoire.');
                        $type = $data['sacrements'][$acte->id] ?? $data['sacrement'];
                        $old = $suivi['celebrations'][$type] ?? null;
                        $this->require($old !== null, 'Aucun certificat à rectifier pour ce sacrement.');
                        User::lockForUpdate()->findOrFail($acte->membre_id);
                        $record = UserSacrement::where('user_id', $acte->membre_id)->lockForUpdate()->firstOrFail();
                        $suivi['versions_certificats'][$type][] = $old;
                        $suivi['celebrations'][$type] = array_merge($old, [
                            'date' => $data['date'], 'lieu' => $data['lieu'], 'celebrant' => $data['celebrant'],
                            'version' => ($old['version'] ?? 1) + 1, 'rectifie_par' => $actor->id,
                            'rectifie_le' => now()->toIso8601String(), 'motif_rectification' => $comment,
                        ]);
                        $record->update([$type.'_date' => $data['date'], $type.'_lieu' => $data['lieu']]);
                        break;
                    case 'celebrer':
                        abort_unless($actor->role === 'pasteur', 403);
                        $this->require(in_array($stage, ['admis', 'partiel'], true), 'Seul un candidat admis peut être confirmé.');
                        $type = $data['sacrements'][$acte->id] ?? $data['sacrement'];
                        foreach ($type === 'bapteme_premiere_communion' ? ['bapteme', 'premiere_communion'] : [$type] as $sacrement) {
                            $this->celebrate($acte, $suivi, array_replace($data, ['sacrement' => $sacrement]), $actor);
                        }
                        break;
                    case 'reporter':
                        abort_unless($actor->role === 'pasteur', 403);
                        $this->require(in_array($stage, ['admis', 'partiel'], true), 'Seul un candidat admis peut être reporté.');
                        $this->require($comment !== '', 'Précisez le motif et la suite prévue.');
                        $suivi['etape'] = 'reporte';
                        $acte->statut = 'TERMINE';
                        break;
                    case 'archiver':
                        abort_unless($actor->role === 'admin', 403);
                        $this->require(in_array($stage, self::TERMINAUX, true), 'Le dossier doit avoir une issue finale avant archivage.');
                        $suivi['issue'] = $stage;
                        $suivi['etape'] = 'archive';
                        $suivi['archive_le'] = now()->toIso8601String();
                        $acte->statut = 'ARCHIVEE';
                        break;
                    default: abort(422, 'Action inconnue.');
                }
                $suivi['revision'] = ($suivi['revision'] ?? 0) + 1;
                if ($action !== 'archiver' || $comment !== '') {
                    $suivi['observation'] = $comment;
                }
                $acte->suivi_sacrement = $suivi;
                $acte->save();
                $this->history($acte, $actor, $action.($comment ? ' : '.$comment : ''), $previous);
                if (! in_array($action, ['corriger', 'soumettre'], true)) {
                    $this->notifyFamily($acte, 'Inscription : '.$suivi['etape']);
                }
            }
        });
    }

    private function celebrate(ActeLiturgique $acte, array &$suivi, array $data, User $actor): void
    {
        $type = $data['sacrement'];
        $this->require(in_array($type, $this->sacrements($acte->type_acte), true), 'Ce sacrement ne figure pas dans la demande.');
        $this->require(empty($suivi['celebrations'][$type]), 'Ce sacrement est déjà confirmé.');
        // Lock the member too: two campaigns must never grant the same sacrament twice.
        $member = User::lockForUpdate()->findOrFail($acte->membre_id);
        $record = UserSacrement::firstOrNew(['user_id' => $member->id]);
        if ($type === 'premiere_communion') {
            $this->require((bool) $record->baptise, 'Confirmez le baptême avant la première communion.');
        }
        $field = $type === 'bapteme' ? 'baptise' : 'premiere_communion';
        $this->require(! $record->$field, 'Ce sacrement est déjà enregistré sur la fiche du membre.');
        $record->fill([$field => true, $type.'_date' => $data['date'], $type.'_lieu' => $data['lieu']])->save();
        $suivi['celebrations'][$type] = [
            'reference' => $acte->reference.'-'.($type === 'bapteme' ? 'B' : 'C'),
            'date' => $data['date'], 'lieu' => $data['lieu'], 'celebrant' => $data['celebrant'],
            'version' => 1, 'confirme_par' => $actor->id, 'confirme_le' => now()->toIso8601String(),
            'nom' => trim($member->prenom.' '.$member->nom), 'classe' => $acte->classe?->nom,
        ];
        $suivi['etape'] = count($suivi['celebrations']) === count($this->sacrements($acte->type_acte)) ? 'celebre' : 'partiel';
        $acte->statut = $suivi['etape'] === 'celebre' ? 'CELEBRE' : 'VALIDEE';
        $acte->pasteur_id = $actor->id;
    }

    public function transmit(User $actor, int $campaignId): ListeSacrement
    {
        abort_unless($actor->role === 'conducteur' && $actor->classe_id, 403);

        return DB::transaction(function () use ($actor, $campaignId) {
            $campaign = CampagneSacrement::lockForUpdate()->findOrFail($campaignId);
            $this->require(! $campaign->archivee_at, 'Cette campagne est archivée.');
            $this->require($campaign->statut === 'fermee' || ($campaign->statut === 'ouverte' && $campaign->date_fermeture->lt(today())), 'La transmission est possible uniquement après la fermeture des inscriptions.');
            $last = ListeSacrement::where('campagne_id', $campaignId)->where('classe_id', $actor->classe_id)->latest('version')->lockForUpdate()->first();
            $this->require(! $last || str_starts_with($last->statut, 'retour_') || in_array($last->statut, ['validee', 'refusee'], true), 'La liste de cette classe a déjà été transmise.');
            $actes = ActeLiturgique::where('campagne_id', $campaignId)->where('classe_id', $actor->classe_id)->lockForUpdate()->get();
            $pending = $actes->filter(fn ($a) => in_array($a->suivi_sacrement['etape'], ['soumis', 'a_corriger'], true));
            $this->require($pending->isEmpty(), 'Vérifiez ou excluez avec un motif tous les dossiers soumis avant de transmettre.');
            $accepted = $actes->filter(fn ($a) => $a->suivi_sacrement['etape'] === 'controle');
            $this->require($accepted->isNotEmpty(), 'Aucun candidat validé à transmettre.');
            $destination = $last?->statut === 'retour_pasteur' ? 'pasteur' : 'bureau';
            $list = ListeSacrement::create([
                'campagne_id' => $campaignId, 'classe_id' => $actor->classe_id, 'version' => ($last?->version ?? 0) + 1,
                'statut' => $destination,
                'candidats' => $accepted->map(fn ($a) => ['id' => $a->id, 'reference' => $a->reference,
                    'nom' => trim($a->membre?->prenom.' '.$a->membre?->nom), 'type' => $a->type_acte,
                    'details' => $a->details, 'controle' => $a->suivi_sacrement['controle']])->values()->all(),
                'journal' => [$this->event($actor, 'transmission_'.$destination)],
            ]);
            foreach ($accepted as $acte) {
                $previous = $acte->statut;
                $suivi = $acte->suivi_sacrement;
                $suivi['etape'] = 'transmis';
                $suivi['revision']++;
                $acte->update(['liste_sacrement_id' => $list->id, 'suivi_sacrement' => $suivi,
                    'statut' => $destination === 'bureau' ? 'TRANSMISE_AU_BUREAU_CONDUCTEUR' : 'TRANSMISE_AU_PASTEUR']);
                $this->history($acte, $actor, 'Transmission liste version '.$list->version, $previous);
                $this->notifyFamily($acte, 'Liste de classe transmise au '.$destination);
            }
            $this->notifyReviewers($destination, 'Liste de classe à valider');

            return $list;
        });
    }

    public function decidePastoralCandidates(User $actor, array $candidates, string $decision, string $comment): void
    {
        abort_unless($actor->role === 'pasteur', 403);
        $this->require(in_array($decision, ['valider', 'refuser'], true), 'Décision invalide.');
        $this->require($decision !== 'refuser' || trim($comment) !== '', 'Le motif du refus est obligatoire.');
        DB::transaction(function () use ($actor, $candidates, $decision, $comment) {
            $listIds = collect($candidates)->pluck('liste_id')->unique()->sort()->values();
            $initial = ListeSacrement::whereIn('id', $listIds)->get();
            $this->require($initial->count() === $listIds->count(), 'Une liste est introuvable.');
            foreach ($initial->pluck('campagne_id')->unique()->sort() as $id) {
                $campaign = CampagneSacrement::lockForUpdate()->findOrFail($id);
                $this->require(! $campaign->archivee_at, 'Cette campagne est archivée.');
            }
            $lists = ListeSacrement::whereIn('id', $listIds)->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            foreach ($lists as $list) {
                $this->require($list->statut === 'pasteur', 'Une liste a déjà été traitée. Actualisez la page.');
            }
            foreach (collect($candidates)->sortBy('id') as $candidate) {
                $list = $lists[$candidate['liste_id']];
                $acte = ActeLiturgique::where('liste_sacrement_id', $list->id)->lockForUpdate()->findOrFail($candidate['id']);
                $suivi = $acte->suivi_sacrement;
                $this->require(($suivi['etape'] ?? '') === 'transmis' && $acte->statut === 'TRANSMISE_AU_PASTEUR', 'Un candidat a déjà été traité. Actualisez la page.');
                $this->require((int) $suivi['revision'] === (int) $candidate['revision'], 'Le dossier a changé. Actualisez la page.');
                $previous = $acte->statut;
                $suivi['etape'] = $decision === 'valider' ? 'admis' : 'refuse';
                $suivi['revision']++;
                $suivi['observation'] = $comment;
                $acte->update(['suivi_sacrement' => $suivi, 'pasteur_id' => $actor->id, 'statut' => $decision === 'valider' ? 'VALIDEE' : 'REFUSEE_PAR_PASTEUR']);
                $list->journal = [...$list->journal, $this->event($actor, 'decision_candidat_pasteur', $acte->reference.' : '.$decision.' — '.$comment) + ['candidat_id' => $acte->id, 'decision' => $decision]];
                $list->save();
                $this->history($acte, $actor, 'Décision pastorale individuelle : '.$decision.' — '.$comment, $previous);
                if ($decision === 'valider') {
                    $this->notifyAdmissionChain($acte);
                } else {
                    $this->notifyFamily($acte, 'Décision pastorale : '.$decision);
                    $this->notifyConducteurs($acte, 'Décision pastorale : '.$decision);
                }
            }
            foreach ($lists as $list) {
                $remaining = ActeLiturgique::where('liste_sacrement_id', $list->id)->where('suivi_sacrement->etape', 'transmis')->exists();
                if (! $remaining) {
                    $admitted = ActeLiturgique::where('liste_sacrement_id', $list->id)->where(function ($q) { $q->whereIn('suivi_sacrement->etape', ['admis', 'partiel', 'celebre'])->orWhere('suivi_sacrement->issue', 'celebre'); })->exists();
                    $list->update(['statut' => $admitted ? 'validee' : 'refusee']);
                }
                if ($decision !== 'valider') {
                    $this->notifyReviewers('bureau', 'Décisions pastorales enregistrées pour la liste de classe #'.$list->classe_id);
                }
            }
        });
    }

    public function refuseCandidate(User $actor, int $listId, int $candidateId, string $comment): void
    {
        abort_unless(Access::bureau($actor), 403);
        $this->require(trim($comment) !== '', 'Le motif du refus est obligatoire.');
        $initial = ListeSacrement::findOrFail($listId);
        DB::transaction(function () use ($actor, $initial, $candidateId, $comment) {
            $campaign = CampagneSacrement::lockForUpdate()->findOrFail($initial->campagne_id);
            $this->require(! $campaign->archivee_at, 'Cette campagne est archivée.');
            $list = ListeSacrement::lockForUpdate()->findOrFail($initial->id);
            $this->require($list->statut === 'bureau', 'La liste a déjà été traitée. Actualisez la page.');
            $acte = ActeLiturgique::where('liste_sacrement_id', $list->id)->lockForUpdate()->findOrFail($candidateId);
            $this->require(($acte->suivi_sacrement['etape'] ?? '') === 'transmis', 'Ce candidat a déjà été traité.');
            $previous = $acte->statut;
            $suivi = $acte->suivi_sacrement;
            $suivi['etape'] = 'refuse';
            $suivi['revision']++;
            $suivi['observation'] = $comment;
            $acte->update(['suivi_sacrement' => $suivi, 'statut' => 'REFUSEE_PAR_BUREAU_CONDUCTEUR', 'bureau_conducteur_id' => $actor->id]);
            $list->journal = [...$list->journal, $this->event($actor, 'refus_candidat', $acte->reference.' : '.$comment) + ['candidat_id' => $acte->id]];
            if (! ActeLiturgique::where('liste_sacrement_id', $list->id)->where('suivi_sacrement->etape', 'transmis')->exists()) {
                $list->statut = 'refusee';
            }
            $list->save();
            $this->history($acte, $actor, 'Refus individuel par le bureau : '.$comment, $previous);
            $this->notifyFamily($acte, 'Inscription refusée par le bureau : '.$comment);
        });
    }

    public function decideList(User $actor, int $id, string $decision, string $comment, string $expected): void
    {
        $initial = ListeSacrement::findOrFail($id);
        DB::transaction(function () use ($actor, $initial, $decision, $comment, $expected) {
            $campaign = CampagneSacrement::lockForUpdate()->findOrFail($initial->campagne_id);
            $this->require(! $campaign->archivee_at, 'Cette campagne est archivée.');
            $list = ListeSacrement::lockForUpdate()->findOrFail($initial->id);
            $stage = $list->statut;
            $this->require($stage === $expected && in_array($stage, ['bureau', 'pasteur'], true), 'La liste a déjà été traitée. Actualisez la page.');
            abort_unless($stage === 'bureau' ? Access::bureau($actor) : $actor->role === 'pasteur', 403);
            $this->require(in_array($decision, ['valider', 'retourner', 'refuser'], true), 'Décision invalide.');
            if ($decision !== 'valider') {
                $this->require(trim($comment) !== '', 'Le motif est obligatoire.');
            }
            $list->statut = match ($decision) {
                'retourner' => 'retour_'.$stage,
                'refuser' => 'refusee',
                default => $stage === 'bureau' ? 'pasteur' : 'validee',
            };
            $list->journal = [...$list->journal, $this->event($actor, $decision.'_'.$stage, $comment)];
            $list->save();
            foreach (ActeLiturgique::where('liste_sacrement_id', $list->id)->lockForUpdate()->get() as $acte) {
                if (collect($list->journal)->contains(fn ($entry) => in_array(($entry['action'] ?? ''), ['refus_candidat', 'decision_candidat_pasteur'], true) && (int) ($entry['candidat_id'] ?? 0) === (int) $acte->id)) {
                    continue;
                }
                $previous = $acte->statut;
                $suivi = $acte->suivi_sacrement;
                if ($decision === 'retourner') {
                    $suivi['etape'] = 'soumis';
                    unset($suivi['controle']);
                    $acte->statut = 'EN_ATTENTE_CONDUCTEUR';
                    $this->notifyConducteurs($acte, 'Liste retournée : '.$comment);
                } elseif ($decision === 'refuser') {
                    $suivi['etape'] = 'refuse';
                    $acte->statut = $stage === 'bureau' ? 'REFUSEE_PAR_BUREAU_CONDUCTEUR' : 'REFUSEE_PAR_PASTEUR';
                } else {
                    $suivi['etape'] = $stage === 'bureau' ? 'transmis' : 'admis';
                    $acte->statut = $stage === 'bureau' ? 'TRANSMISE_AU_PASTEUR' : 'VALIDEE';
                }
                $suivi['revision']++;
                $suivi['observation'] = $comment;
                $acte->suivi_sacrement = $suivi;
                if ($stage === 'bureau') {
                    $acte->bureau_conducteur_id = $actor->id;
                } else {
                    $acte->pasteur_id = $actor->id;
                }
                $acte->save();
                $this->history($acte, $actor, 'Liste v'.$list->version.' : '.$decision.' — '.$comment, $previous);
                if ($stage === 'pasteur' && $decision === 'valider') {
                    $this->notifyAdmissionChain($acte);
                } else {
                    $this->notifyFamily($acte, 'Décision sur la liste : '.$decision);
                }
                if ($stage === 'pasteur' && $decision === 'refuser') {
                    $this->notifyConducteurs($acte, 'Décision pastorale sur la liste : '.$decision);
                }
            }
            if ($stage === 'pasteur' && $decision !== 'valider') {
                $this->notifyReviewers('bureau', 'Décision pastorale sur la liste de classe #'.$list->classe_id.' : '.$decision);
            }
            if ($stage === 'bureau' && $decision === 'valider') {
                $this->notifyReviewers('pasteur', 'Liste transmise pour décision pastorale');
            }
        });
    }

    public function archiveCampaign(User $actor, int $id): void
    {
        abort_unless($actor->role === 'admin', 403);
        DB::transaction(function () use ($actor, $id) {
            $campaign = CampagneSacrement::lockForUpdate()->findOrFail($id);
            $this->require(! $campaign->archivee_at && ! $campaign->isCurrentlyOpen(), 'Fermez la campagne avant son archivage.');
            $actes = ActeLiturgique::where('campagne_id', $id)->lockForUpdate()->get();
            $this->require($actes->every(fn ($a) => $a->suivi_sacrement['etape'] === 'archive'), 'Tous les dossiers, y compris les brouillons annulés, doivent être archivés.');
            foreach (ListeSacrement::where('campagne_id', $id)->lockForUpdate()->get() as $list) {
                $list->update(['journal' => [...$list->journal, $this->event($actor, 'archivage_campagne')]]);
            }
            $campaign->update(['statut' => 'fermee', 'archivee_at' => now(), 'journal' => [...($campaign->journal ?? []), $this->event($actor, 'archivage')]]);
        });
    }

    public function history(ActeLiturgique $acte, User $actor, string $comment, ?string $previous): void
    {
        ActeLiturgiqueHistorique::create(['acte_id' => $acte->id, 'statut_precedent' => $previous,
            'statut_nouveau' => $acte->statut, 'acteur_id' => $actor->id, 'commentaire' => $comment]);
    }

    public function event(User $actor, string $action, string $comment = ''): array
    {
        return ['acteur_id' => $actor->id, 'acteur' => trim($actor->prenom.' '.$actor->nom),
            'action' => $action, 'commentaire' => $comment, 'date' => now()->toIso8601String()];
    }

    private function notifyAdmissionChain(ActeLiturgique $acte): void
    {
        $users = User::where(function ($query) use ($acte) {
            $query->whereIn('role', ['pasteur', 'bureau_conducteur', 'conducteur']);
            if ($acte->family_id) {
                $query->orWhere('family_id', $acte->family_id);
            }
        })->with('fonction')->get()->filter(function ($user) use ($acte) {
            return $user->role === 'pasteur' || Access::bureau($user)
                || ($user->role === 'conducteur' && $acte->classe_id && (int) $user->classe_id === (int) $acte->classe_id)
                || (Access::responsable($user) && (int) $user->family_id === (int) $acte->family_id);
        })->unique('id');
        $name = trim(($acte->membre?->prenom ?? '').' '.($acte->membre?->nom ?? ''));
        foreach ($users as $user) {
            $this->notify($user, 'Admission validée par le pasteur : '.$name.' ('.$acte->reference.'). La célébration reste à enregistrer.');
        }
    }

    private function notifyFamily(ActeLiturgique $acte, string $message): void
    {
        $users = User::where('family_id', $acte->family_id)->where(fn ($q) => $q->whereIn('role', ['responsable_famille', 'responsable'])->orWhere('is_family_responsible', true))->get();
        foreach ($users as $user) {
            $this->notify($user, $message.' ('.$acte->reference.')');
        }
    }

    private function notifyConducteurs(ActeLiturgique $acte, string $message): void
    {
        foreach (User::where('role', 'conducteur')->where('classe_id', $acte->classe_id)->get() as $user) {
            $this->notify($user, $message);
        }
    }

    private function notifyReviewers(string $stage, string $message): void
    {
        $users = $stage === 'pasteur' ? User::where('role', 'pasteur')->get()
            : User::whereIn('role', ['bureau_conducteur', 'conducteur'])->with('fonction')->get()->filter(fn ($u) => Access::bureau($u));
        foreach ($users as $user) {
            $this->notify($user, $message);
        }
    }

    private function notify(User $user, string $message): void
    {
        Notification::create(['user_id' => $user->id, 'channel' => 'in_app', 'to' => $user->email ?? '',
            'subject' => 'Baptême et première communion', 'body' => $message,
            'data' => ['link' => route('sacrements.index')], 'sent_at' => now()]);
    }
}
