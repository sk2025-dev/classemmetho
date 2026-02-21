<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\TrackModifications;

class UserSacrement extends Model
{
    use HasFactory, TrackModifications;

    protected $table = 'user_sacrements';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        // Statut matrimonial civil
        'est_marie',
        'mariage_civil_date',
        'mariage_civil_lieu',
        'dot_effectue',
        'dot_date',
        'dot_lieu',
        'est_veuf',
        'deces_conjoint_date',
        'deces_conjoint_lieu',
        'est_divorce',
        'divorce_date',
        'divorce_lieu',
        // Sacrements religieux
        'baptise',
        'bapteme_date',
        'bapteme_lieu',
        'premiere_communion',
        'premiere_communion_date',
        'premiere_communion_lieu',
        'marie_religieusement',
        'mariage_religieux_date',
        'mariage_religieux_lieu',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        // Statut matrimonial civil
        'est_marie' => 'boolean',
        'mariage_civil_date' => 'date',
        'dot_effectue' => 'boolean',
        'dot_date' => 'date',
        'est_veuf' => 'boolean',
        'deces_conjoint_date' => 'date',
        'est_divorce' => 'boolean',
        'divorce_date' => 'date',
        // Sacrements religieux
        'baptise' => 'boolean',
        'bapteme_date' => 'date',
        'premiere_communion' => 'boolean',
        'premiere_communion_date' => 'date',
        'marie_religieusement' => 'boolean',
        'mariage_religieux_date' => 'date',
    ];

    /**
     * L'utilisateur auquel appartient ce sacrement
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Vérifier si l'utilisateur a des sacrements enregistrés
     */
    public function hasSacraments(): bool
    {
        return $this->baptise
            || $this->premiere_communion
            || $this->marie_religieusement
            || $this->est_marie
            || $this->dot_effectue
            || $this->est_veuf
            || $this->est_divorce;
    }

    /**
     * Obtenir un résumé des informations marital et religieuses
     */
    public function getSummary(): array
    {
        return [
            'statut_marital' => [
                'marie' => $this->est_marie ? 'Marié(e)' : null,
                'divorce' => $this->est_divorce ? 'Divorcé(e)' : null,
                'veuf' => $this->est_veuf ? 'Veuf(ve)' : null,
                'dote' => $this->dot_effectue ? 'Doté(e)' : null,
            ],
            'sacrements' => [
                'bapteme' => $this->baptise ? 'Baptisé(e)' : null,
                'premiere_communion' => $this->premiere_communion ? 'Première communion' : null,
                'mariage_religieux' => $this->marie_religieusement ? 'Mariage religieux' : null,
            ],
        ];
    }
}
