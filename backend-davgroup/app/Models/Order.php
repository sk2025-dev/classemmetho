<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'order_number',
        'client_name',
        'client_email',
        'client_phone',
        'shipping_address',
        'billing_address',
        'subtotal',
        'tax',
        'shipping',
        'discount',
        'total',
        'status',
        'payment_status',
        'payment_method',
        'notes',
        'shipped_at',
        'delivered_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'shipping' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec les articles de commande
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Générer un numéro de commande unique
     */
    public static function generateOrderNumber()
    {
        return 'ORD-' . date('Ymd') . '-' . str_pad(
            self::whereDate('created_at', today())->count() + 1,
            6,
            '0',
            STR_PAD_LEFT
        );
    }

    /**
     * Recalculer le total de la commande
     */
    public function recalculateTotal()
    {
        $this->subtotal = $this->items()->sum('total');
        $this->total = $this->subtotal + $this->tax + $this->shipping - $this->discount;
        return $this;
    }

    /**
     * Marquer comme payée
     */
    public function markAsPaid()
    {
        $this->update(['payment_status' => 'paid']);
        return $this;
    }

    /**
     * Marquer comme expédiée
     */
    public function markAsShipped()
    {
        $this->update([
            'status' => 'shipped',
            'shipped_at' => now(),
        ]);
        return $this;
    }

    /**
     * Marquer comme livrée
     */
    public function markAsDelivered()
    {
        $this->update([
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);
        return $this;
    }

    /**
     * Annuler la commande
     */
    public function cancel()
    {
        $this->update(['status' => 'cancelled']);
        return $this;
    }

    /**
     * Vérifier si la commande peut être modifiée
     */
    public function canBeModified()
    {
        return in_array($this->status, ['pending', 'processing']);
    }

    /**
     * Vérifier si la commande est payée
     */
    public function isPaid()
    {
        return $this->payment_status === 'paid';
    }
}
