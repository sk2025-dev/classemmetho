<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListeSacrement extends Model
{
    protected $table = 'listes_sacrements';

    protected $guarded = ['id'];

    protected $casts = ['candidats' => 'array', 'journal' => 'array'];

    public function scopeWithPastoralDecisions($query)
    {
        $actions = ['decision_candidat_pasteur', 'valider_pasteur', 'refuser_pasteur', 'retourner_pasteur'];
        // SQLite's JSON containment compares whole objects; inspect the action field instead.
        if ($query->getConnection()->getDriverName() === 'sqlite') {
            return $query->whereRaw("exists (select 1 from json_each(listes_sacrements.journal) where json_extract(value, '$.action') in (?, ?, ?, ?))", $actions);
        }

        return $query->where(function ($query) use ($actions) {
            foreach ($actions as $action) {
                $query->orWhereJsonContains('journal', ['action' => $action]);
            }
        });
    }

    /** Read the frozen list and its journal, even after a dossier moves to another version. */
    public function pastoralCandidates(): array
    {
        $journal = collect($this->journal ?? []);
        $listDecision = $journal->last(fn ($event) => in_array($event['action'] ?? '', ['valider_pasteur', 'refuser_pasteur', 'retourner_pasteur'], true));

        return collect($this->candidats ?? [])->map(function ($candidate) use ($journal, $listDecision) {
            $individual = $journal->last(fn ($event) => ($event['action'] ?? '') === 'decision_candidat_pasteur' && (int) ($event['candidat_id'] ?? 0) === (int) $candidate['id']);
            $refusedByBureau = $journal->contains(fn ($event) => ($event['action'] ?? '') === 'refus_candidat' && (int) ($event['candidat_id'] ?? 0) === (int) $candidate['id']);
            $event = $individual ?? ($refusedByBureau ? null : $listDecision);
            if (! $event) {
                return null;
            }

            return $candidate + ['decision_pastorale' => [
                'decision' => $individual ? $event['decision'] : str_replace('_pasteur', '', $event['action']),
                'date' => $event['date'] ?? null,
                'acteur' => $event['acteur'] ?? '',
                'commentaire' => $event['commentaire'] ?? '',
            ]];
        })->filter()->values()->all();
    }

    public function dossiers()
    {
        return $this->hasMany(ActeLiturgique::class, 'liste_sacrement_id');
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }

    public function campagne()
    {
        return $this->belongsTo(CampagneSacrement::class);
    }
}
