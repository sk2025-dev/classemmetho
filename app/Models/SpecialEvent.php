<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SpecialEvent extends Model
{
    protected $fillable = [
        'title',
        'date',
        'time',
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

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime:H:i',
        'is_parish' => 'boolean',
        'qr_expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'scan_url',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $event): void {
            if (empty($event->qr_token)) {
                $event->qr_token = self::generateUniqueQrToken();
            }
        });
    }

    public static function generateUniqueQrToken(): string
    {
        do {
            $token = Str::lower(Str::random(40));
        } while (self::query()->where('qr_token', $token)->exists());

        return $token;
    }

    public function ensureQrToken(): string
    {
        if (!empty($this->qr_token)) {
            return (string) $this->qr_token;
        }

        $this->forceFill([
            'qr_token' => self::generateUniqueQrToken(),
        ])->save();

        return (string) $this->qr_token;
    }

    public function getScanUrlAttribute(): ?string
    {
        if (empty($this->qr_token)) {
            return null;
        }

        return url('/presence/' . $this->qr_token);
    }

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

    /**
     * Accesseur pour la date formatée
     */
    public function getFormattedDateAttribute(): string
    {
        return $this->date->format('d/m/Y');
    }

    /**
     * Accesseur pour l'heure formatée
     */
    public function getFormattedTimeAttribute(): string
    {
        return $this->time ? \Carbon\Carbon::parse($this->time)->format('H:i') : '';
    }

    /**
     * Accesseur pour la date complète formatée
     */
    public function getFullDateAttribute(): string
    {
        return $this->date->translatedFormat('l d F Y');
    }

    /**
     * Scope pour les événements à venir
     */
    public function scopeUpcoming($query)
    {
        return $query->where('date', '>=', now()->startOfDay())
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc');
    }

    /**
     * Scope pour les événements passés
     */
    public function scopePast($query)
    {
        return $query->where('date', '<', now()->startOfDay())
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc');
    }

    /**
     * Scope pour les événements d'une année spécifique
     */
    public function scopeForYear($query, $year)
    {
        return $query->whereYear('date', $year);
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
     * Vérifier si l'événement est à venir
     */
    public function isUpcoming(): bool
    {
        return $this->date >= now()->startOfDay();
    }

    /**
     * Vérifier si l'événement est passé
     */
    public function isPast(): bool
    {
        return $this->date < now()->startOfDay();
    }

    /**
     * Vérifier si l'événement est aujourd'hui
     */
    public function isToday(): bool
    {
        return $this->date->isToday();
    }

    /**
     * Obtenir le nombre de médias associés
     */
    public function getMediaCountAttribute(): int
    {
        return $this->medias()->count();
    }
}
