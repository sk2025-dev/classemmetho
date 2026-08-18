<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tribu extends Model
{
    protected $table = 'tribus';

    protected $fillable = [
        'nom',
        'description',
        'classe_id',
        'status',
    ];

    public const MAX_CHEFS = 2;

    public function classe()
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    /**
     * Chefs de la tribu (jusqu'à 2, nommés par le conducteur de la classe).
     */
    public function chefs()
    {
        return $this->belongsToMany(User::class, 'tribu_chefs', 'tribu_id', 'user_id')
            ->withTimestamps();
    }

    public function membres()
    {
        return $this->hasMany(User::class, 'tribu_id');
    }
}
