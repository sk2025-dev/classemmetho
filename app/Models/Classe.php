<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\TrackModifications;

class Classe extends Model
{
    use TrackModifications;

    protected $table = 'classes';

    protected $fillable = [
        'nom',
        'description',
        'conducteur',
        'nombre_membres',
        'status',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'classe_id');
    }

    public function families()
    {
        return $this->hasMany(Family::class, 'classe_id');
    }

    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'classe_id');
    }

    /**
     * Actes liturgiques liés à cette classe.
     */
    public function actesLiturgiques()
    {
        return $this->hasMany(ActeLiturgique::class, 'classe_id');
    }

    /**
     * Le conducteur responsable de cette classe.
     */
    public function conducteur()
    {
        return $this->belongsTo(User::class, 'conducteur');
    }

    /**
     * Comptes utilisateurs rôle conducteur rattachés à cette classe (classe_id).
     */
    public function conducteurs()
    {
        return $this->hasMany(User::class, 'classe_id')->where('role', 'conducteur');
    }

    /**
     * Programmes d'activités (événements) de la classe.
     */
    public function programmes()
    {
        return $this->hasMany(SpecialEvent::class, 'class_id');
    }

    /**
     * Relations pour l'audit
     */
    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function updatedByUser()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
