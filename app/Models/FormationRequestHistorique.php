<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormationRequestHistorique extends Model
{
    use HasFactory;

    protected $table = 'formation_request_historiques';

    protected $fillable = [
        'formation_request_id',
        'statut_precedent',
        'statut_nouveau',
        'acteur_id',
        'commentaire',
    ];

    public function formation(): BelongsTo
    {
        return $this->belongsTo(FormationRequest::class, 'formation_request_id');
    }

    public function acteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acteur_id');
    }
}
