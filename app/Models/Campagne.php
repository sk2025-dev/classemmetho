<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campagne extends Model
{
    use HasFactory;

    public const SCOPE_GLOBAL = 'GLOBAL';
    public const SCOPE_CLASSE = 'CLASSE';

    public const STATUT_ACTIVE = 'ACTIVE';
    public const STATUT_CLOTUREE = 'CLOTUREE';
    public const STATUT_ANNULEE = 'ANNULEE';

    protected $fillable = [
        'titre',
        'objectif_montant',
        'montant_collecte',
        'scope',
        'classe_id',
        'date_debut',
        'date_fin',
        'statut',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    public function classe()
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    public function dons()
    {
        return $this->hasMany(Don::class, 'campagne_id');
    }
}
