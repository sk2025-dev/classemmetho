<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fonction extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $table = 'fonctions';

    protected $fillable = [
        'nom',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Obtenir les utilisateurs ayant cette fonction
     */
    public function users()
    {
        return $this->hasMany(User::class, 'fonction_id');
    }

    /**
     * Utilisateurs liés à cette fonction via pivot multi-fonctions
     */
    public function usersMulti()
    {
        return $this->belongsToMany(User::class, 'fonction_user')
            ->withTimestamps();
    }

    /**
     * Obtenir les inscriptions avec cette fonction
     */
    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'fonction_id');
    }

    /**
     * Obtenir les logs d'audit pour cette fonction
     */
    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'record_id')->where('table_name', 'fonctions');
    }

    /**
     * Récupère les fonctions interdites à l'assignation par les utilisateurs non-admin
     * Comparaison case-insensitive et trim pour robustesse
     */
    public static function forbiddenForAssignation(): \Illuminate\Support\Collection
    {
        $forbiddenNames = [
            'marqueur de présence',
            'marqueur presence',
            'président des conducteurs',
            'president des conducteurs',
        ];

        $placeholders = implode(', ', array_fill(0, count($forbiddenNames), '?'));

        return self::whereRaw('LOWER(TRIM(nom)) IN (' . $placeholders . ')', $forbiddenNames)
            ->get(['id', 'nom']);
    }

    /**
     * Vérifie si une fonction est interdite à l'assignation
     */
    public static function isForbidden(int $fonctionId): bool
    {
        return self::forbiddenForAssignation()->contains('id', $fonctionId);
    }

    /**
     * Récupère le nom d'une fonction interdite pour message d'erreur
     */
    public static function getForbiddenName(int $fonctionId): ?string
    {
        return self::forbiddenForAssignation()->firstWhere('id', $fonctionId)?->nom;
    }
}
