<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\TrackModifications;

class Classe extends Model
{
    use SoftDeletes, TrackModifications;

    protected $table = 'classes';

    protected $fillable = [
        'nom',
        'description',
        'conducteur',
        'nombre_membres',
        'status',
        'is_modified',
        'last_modified_at',
        'last_modified_by',
        'deleted_by',
        'is_deleted',
    ];

    protected $dates = ['deleted_at'];

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
