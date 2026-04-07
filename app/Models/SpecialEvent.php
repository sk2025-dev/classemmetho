<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpecialEvent extends Model
{
    protected $fillable = [
        'title',
        'date',
        'time',
        'orateur',
        'moderateur',
        'dirigeant_priere',
        'lieu',  // Changé de 'desc' à 'lieu'
        'class_id',
        'created_by',
        'is_parish'
    ];
    
    // Si vous voulez garder la compatibilité avec l'ancien nom
    public function getDescAttribute()
    {
        return $this->lieu;
    }
    
    public function setDescAttribute($value)
    {
        $this->attributes['lieu'] = $value;
    }
}