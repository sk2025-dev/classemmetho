<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\PermanentActivity;
use App\Models\SpecialEvent;
use App\Models\User;

class Presence extends Model
{
    use HasFactory;

    public const MOTIF_MALADIE = 'maladie';
    public const MOTIF_EMPECHEMENT_PROFESSIONNEL = 'empechement_professionnel';
    public const MOTIF_EVENEMENT_FAMILIAL = 'evenement_familial';
    public const MOTIF_DECES_PROCHE = 'deces_proche';
    public const MOTIF_AUTRE = 'autre';

    public const MOTIFS_JUSTIFICATION = [
        self::MOTIF_MALADIE => 'Maladie',
        self::MOTIF_EMPECHEMENT_PROFESSIONNEL => 'Empêchement professionnel',
        self::MOTIF_EVENEMENT_FAMILIAL => 'Date coïncide avec un événement familial',
        self::MOTIF_DECES_PROCHE => "Décès d'un proche",
        self::MOTIF_AUTRE => 'Autre',
    ];

    protected $fillable = [
        'activite_id',
        'special_event_id',
        'membre_famille_id',
        'statut',
        'marquee_par',
        'marquee_le',
        'methode',
        'notes',
        'justifiee',
        'motif_justification',
        'motif_justification_detail',
        'justifiee_par',
        'justifiee_le',
    ];

    protected $casts = [
        'marquee_le' => 'datetime',
        'justifiee' => 'boolean',
        'justifiee_le' => 'datetime',
    ];

    public function activite()
    {
        return $this->belongsTo(PermanentActivity::class, 'activite_id');
    }

    public function specialEvent()
    {
        return $this->belongsTo(SpecialEvent::class, 'special_event_id');
    }

    public function membre()
    {
        return $this->belongsTo(User::class, 'membre_famille_id');
    }

    public function marqueePar()
    {
        return $this->belongsTo(User::class, 'marquee_par');
    }

    public function justifieePar()
    {
        return $this->belongsTo(User::class, 'justifiee_par');
    }
}
