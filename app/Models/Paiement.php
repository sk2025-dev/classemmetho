<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    /* ── Modes de paiement ── */
    public const MODE_MOBILE_MONEY = 'MOBILE_MONEY';
    public const MODE_ESPECES = 'ESPECES';
    public const MODE_VIREMENT = 'VIREMENT';

    /* ── Statuts (anciens, gardés pour compatibilité) ── */
    public const STATUT_PAYE = 'PAYE';
    public const STATUT_PARTIELLEMENT_PAYE = 'PARTIELLEMENT_PAYE';
    public const STATUT_EN_RETARD = 'EN_RETARD';
    public const STATUT_ANNULE = 'ANNULE';

    /* ── Statuts de paiement transactionnel (PayDunya) ── */
    public const PAYMENT_STATUS_INITIE = 'INITIE';
    public const PAYMENT_STATUS_EN_ATTENTE = 'EN_ATTENTE';
    public const PAYMENT_STATUS_PAYE = 'PAYE';
    public const PAYMENT_STATUS_ECHEC = 'ECHEC';
    public const PAYMENT_STATUS_ANNULE = 'ANNULE';
    public const PAYMENT_STATUS_EXPIRE = 'EXPIRE';

    /* ── Fournisseurs mobile ── */
    public const PROVIDER_WAVE = 'wave';
    public const PROVIDER_ORANGE = 'orange';
    public const PROVIDER_MTN = 'mtn';

    protected $fillable = [
        'family_id',
        'user_id',
        'cotisation_id',
        'montant',
        'year',
        'mode_paiement',
        'provider',
        'date_paiement',
        'reference_recu',
        'statut',
        'payment_status',
        'paydunya_transaction_id',
        'paydunya_reference',
        'return_url',
        'paydunya_response',
        'note',
    ];

    protected $casts = [
        'date_paiement' => 'date',
    ];

    public function family()
    {
        return $this->belongsTo(Family::class, 'family_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cotisation()
    {
        return $this->belongsTo(Cotisation::class, 'cotisation_id');
    }
}
