<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationFinanciere extends Model
{
    use HasFactory;

    protected $table = 'notifications_financieres';

    protected $fillable = [
        'user_id',
        'type',
        'entity_id',
        'entity_type',
        'titre',
        'message',
        'lue',
        'lue_at',
    ];

    protected $casts = [
        'lue' => 'boolean',
        'lue_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
