<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Priere extends Model
{
    use HasFactory;

    protected $table = 'prieres';

    protected $fillable = [
        'user_id',
        'classe_id',
        'role_soumission',
        'sujet',
        'demande',
        'est_anonyme',
        'nom_affiche',
        'statut',
        'temoignage',
        'reactions_emoji',
        'vue_le',
        'prise_en_priere_le',
        'exaucee_le',
        'vue_par_pasteur_id',
        'prise_en_priere_par_pasteur_id',
        'exaucee_par_pasteur_id',
    ];

    protected $casts = [
        'est_anonyme' => 'boolean',
        'reactions_emoji' => 'array',
        'vue_le' => 'datetime',
        'prise_en_priere_le' => 'datetime',
        'exaucee_le' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    public function viewedByPastor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vue_par_pasteur_id');
    }

    public function prayedByPastor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prise_en_priere_par_pasteur_id');
    }

    public function fulfilledByPastor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'exaucee_par_pasteur_id');
    }
}
