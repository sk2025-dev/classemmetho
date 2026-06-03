<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Don extends Model
{
    use HasFactory;

    public const TYPE_LIBRE = 'LIBRE';
    public const TYPE_CAMPAGNE = 'CAMPAGNE';

    protected $fillable = [
        'family_id',
        'user_id',
        'campagne_id',
        'montant',
        'type',
        'mode_paiement',
        'date_don',
        'reference_recu',
        'note',
    ];

    protected $casts = [
        'date_don' => 'date',
    ];

    public function family()
    {
        return $this->belongsTo(Family::class, 'family_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function campagne()
    {
        return $this->belongsTo(Campagne::class, 'campagne_id');
    }
}
