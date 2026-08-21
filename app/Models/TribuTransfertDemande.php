<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TribuTransfertDemande extends Model
{
    protected $table = 'tribu_transfert_demandes';

    // Étape 1 : la demande attend la validation du départ par le chef de la
    // tribu d'origine. Étape 2 : le départ est validé, la demande attend la
    // validation de l'arrivée par le chef de la tribu de destination.
    public const STATUT_EN_ATTENTE_ORIGINE = 'en_attente_origine';
    public const STATUT_EN_ATTENTE_DESTINATION = 'en_attente_destination';
    public const STATUT_VALIDEE = 'validee';
    public const STATUT_REFUSEE = 'refusee';

    public const STATUTS_EN_ATTENTE = [
        self::STATUT_EN_ATTENTE_ORIGINE,
        self::STATUT_EN_ATTENTE_DESTINATION,
    ];

    protected $fillable = [
        'membre_id',
        'demandeur_id',
        'tribu_origine_id',
        'tribu_destination_id',
        'statut',
        'motif',
        'origine_valide_par',
        'origine_valide_le',
        'traite_par',
        'traite_le',
        'commentaire',
    ];

    protected $casts = [
        'origine_valide_le' => 'datetime',
        'traite_le' => 'datetime',
    ];

    public function membre()
    {
        return $this->belongsTo(User::class, 'membre_id');
    }

    public function demandeur()
    {
        return $this->belongsTo(User::class, 'demandeur_id');
    }

    public function tribuOrigine()
    {
        return $this->belongsTo(Tribu::class, 'tribu_origine_id');
    }

    public function tribuDestination()
    {
        return $this->belongsTo(Tribu::class, 'tribu_destination_id');
    }

    public function origineValidePar()
    {
        return $this->belongsTo(User::class, 'origine_valide_par');
    }

    public function traitePar()
    {
        return $this->belongsTo(User::class, 'traite_par');
    }
}
