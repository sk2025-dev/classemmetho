<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Promotion extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'title',
        'description',
        'discount_type',
        'discount_value',
        'start_date',
        'end_date',
        'quantity_limit',
        'quantity_used',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Relation avec le produit
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Vérifier si la promotion est active
     */
    public function isActive()
    {
        return $this->is_active 
            && now()->between($this->start_date, $this->end_date)
            && (!$this->quantity_limit || $this->quantity_used < $this->quantity_limit);
    }

    /**
     * Calculer le prix réduit
     */
    public function getDiscountedPrice($originalPrice)
    {
        if ($this->discount_type === 'percentage') {
            return $originalPrice * (1 - ($this->discount_value / 100));
        }
        return max(0, $originalPrice - $this->discount_value);
    }

    /**
     * Obtenir le montant de la réduction
     */
    public function getDiscountAmount($originalPrice)
    {
        if ($this->discount_type === 'percentage') {
            return $originalPrice * ($this->discount_value / 100);
        }
        return $this->discount_value;
    }
}
