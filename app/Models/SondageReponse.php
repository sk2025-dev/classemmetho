<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SondageReponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'sondage_id',
        'respondent_key',
        'respondent_profile',
        'reponses',
        'submitted_at',
    ];

    protected $casts = [
        'respondent_profile' => 'array',
        'reponses' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function sondage()
    {
        return $this->belongsTo(Sondage::class);
    }
}
