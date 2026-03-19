<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cotisation extends Model
{
    use HasFactory;

    public const PERIODICITE_MENSUEL = 'MENSUEL';
    public const PERIODICITE_TRIMESTRIEL = 'TRIMESTRIEL';
    public const PERIODICITE_ANNUEL = 'ANNUEL';
    public const PERIODICITE_UNIQUE = 'UNIQUE';

    public const STATUT_ACTIVE = 'ACTIVE';
    public const STATUT_SUSPENDUE = 'SUSPENDUE';
    public const STATUT_ANNULEE = 'ANNULEE';

    public const TARGET_SCOPE_FAMILLE = 'FAMILLE';
    public const TARGET_SCOPE_INDIVIDUELLE = 'INDIVIDUELLE';

    protected $fillable = [
        'nom',
        'montant',
        'periodicite',
        'statut',
        'target_scope',
        'classe_id',
        'created_by',
        'description',
        'date_debut',
        'date_fin',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    public function classe()
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class, 'cotisation_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
