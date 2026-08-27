<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FimecoSouscription extends Model
{
    protected $fillable = [
        'family_id',
        'classe_id',
        'annee',
        'montant_souscrit',
        'created_by',
    ];

    protected $casts = [
        'annee' => 'integer',
        'montant_souscrit' => 'integer',
    ];

    public function family()
    {
        return $this->belongsTo(Family::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
