<?php

namespace App\Models;

use App\Models\Classe;
use App\Models\Family;
use App\Models\FormationRequestHistorique;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FormationRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reference',
        'membre_id',
        'conducteur_id',
        'formation_terminee_by',
        'classe_id',
        'family_id',
        'created_by',
        'statut',
        'type_formation',
        'conjoint_nom',
        'conjoint_contact',
        'conjoint_phone',
        'conjoint_profession',
        'conjoint_birthdate',
        'conjoint_baptized',
        'conjoint_church',
        'message',
        'formation_terminee_at',
        'details',
    ];

    protected $casts = [
        'conjoint_baptized' => 'boolean',
        'conjoint_birthdate' => 'date',
        'formation_terminee_at' => 'datetime',
        'details' => 'array',
    ];

    public function membre(): BelongsTo
    {
        return $this->belongsTo(User::class, 'membre_id');
    }

    public function conducteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'conducteur_id');
    }

    public function formationTermineePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'formation_terminee_by');
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class, 'family_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function historiques(): HasMany
    {
        return $this->hasMany(FormationRequestHistorique::class, 'formation_request_id')->latest();
    }

    public function actes(): HasMany
    {
        return $this->hasMany(ActeLiturgique::class, 'formation_request_id');
    }
}
