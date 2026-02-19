<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\TrackModifications;

class Fonction extends Model
{
    use SoftDeletes, TrackModifications;

    protected $table = 'fonctions';

    protected $fillable = [
        'nom',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Obtenir les utilisateurs ayant cette fonction
     */
    public function users()
    {
        return $this->hasMany(User::class, 'fonction_id');
    }

    /**
     * Obtenir les inscriptions avec cette fonction
     */
    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'fonction_id');
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

