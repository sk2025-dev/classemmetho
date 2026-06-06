<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'cost',
        'quantity',
        'min_quantity',
        'image',
        'sku',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Relation avec la catégorie
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Relation avec les promotions
     */
    public function promotions()
    {
        return $this->hasMany(Promotion::class);
    }

    /**
     * Relation avec les articles de commande
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Obtenir les promotions actives
     */
    public function activePromotions()
    {
        return $this->promotions()
            ->where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    /**
     * Vérifier si le produit est en rupture de stock
     */
    public function isOutOfStock()
    {
        return $this->quantity <= 0;
    }

    /**
     * Vérifier si le stock est faible
     */
    public function isLowStock()
    {
        return $this->quantity <= $this->min_quantity;
    }
}
