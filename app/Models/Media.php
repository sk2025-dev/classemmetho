<?php

namespace App\Models;

// app/Models/Media.php

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $fillable = [
        'title',
        'description',
        'date',
        'type',
        'url',
        'thumbnail',
        'class_id',
        'special_event_id', // Nouveau champ pour lier à une activité
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }

    public function specialEvent()
    {
        return $this->belongsTo(SpecialEvent::class, 'special_event_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}