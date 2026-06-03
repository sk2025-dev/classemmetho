<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SpecialEvent extends Model
{
    protected $fillable = [
        'title',
        'start_date',      // NOUVEAU : date de début
        'end_date',        // NOUVEAU : date de fin (nullable)
        'start_time',      // NOUVEAU : heure de début (nullable)
        'end_time',        // NOUVEAU : heure de fin (nullable)
        'orateur',
        'moderateur',
        'famille_reception',
        'lieu',
        'class_id',
        'created_by',
        'is_parish',
        'qr_token',
        'qr_expires_at',
    ];
    
    protected $appends = ['date', 'time'];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'is_parish' => 'boolean',
        'qr_expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Generer (ou reutiliser) un token QR et definir son expiration.
     */
    public function ensureQrToken(): string
    {
        $endAt = Carbon::parse($this->start_date);
        if (!empty($this->end_time)) {
            $endTime = Carbon::parse($this->end_time);
            $endAt->setTime($endTime->hour, $endTime->minute, $endTime->second);
        } elseif (!empty($this->start_time)) {
            $startTime = Carbon::parse($this->start_time);
            $endAt->setTime($startTime->hour, $startTime->minute, $startTime->second);
        } else {
            $endAt->setTime(23, 59, 59);
        }

        if (empty($this->qr_token)) {
            $this->qr_token = Str::random(40);
        }

        $this->qr_expires_at = $endAt;
        $this->save();

        return $this->qr_token;
    }
    
    // ========== ACCESSEURS POUR COMPATIBILITÉ AVEC L'ANCIEN CODE ==========
    
    /**
     * Accesseur pour 'date' (compatibilité avec l'ancien code)
     */
    public function getDateAttribute()
    {
        return $this->start_date ? $this->start_date->format('Y-m-d') : null;
    }
    
    /**
     * Mutateur pour 'date' (compatibilité avec l'ancien code)
     */
    public function setDateAttribute($value)
    {
        $this->attributes['start_date'] = $value;
    }
    
    /**
     * Accesseur pour 'time' (compatibilité avec l'ancien code)
     */
    public function getTimeAttribute()
    {
        return $this->start_time ? Carbon::parse($this->start_time)->format('H:i') : null;
    }
    
    /**
     * Mutateur pour 'time' (compatibilité avec l'ancien code)
     */
    public function setTimeAttribute($value)
    {
        $this->attributes['start_time'] = $value;
    }
    
    // ========== RELATIONS ==========
    
    /**
     * Relation avec la classe
     */
    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'class_id');
    }
    
    /**
     * Relation avec le créateur (conducteur)
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    
    /**
     * Relation avec les médias associés
     */
    public function medias(): HasMany
    {
        return $this->hasMany(Media::class, 'special_event_id');
    }
    
    // ========== ACCESSEURS DE FORMATAGE ==========
    
    /**
     * Accesseur pour la date de début formatée
     */
    public function getFormattedStartDateAttribute(): string
    {
        return $this->start_date ? $this->start_date->format('d/m/Y') : '';
    }
    
    /**
     * Accesseur pour la date de fin formatée
     */
    public function getFormattedEndDateAttribute(): string
    {
        return $this->end_date ? $this->end_date->format('d/m/Y') : '';
    }
    
    /**
     * Accesseur pour la plage de dates formatée
     */
    public function getFormattedDateRangeAttribute(): string
    {
        if (!$this->start_date) {
            return '';
        }
        
        if ($this->end_date && $this->start_date->format('Y-m-d') !== $this->end_date->format('Y-m-d')) {
            return $this->start_date->format('d/m/Y') . ' → ' . $this->end_date->format('d/m/Y');
        }
        
        return $this->start_date->format('d/m/Y');
    }
    
    /**
     * Accesseur pour l'heure de début formatée
     */
    public function getFormattedStartTimeAttribute(): string
    {
        return $this->start_time ? Carbon::parse($this->start_time)->format('H:i') : '';
    }
    
    /**
     * Accesseur pour l'heure de fin formatée
     */
    public function getFormattedEndTimeAttribute(): string
    {
        return $this->end_time ? Carbon::parse($this->end_time)->format('H:i') : '';
    }
    
    /**
     * Accesseur pour la plage horaire formatée
     */
    public function getFormattedTimeRangeAttribute(): string
    {
        if (!$this->start_time) {
            return '';
        }
        
        $start = Carbon::parse($this->start_time)->format('H:i');
        
        if ($this->end_time) {
            $end = Carbon::parse($this->end_time)->format('H:i');
            return $start . ' → ' . $end;
        }
        
        return $start;
    }
    
    /**
     * Accesseur pour la date complète formatée (date de début)
     */
    public function getFullDateAttribute(): string
    {
        return $this->start_date ? $this->start_date->translatedFormat('l d F Y') : '';
    }
    
    // ========== SCOPES ==========
    
    /**
     * Scope pour les événements à venir
     */
    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>=', now()->startOfDay())
            ->orderBy('start_date', 'asc')
            ->orderBy('start_time', 'asc');
    }
    
    /**
     * Scope pour les événements passés
     */
    public function scopePast($query)
    {
        return $query->where('start_date', '<', now()->startOfDay())
            ->orderBy('start_date', 'desc')
            ->orderBy('start_time', 'desc');
    }
    
    /**
     * Scope pour les événements d'une année spécifique
     */
    public function scopeForYear($query, $year)
    {
        return $query->whereYear('start_date', $year);
    }
    
    /**
     * Scope pour les événements d'une classe spécifique
     */
    public function scopeForClass($query, $classId)
    {
        return $query->where('class_id', $classId);
    }
    
    /**
     * Scope pour les événements non paroissiaux
     */
    public function scopeNonParish($query)
    {
        return $query->where('is_parish', false);
    }
    
    /**
     * Scope pour les événements d'un mois spécifique
     */
    public function scopeForMonth($query, $month)
    {
        return $query->whereMonth('start_date', $month);
    }
    
    // ========== MÉTHODES UTILITAIRES ==========
    
    /**
     * Vérifier si l'événement est à venir
     */
    public function isUpcoming(): bool
    {
        return $this->start_date >= now()->startOfDay();
    }
    
    /**
     * Vérifier si l'événement est passé
     */
    public function isPast(): bool
    {
        return $this->start_date < now()->startOfDay();
    }
    
    /**
     * Vérifier si l'événement est aujourd'hui
     */
    public function isToday(): bool
    {
        return $this->start_date && $this->start_date->isToday();
    }
    
    /**
     * Vérifier si l'événement est multi-jours
     */
    public function isMultiDay(): bool
    {
        return $this->end_date && $this->start_date->format('Y-m-d') !== $this->end_date->format('Y-m-d');
    }
    
    /**
     * Obtenir le nombre de médias associés
     */
    public function getMediaCountAttribute(): int
    {
        return $this->medias()->count();
    }
    
    /**
     * Obtenir la durée en jours de l'événement
     */
    public function getDurationInDaysAttribute(): int
    {
        if (!$this->end_date) {
            return 1;
        }
        
        return $this->start_date->diffInDays($this->end_date) + 1;
    }
}
