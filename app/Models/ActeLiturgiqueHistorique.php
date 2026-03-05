<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActeLiturgiqueHistorique extends Model
{
    use HasFactory;

    protected $table = 'actes_liturgiques_historiques';

    protected $fillable = [
        'acte_id',
        'statut_precedent',
        'statut_nouveau',
        'acteur_id',
        'commentaire',
    ];

    public function acte()
    {
        return $this->belongsTo(ActeLiturgique::class, 'acte_id');
    }

    public function acteur()
    {
        return $this->belongsTo(User::class, 'acteur_id');
    }
}
