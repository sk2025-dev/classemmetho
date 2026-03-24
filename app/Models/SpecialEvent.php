<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SpecialEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'date', 'time', 'category', 'description', 'is_parish'
    ];

    protected $casts = [
        'date' => 'date',        // convertit automatiquement en objet Carbon
        'time' => 'string',      // facultatif, pour garder le format original
    ];
}