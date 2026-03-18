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
     * Generate unique reference
     */
    public static function generateReference()
    {
        do {
            $reference = 'TRF-' . strtoupper(uniqid());
        } while (self::where('reference', $reference)->exists());

        return $reference;
    }
}
