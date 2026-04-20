<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClassTransferRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'demandes_transfert_classe';

    protected $fillable = [
        'famille_id',
        'membre_id',
        'classe_source_id',
        'classe_cible_id',
        'type',
        'mode_transfert',
        'motif',
        'statut',
        'reference',
        'ville_destination',
        'eglise_destination',
        'date_validation_source',
        'validateur_source_id',
        'date_validation_accueil',
        'validateur_accueil_id',
        'motif_refus',
        'createur_id',
        'family_id',
        'user_id',
        'source_class_id',
        'target_class_id',
        'transfer_mode',
        'reason',
        'status',
        'destination_city',
        'destination_church',
        'validated_by_source_at',
        'validated_by_source_id',
        'validated_by_accueil_at',
        'validated_by_accueil_id',
        'refusal_reason',
        'created_by_id',
    ];

    protected $casts = [
        'date_validation_source' => 'datetime',
        'date_validation_accueil' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected array $legacyColumnMap = [
        'family_id' => 'famille_id',
        'user_id' => 'membre_id',
        'source_class_id' => 'classe_source_id',
        'target_class_id' => 'classe_cible_id',
        'transfer_mode' => 'mode_transfert',
        'reason' => 'motif',
        'status' => 'statut',
        'destination_city' => 'ville_destination',
        'destination_church' => 'eglise_destination',
        'validated_by_source_at' => 'date_validation_source',
        'validated_by_source_id' => 'validateur_source_id',
        'validated_by_accueil_at' => 'date_validation_accueil',
        'validated_by_accueil_id' => 'validateur_accueil_id',
        'refusal_reason' => 'motif_refus',
        'created_by_id' => 'createur_id',
    ];

    /**
     * Relationships
     */
    public function family()
    {
        return $this->belongsTo(Family::class, 'famille_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'membre_id');
    }

    public function sourceClass()
    {
        return $this->belongsTo(Classe::class, 'classe_source_id');
    }

    public function targetClass()
    {
        return $this->belongsTo(Classe::class, 'classe_cible_id');
    }

    public function validatedBySource()
    {
        return $this->belongsTo(User::class, 'validateur_source_id');
    }

    public function validatedByAccueil()
    {
        return $this->belongsTo(User::class, 'validateur_accueil_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'createur_id');
    }

    public function getAttribute($key)
    {
        $mappedKey = is_string($key) ? ($this->legacyColumnMap[$key] ?? $key) : $key;

        return parent::getAttribute($mappedKey);
    }

    public function setAttribute($key, $value)
    {
        $mappedKey = is_string($key) ? ($this->legacyColumnMap[$key] ?? $key) : $key;

        return parent::setAttribute($mappedKey, $value);
    }

    /**
     * Generate unique reference with format TRF + incrementation
     * Ex: TRF1, TRF2, TRF3, ...
     */
    public static function generateReference()
    {
        // Compter le nombre total de transferts (non supprimés) pour obtenir le prochain numéro
        $count = static::count();
        $nextNumber = $count + 1;

        // Générer la référence au format TRF + numéro
        $reference = 'TRF' . $nextNumber;

        // S'assurer que la référence est unique (sécurité supplémentaire)
        while (static::withTrashed()->where('reference', $reference)->exists()) {
            $nextNumber++;
            $reference = 'TRF' . $nextNumber;
        }

        return $reference;
    }

    /**
     * Auto-génère une référence lors de la création si absente
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function (ClassTransferRequest $transfer) {
            if (empty($transfer->reference)) {
                $transfer->reference = static::generateReference();
            }
        });
    }
}
