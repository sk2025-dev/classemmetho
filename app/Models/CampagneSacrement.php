<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class CampagneSacrement extends Model
{
    public const STATUT_BROUILLON = 'brouillon';

    public const STATUT_OUVERTE = 'ouverte';

    public const STATUT_FERMEE = 'fermee';

    protected $table = 'campagnes_sacrements';

    protected $fillable = [
        'archivee_at',
        'journal',
        'annee',
        'titre',
        'date_ouverture',
        'date_fermeture',
        'statut',
        'reouverte_at',
        'reouverte_par',
        'motif_reouverture',
        'created_by',
        'fermee_par',
        'fermee_at',
    ];

    protected $casts = [
        'archivee_at' => 'datetime',
        'journal' => 'array',
        'annee' => 'integer',
        'date_ouverture' => 'date',
        'date_fermeture' => 'date',
        'reouverte_at' => 'datetime',
        'fermee_at' => 'datetime',
    ];

    public function createur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reouvertPar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reouverte_par');
    }

    public function fermeePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fermee_par');
    }

    public function isCurrentlyOpen(?Carbon $at = null): bool
    {
        if ($this->archivee_at || $this->statut !== self::STATUT_OUVERTE) {
            return false;
        }

        if (! $this->date_ouverture || ! $this->date_fermeture) {
            return false;
        }

        $day = ($at ?? now())->toDateString();

        return $day >= $this->date_ouverture->toDateString()
            && $day <= $this->date_fermeture->toDateString();
    }

    public function toPublicArray(): array
    {
        $open = $this->isCurrentlyOpen();

        return [
            'id' => $this->id,
            'annee' => $this->annee,
            'titre' => $this->titre,
            'date_ouverture' => $this->date_ouverture?->format('Y-m-d'),
            'date_fermeture' => $this->date_fermeture?->format('Y-m-d'),
            'statut' => $this->statut,
            'est_ouverte' => $open,
            'archivee_at' => $this->archivee_at?->toIso8601String(),
            'reouverte_at' => $this->reouverte_at?->toIso8601String(),
            'motif_reouverture' => $this->motif_reouverture,
        ];
    }
}
