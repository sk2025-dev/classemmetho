<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rdv extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rdvs';

    protected $fillable = [
        'user_id',
        'client_name',
        'client_email',
        'client_phone',
        'appointment_date',
        'service',
        'notes',
        'status',
        'duration',
        'is_notified',
    ];

    protected $casts = [
        'appointment_date' => 'datetime',
        'is_notified' => 'boolean',
    ];

    /**
     * Relation avec l'utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Vérifier si le rendez-vous est passé
     */
    public function isPassed()
    {
        return $this->appointment_date < now();
    }

    /**
     * Vérifier si le rendez-vous est à venir
     */
    public function isUpcoming()
    {
        return $this->appointment_date > now();
    }

    /**
     * Obtenir les rendez-vous à venir
     */
    public static function upcoming()
    {
        return static::where('appointment_date', '>', now())
            ->where('status', '!=', 'cancelled')
            ->orderBy('appointment_date');
    }

    /**
     * Obtenir les rendez-vous passés
     */
    public static function past()
    {
        return static::where('appointment_date', '<', now())
            ->orderBy('appointment_date', 'desc');
    }

    /**
     * Marquer comme confirmé
     */
    public function confirm()
    {
        $this->update(['status' => 'confirmed']);
        return $this;
    }

    /**
     * Marquer comme complété
     */
    public function complete()
    {
        $this->update(['status' => 'completed']);
        return $this;
    }

    /**
     * Marquer comme annulé
     */
    public function cancel()
    {
        $this->update(['status' => 'cancelled']);
        return $this;
    }
}
