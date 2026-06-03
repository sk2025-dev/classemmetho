<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sondage extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'public_token',
        'classe_id',
        'created_by',
        'titre',
        'description',
        'objectif',
        'audience',
        'date_echeance',
        'anonymat',
        'message_fin',
        'diffusion',
        'questions',
        'statut',
        'response_count',
        'published_at',
    ];

    protected $casts = [
        'date_echeance' => 'date',
        'published_at' => 'datetime',
        'questions' => 'array',
        'anonymat' => 'boolean',
    ];

    public function classe()
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    public function createur()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function responses()
    {
        return $this->hasMany(SondageReponse::class);
    }
}
