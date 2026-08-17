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
        'chef_id',
        'status',
    ];

    public function classe()
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    public function chef()
    {
        return $this->belongsTo(User::class, 'chef_id');
    }

    public function membres()
    {
        return $this->hasMany(User::class, 'tribu_id');
    }
}
