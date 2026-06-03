<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ville extends Model
{
    use HasFactory;

    protected $table = 'villes';

    protected $fillable = [
        'nom',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec les utilisateurs
     */
    public function users()
    {
        return $this->hasMany(User::class, 'ville_id');
    }

    /**
     * Relation avec les familles
     */
    public function families()
    {
        return $this->hasMany(Family::class, 'ville_id');
    }

    /**
     * Relation avec les inscriptions
     */
    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'ville_id');
    }

    /**
     * Relations pour l'audit
     */
    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
