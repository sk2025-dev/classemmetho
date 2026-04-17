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

    protected $fillable = [
        'activite_id',
        'special_event_id',
        'membre_famille_id',
        'statut',
        'marquee_par',
        'marquee_le',
        'methode',
        'notes',
    ];

    protected $casts = [
        'marquee_le' => 'datetime',
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
}
