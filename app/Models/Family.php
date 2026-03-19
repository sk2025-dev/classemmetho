<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Traits\TrackModifications;

class Family extends Model
{
    use HasFactory, SoftDeletes, TrackModifications;

    protected $fillable = [
        // === INFOS BASIQUES ===
        'nom',
        'code_famille',
        'classe_id',

        // === RESPONSABLE ===
        'responsable_id',
        'inscription_id',

        // === LOCALISATION ===
        'adresse',
        'quartier',
        'ville_id',

        // === CONTACT ===
        'telephone',
        'telephone2',
        'email',

        // === DÉDUPLICATION ET AUDIT ===
        'email_hash',
        'merged_into_id',
        'merged_at',
    ];

    /**
     * L'inscription source qui a généré cette famille
     */
    public function inscription()
    {
        return $this->belongsTo(Inscription::class);
    }

    /**
     * L'utilisateur responsable de la famille
     */
    public function responsable()
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }

    /**
     * Les utilisateurs (User) qui font partie de cette famille
     * (responsable et membres qui ont un compte utilisateur)
     */
    public function users()
    {
        return $this->hasMany(User::class, 'family_id');
    }

    /**
     * La ville de la famille
     */
    public function ville()
    {
        return $this->belongsTo(Ville::class, 'ville_id');
    }

    /**
     * La classe de la famille
     */
    public function classe()
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    /**
     * Relations pour l'audit
     */
    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function updatedByUser()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Génère un code famille au format CF + incrémentation
     * Ex: CF1, CF2, CF3, ...
     * Chaque nouvelle famille reçoit un nouveau numéro
     */
    public static function generateCode(): string
    {
        // Compter le nombre total de familles (non supprimées) pour obtenir le prochain numéro
        $count = static::count();
        $nextNumber = $count + 1;

        // Générer le code au format CF + numéro
        $code = 'CF' . $nextNumber;

        // S'assurer que le code est unique (sécurité supplémentaire)
        while (static::withTrashed()->where('code_famille', $code)->exists()) {
            $nextNumber++;
            $code = 'CF' . $nextNumber;
        }

        return $code;
    }

    /**
     * Auto-génère un code lors de la création si absent
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Family $family) {
            if (empty($family->code_famille)) {
                $family->code_famille = static::generateCode();
            }
        });
    }
}
