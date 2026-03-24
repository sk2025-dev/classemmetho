<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClassTransferRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'family_id',
        'user_id',
        'source_class_id',
        'target_class_id',
        'type',
        'reason',
        'status',
        'reference',
        'destination_city',
        'destination_country',
        'destination_note',
        'validated_by_source_at',
        'validated_by_source_id',
        'validated_by_accueil_at',
        'validated_by_accueil_id',
        'refusal_reason',
        'created_by_id',
    ];

    protected $casts = [
        'validated_by_source_at' => 'datetime',
        'validated_by_accueil_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function family()
    {
        return $this->belongsTo(Family::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sourceClass()
    {
        return $this->belongsTo(Classe::class, 'source_class_id');
    }

    public function targetClass()
    {
        return $this->belongsTo(Classe::class, 'target_class_id');
    }

    public function validatedBySource()
    {
        return $this->belongsTo(User::class, 'validated_by_source_id');
    }

    public function validatedByAccueil()
    {
        return $this->belongsTo(User::class, 'validated_by_accueil_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
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
